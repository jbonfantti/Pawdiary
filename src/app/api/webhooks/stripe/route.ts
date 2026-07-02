import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db/client";
import { users, subscriptions, type subscriptionStatusValues } from "@/lib/db/schema";

type SubscriptionStatus = (typeof subscriptionStatusValues)[number];

// Stripe statuses not in our enum (incomplete_expired, unpaid, paused) all mean
// "not entitled to premium", so they collapse to canceled.
function toDbStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
    case "trialing":
    case "past_due":
    case "incomplete":
      return stripeStatus;
    default:
      return "canceled";
  }
}

// current_period_end lives on subscription items in current Stripe API versions.
function periodEnd(subscription: Stripe.Subscription): Date | null {
  const end = subscription.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const clerkId = session.client_reference_id;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;
      const email = session.customer_details?.email;

      if (!clerkId || !customerId) break;

      // The Clerk webhook that syncs users isn't built yet, so upsert the user
      // here to guarantee the FK target exists whatever the ordering.
      const [user] = await db
        .insert(users)
        .values({ clerkId, email: email ?? "" })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { email: email ?? "" },
        })
        .returning();

      const subscription = subscriptionId
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : null;

      await db
        .insert(subscriptions)
        .values({
          userId: user.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: subscription ? toDbStatus(subscription.status) : "active",
          currentPeriodEnd: subscription ? periodEnd(subscription) : null,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: subscription ? toDbStatus(subscription.status) : "active",
            currentPeriodEnd: subscription ? periodEnd(subscription) : null,
          },
        });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await db
        .update(subscriptions)
        .set({
          status: toDbStatus(subscription.status),
          currentPeriodEnd: periodEnd(subscription),
        })
        .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      if (invoice.customer) {
        await db
          .update(subscriptions)
          .set({ status: "past_due" })
          .where(eq(subscriptions.stripeCustomerId, invoice.customer as string));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
