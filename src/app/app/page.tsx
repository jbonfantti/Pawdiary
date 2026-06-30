import { UserButton } from "@clerk/nextjs";

export default function AppHomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Your pets</h1>
        <UserButton />
      </div>
      <p className="mt-4 text-zinc-600">
        No pets yet. Add your first pet to start their diary.
      </p>
    </main>
  );
}
