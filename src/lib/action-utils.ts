import { z } from "zod";
import { auth } from "@/lib/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Standardized action wrapper that provides:
 * - Authentication check
 * - Rate limiting
 * - Zod validation (for FormData or plain objects)
 * - Consistent error handling
 */
export async function withAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in to continue");
  if (!session.user.organizationId) throw new Error("No organization found");

  // Rate limit by user ID
  const rl = await rateLimit(session.user.id, RATE_LIMITS.action);
  if (!rl.success) throw new Error("Too many requests. Please wait a moment.");

  return session;
}

/**
 * Parse and validate FormData against a Zod schema.
 * Returns typed, sanitized data or throws a user-friendly error.
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): z.infer<T> {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    raw[key] = value;
  });

  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues?.[0];
    throw new Error(firstError?.message || "Invalid input");
  }
  return result.data;
}

/**
 * Parse and validate a plain object against a Zod schema.
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues?.[0];
    throw new Error(firstError?.message || "Invalid input");
  }
  return result.data;
}
