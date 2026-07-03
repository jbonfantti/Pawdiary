import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { UserButton } from "@clerk/nextjs";
import { db } from "@/lib/db/client";
import { pets } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { hasPremium } from "@/lib/premium";
import { UpgradeButton } from "@/components/UpgradeButton";
import { addPet } from "./actions";

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const user = await getOrCreateUser();
  const premium = user ? await hasPremium(user.clerkId) : false;
  const { upgraded } = await searchParams;

  const myPets = user
    ? await db
        .select()
        .from(pets)
        .where(eq(pets.userId, user.id))
        .orderBy(desc(pets.createdAt))
    : [];

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

      {upgraded === "true" && premium && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Welcome to Premium! AI health monitoring is now enabled for your pets.
        </p>
      )}

      {myPets.length === 0 ? (
        <p className="mt-4 text-zinc-600">
          No pets yet. Add your first pet to start their diary.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {myPets.map((pet) => (
            <li key={pet.id}>
              <Link
                href={`/app/pets/${pet.id}`}
                className="block rounded-2xl border border-zinc-200 p-5 hover:border-zinc-400"
              >
                <span className="text-lg font-medium">{pet.name}</span>
                {pet.breed && (
                  <span className="ml-2 text-sm text-zinc-500">{pet.breed}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">Add a pet</h2>
        <form action={addPet} className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Name</span>
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Rex"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Breed (optional)</span>
            <input
              name="breed"
              maxLength={80}
              placeholder="Golden Retriever"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Birth date (optional)</span>
            <input
              name="birthDate"
              type="date"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Add pet
          </button>
        </form>
      </section>

      {!premium && (
        <section className="mt-6 rounded-2xl border border-zinc-200 p-6">
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
