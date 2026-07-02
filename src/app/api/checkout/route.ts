import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe, PREMIUM_PRICE_ID } from "@/lib/stripe";

const APP_URL = "https://pawdiary.io";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
    // client_reference_id carries the Clerk user id through to the webhook,
    // which is our only reliable link between a Stripe customer and our user.
    client_reference_id: userId,
    customer_email: email,
    success_url: `${APP_URL}/app?upgraded=true`,
    cancel_url: `${APP_URL}/app`,
  });

  return NextResponse.json({ url: session.url });
}
