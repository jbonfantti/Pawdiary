import { APP_NAME } from "@/lib/legal/constants";

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 prose">
      <h1>{APP_NAME} Cookie Policy</h1>
      {/* TODO: list cookies/tracking — Meta CAPI, GA4, Cloudflare Turnstile. Suppressed entirely on iOS native shell. */}
    </main>
  );
}
