import { APP_NAME, SUPPORT_EMAIL } from "@/lib/legal/constants";

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 prose">
      <h1>Delete Your {APP_NAME} Account</h1>
      <p>
        To permanently delete your account and all associated pet data, sign
        in and go to Settings → Delete Account. Alternatively, email{" "}
        {SUPPORT_EMAIL} from your account&apos;s email address and we will
        delete your data within 30 days.
      </p>
      {/* TODO: wire up in-app delete flow once Clerk + DB are connected */}
    </main>
  );
}
