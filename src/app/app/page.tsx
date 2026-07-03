import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { hasPremium } from "@/lib/premium";
import { UpgradeButton } from "@/components/UpgradeButton";

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { userId } = await auth();
  const premium = userId ? await hasPremium(userId) : false;
  const { upgraded } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Your pets</h1>
        <div className="flex items-center gap-3">
          {premium && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Premium
            </span>
          )}
          <UserButton />
        </div>
      </div>

      {upgraded === "true" && !premium && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Thanks! Your subscription is being activated — this can take a few
          seconds. Refresh shortly.
        </p>
      )}
      {upgraded === "true" && premium && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Welcome to Premium! AI health monitoring is now enabled for your pets.
        </p>
      )}

      <p className="mt-4 text-zinc-600">
        No pets yet. Add your first pet to start their diary.
      </p>

      {!premium && (
        <section className="mt-10 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">PawDiary Premium</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-zinc-600">
            <li>AI health &amp; behavior monitoring with gentle alerts</li>
            <li>Yearly recap video of your pet&apos;s best moments</li>
            <li>Unlimited AI avatars</li>
          </ul>
          <div className="mt-5">
            <UpgradeButton />
          </div>
        </section>
      )}
    </main>
  );
}
