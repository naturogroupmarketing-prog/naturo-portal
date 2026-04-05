import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Role } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });

        if (!user || !user.isActive || !user.password) {
          logSecurityEvent("LOGIN_FAILED", email, "Invalid credentials or inactive account");
          return null;
        }

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          logSecurityEvent("LOGIN_FAILED", email, "Account locked");
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          // Increment failed attempts, lock after 5
          const attempts = (user.failedLoginAttempts || 0) + 1;
          const lockData: { failedLoginAttempts: number; lockedUntil?: Date } = { failedLoginAttempts: attempts };
          if (attempts >= 5) {
            lockData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
          }
          await db.user.update({ where: { id: user.id }, data: lockData });
          logSecurityEvent("LOGIN_FAILED", email, `Incorrect password (attempt ${attempts})`);
          return null;
        }

        // Successful login — reset failed attempts
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
        }
        logSecurityEvent("LOGIN_SUCCESS", email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        // Force immediate DB fetch on sign-in
        token.lastRefresh = 0;
      }
      // Refresh role/region/org from DB every 2 minutes
      const now = Date.now();
      const lastRefresh = (token.lastRefresh as number) || 0;
      const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

      if (token.sub && now - lastRefresh > REFRESH_INTERVAL) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, regionId: true, isActive: true, organizationId: true, sessionVersion: true },
        });
        if (dbUser) {
          // Invalidate session if password was changed (sessionVersion mismatch)
          if (token.sessionVersion && dbUser.sessionVersion !== token.sessionVersion) {
            return { ...token, isActive: false }; // Force re-login
          }
          token.sessionVersion = dbUser.sessionVersion;
          token.role = dbUser.role;
          token.regionId = dbUser.regionId;
          token.isActive = dbUser.isActive;
          token.organizationId = dbUser.organizationId;
          token.lastRefresh = now;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.regionId = token.regionId as string | null;
        session.user.isActive = token.isActive as boolean;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
      });
      if (dbUser && !dbUser.isActive) return false;
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      regionId: string | null;
      organizationId: string | null;
      isActive: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    regionId?: string | null;
    organizationId?: string | null;
    isActive?: boolean;
  }
}

/**
 * Security event logger — tracks login attempts, password changes, etc.
 * Non-blocking: errors are caught silently to avoid breaking auth flow.
 */
async function logSecurityEvent(event: string, email: string, details?: string) {
  try {
    // Find user's org for audit log
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, organizationId: true },
    });

    if (user?.organizationId) {
      await db.auditLog.create({
        data: {
          action: event === "LOGIN_SUCCESS" ? "USER_UPDATED" : "USER_UPDATED",
          description: `Security: ${event}${details ? ` — ${details}` : ""} (${email})`,
          performedById: user.id,
          organizationId: user.organizationId,
          metadata: JSON.stringify({ event, email, timestamp: new Date().toISOString() }),
        },
      });

      // Alert admins on repeated failures (5+ in audit log today)
      if (event === "LOGIN_FAILED") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const failCount = await db.auditLog.count({
          where: {
            organizationId: user.organizationId,
            description: { contains: "LOGIN_FAILED" },
            createdAt: { gte: today },
          },
        });

        if (failCount >= 5 && failCount % 5 === 0) {
          // Notify admins every 5 failed attempts
          const { notifyAdminsAndManagers } = await import("@/lib/notifications");
          await notifyAdminsAndManagers({
            organizationId: user.organizationId,
            type: "GENERAL",
            title: "Security Alert: Multiple Failed Logins",
            message: `${failCount} failed login attempts detected today for ${email}. This may indicate a brute-force attack.`,
            link: "/activity",
          });
        }
      }
    }
  } catch {
    // Never let security logging break the auth flow
  }
}
