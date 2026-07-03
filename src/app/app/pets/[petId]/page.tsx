import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { healthRecords, pets, timelineEntries } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { addHealthRecord, addPhotoEntry } from "../../actions";
import {
  AddHealthRecordForm,
  RECORD_TYPE_LABELS,
} from "@/components/AddHealthRecordForm";
import { WeightChart } from "@/components/WeightChart";

const LB_PER_KG = 2.20462;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default async function PetPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const { petId } = await params;

  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, user.id)))
    .limit(1);
  if (!pet) notFound();

  const entries = await db
    .select()
    .from(timelineEntries)
    .where(eq(timelineEntries.petId, pet.id))
    .orderBy(desc(timelineEntries.occurredAt));

  const records = await db
    .select()
    .from(healthRecords)
    .where(eq(healthRecords.petId, pet.id))
    .orderBy(desc(healthRecords.recordedAt));

  const weightPoints = records.filter(
    (r): r is typeof r & { weightKg: string } =>
      r.type === "weight" && r.weightKg !== null,
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/app" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Your pets
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">{pet.name}</h1>
      {pet.breed && <p className="mt-1 text-zinc-500">{pet.breed}</p>}

      <section className="mt-8 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">Add a photo</h2>
        <form action={addPhotoEntry} className="mt-4 grid gap-4">
          <input type="hidden" name="petId" value={pet.id} />
          <input
            name="photo"
            type="file"
            accept="image/*"
            required
            className="text-sm"
          />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Caption (optional)</span>
            <input
              name="caption"
              maxLength={280}
              placeholder="First day at the beach!"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Add to diary
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">Health book</h2>
        <AddHealthRecordForm petId={pet.id} action={addHealthRecord} />

        <WeightChart points={weightPoints} />

        {records.length > 0 && (
          <ul className="mt-4 grid gap-2">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex items-baseline justify-between rounded-lg bg-zinc-50 px-4 py-2.5 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {RECORD_TYPE_LABELS[record.type]}
                  </span>
                  {record.type === "weight" && record.weightKg && (
                    <span className="ml-2">
                      {(Number(record.weightKg) * LB_PER_KG).toFixed(1)} lbs
                    </span>
                  )}
                  {record.notes && (
                    <span className="ml-2 text-zinc-500">{record.notes}</span>
                  )}
                </span>
                <span className="text-xs text-zinc-500">
                  {dateFormat.format(record.recordedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Timeline</h2>
        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            No memories yet — add the first photo above.
          </p>
        ) : (
          <ul className="mt-4 grid gap-6">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-zinc-200 p-4">
                {entry.mediaUrl && (
                  // Served through our authed proxy route; the blob itself is private.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/diary/${entry.id}`}
                    alt={entry.caption ?? `${pet.name} photo`}
                    className="w-full rounded-xl object-cover"
                  />
                )}
                {entry.caption && <p className="mt-3 text-sm">{entry.caption}</p>}
                <p className="mt-2 text-xs text-zinc-500">
                  {dateFormat.format(entry.occurredAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
