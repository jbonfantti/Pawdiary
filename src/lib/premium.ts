import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscriptions, users } from "@/lib/db/schema";

const PREMIUM_STATUSES = new Set(["active", "trialing"]);

/**
 * Whether the given Clerk user currently has premium access.
 * Premium features (AI health monitoring, yearly recap, unlimited avatars)
 * must all gate through this single check.
 */
export async function hasPremium(clerkId: string): Promise<boolean> {
  const rows = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  const status = rows[0]?.status;
  return status !== undefined && PREMIUM_STATUSES.has(status);
}
