import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { healthRecords, pets, timelineEntries } from "@/lib/db/schema";
import { getOrCreateUser } from "@/lib/user";
import {
  addCareReminder,
  addHealthRecord,
  addPhotoEntry,
  completeCareReminder,
  deleteCareReminder,
} from "../../actions";
import {
  AddHealthRecordForm,
  RECORD_TYPE_LABELS,
} from "@/components/AddHealthRecordForm";
import { WeightChart } from "@/components/WeightChart";
import { AIStudio } from "@/components/AIStudio";
import { PhotoFilterButton } from "@/components/PhotoFilterButton";
import { hasPremium } from "@/lib/premium";
import { getOpenRemindersForUser } from "@/lib/reminders/queries";
import { AddCareReminderForm } from "@/components/AddCareReminderForm";
import { CareReminderList } from "@/components/CareReminderList";
import { ReminderScheduler } from "@/components/ReminderScheduler";

// AI image generation runs inside server actions invoked from this page and
// can take ~30s; the default function timeout would cut it off.
export const maxDuration = 60;

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

  const premium = await hasPremium(user.clerkId);

  // Fetched across all pets so the native scheduler never drops other pets'
  // notifications when it re-syncs from this page.
  const allReminders = await getOpenRemindersForUser(user.id);
  const petReminders = allReminders.filter((r) => r.petId === pet.id);

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

      <ReminderScheduler
        reminders={allReminders.map((r) => ({
          id: r.id,
          petName: r.petName,
          title: r.title,
          dueAt: r.dueAt.toISOString(),
        }))}
      />

      <section className="mt-8 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">Care reminders</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Vaccines, flea &amp; tick, heartworm and meds, so nothing slips. Always follow
          your vet&apos;s schedule.
        </p>
        <CareReminderList
          reminders={petReminders}
          completeAction={completeCareReminder}
          deleteAction={deleteCareReminder}
        />
        <AddCareReminderForm petId={pet.id} action={addCareReminder} />
      </section>

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
            <span className="text-xs text-zinc-500">
              ✨ Leave it blank and our AI will write one for you.
            </span>
          </label>
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Add to diary
          </button>
        </form>
      </section>

      <AIStudio petId={pet.id} premium={premium} />

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
                {entry.caption && (
                  <p className="mt-3 text-sm">
                    {entry.caption}
                    {entry.aiGenerated && (
                      <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                        AI
                      </span>
                    )}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  {dateFormat.format(entry.occurredAt)}
                </p>
                {entry.mediaUrl && !entry.aiGenerated && (
                  <PhotoFilterButton entryId={entry.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
