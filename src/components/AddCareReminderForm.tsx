"use client";

import { useState } from "react";
import type { careReminderTypeValues } from "@/lib/db/schema";

type ReminderType = (typeof careReminderTypeValues)[number];

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  vaccine: "Vaccine",
  dewormer: "Dewormer",
  flea_tick: "Flea & tick",
  heartworm: "Heartworm",
  medication: "Medication",
  vet_visit: "Vet visit",
  grooming: "Grooming",
  other: "Other",
};

// Common cadences, used to prefill the repeat field. Owners should follow
// what their vet prescribes, so every value stays editable.
const DEFAULTS: Record<ReminderType, { title: string; repeatDays: number }> = {
  vaccine: { title: "Rabies booster", repeatDays: 365 },
  dewormer: { title: "Dewormer", repeatDays: 90 },
  flea_tick: { title: "Flea & tick dose", repeatDays: 30 },
  heartworm: { title: "Heartworm pill", repeatDays: 30 },
  medication: { title: "Medication", repeatDays: 1 },
  vet_visit: { title: "Annual checkup", repeatDays: 365 },
  grooming: { title: "Grooming", repeatDays: 42 },
  other: { title: "", repeatDays: 0 },
};

const REPEAT_OPTIONS = [
  { value: 0, label: "Doesn't repeat" },
  { value: 1, label: "Every day" },
  { value: 7, label: "Every week" },
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Every month" },
  { value: 42, label: "Every 6 weeks" },
  { value: 90, label: "Every 3 months" },
  { value: 180, label: "Every 6 months" },
  { value: 365, label: "Every year" },
];

export function AddCareReminderForm({
  petId,
  action,
}: {
  petId: string;
  action: (formData: FormData) => void;
}) {
  const [type, setType] = useState<ReminderType>("vaccine");
  const [title, setTitle] = useState(DEFAULTS.vaccine.title);
  const [repeatDays, setRepeatDays] = useState(DEFAULTS.vaccine.repeatDays);

  function changeType(next: ReminderType) {
    setType(next);
    setTitle(DEFAULTS[next].title);
    setRepeatDays(DEFAULTS[next].repeatDays);
  }

  return (
    <form action={action} className="mt-4 grid gap-4">
      <input type="hidden" name="petId" value={petId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            name="type"
            value={type}
            onChange={(e) => changeType(e.target.value as ReminderType)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
          >
            {Object.entries(REMINDER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">What</span>
          <input
            name="title"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Next due</span>
          <input
            name="dueAt"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Repeat</span>
          <select
            name="repeatDays"
            value={repeatDays}
            onChange={(e) => setRepeatDays(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
          >
            {REPEAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Add reminder
      </button>
    </form>
  );
}
