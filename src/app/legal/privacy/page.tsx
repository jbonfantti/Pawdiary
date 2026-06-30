import { APP_NAME, PRIVACY_EMAIL } from "@/lib/legal/constants";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 prose">
      <h1>{APP_NAME} Privacy Policy</h1>
      {/* TODO: fill in full policy before launch — data collected, third parties (Clerk, Stripe, Google Places, Meta CAPI, GA4, Sentry), retention, contact */}
      <p>Contact: {PRIVACY_EMAIL}</p>
    </main>
  );
}
