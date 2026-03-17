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
        if (!user) return null;
        if (!user.isActive) return null;
        if (!user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

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
      }
      // Always refresh role, regionId, and isActive from DB
      // so admin changes (e.g. region reassignment) take effect immediately
      if (token.sub) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, regionId: true, isActive: true, organizationId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.regionId = dbUser.regionId;
          token.isActive = dbUser.isActive;
          token.organizationId = dbUser.organizationId;
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
