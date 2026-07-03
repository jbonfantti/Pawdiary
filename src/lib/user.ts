import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Returns the DB user row for the signed-in Clerk user, creating it on first
 * touch. Needed because the only other writer of `users` today is the Stripe
 * webhook, and most users interact with pets/diary before ever paying.
 */
export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(users)
    .values({ clerkId: clerkUser.id, email })
    .onConflictDoUpdate({ target: users.clerkId, set: { email } })
    .returning();
  return created;
}
