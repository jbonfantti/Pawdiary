"use client";

import { useState } from "react";
import type { healthRecordTypeValues } from "@/lib/db/schema";

type RecordType = (typeof healthRecordTypeValues)[number];

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  weight: "Weight",
  vaccine: "Vaccine",
  dewormer: "Dewormer",
  vet_visit: "Vet visit",
};

export function AddHealthRecordForm({
  petId,
  action,
}: {
  petId: string;
  action: (formData: FormData) => void;
}) {
  const [type, setType] = useState<RecordType>("weight");

  return (
    <form action={action} className="mt-4 grid gap-4">
      <input type="hidden" name="petId" value={petId} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Record type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as RecordType)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
        >
          {Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {type === "weight" && (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Weight (lbs)</span>
          <input
            name="weightLb"
            type="number"
            step="0.1"
            min="0.1"
            max="500"
            required
            placeholder="12.5"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
      )}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">
          {type === "weight" ? "Notes (optional)" : "Details (optional)"}
        </span>
        <input
          name="notes"
          maxLength={280}
          placeholder={
            type === "vaccine"
              ? "Rabies booster"
              : type === "vet_visit"
                ? "Annual checkup — all good"
                : ""
          }
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Date</span>
        <input
          name="recordedAt"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Add record
      </button>
    </form>
  );
}
