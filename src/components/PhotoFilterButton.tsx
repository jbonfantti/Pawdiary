"use client";

import { useState, useTransition } from "react";
import { applyFilterToEntry } from "@/app/app/studio-actions";

const STYLE_OPTIONS = [
  { value: "cartoon", label: "Cartoon" },
  { value: "watercolor", label: "Watercolor" },
  { value: "pop_art", label: "Pop Art" },
  { value: "pixel_art", label: "Pixel Art" },
  { value: "oil_painting", label: "Oil Painting" },
];

const ERROR_MESSAGES: Record<string, string> = {
  premium_required: "Filters are a Premium feature — upgrade to unlock them.",
  no_photo: "This photo could not be loaded.",
  failed: "Something went wrong. Please try again.",
  unauthorized: "Please sign in again.",
};

export function PhotoFilterButton({ entryId }: { entryId: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    { kind: "error" | "success"; message: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  function apply(style: string) {
    setStatus(null);
    startTransition(async () => {
      const result = await applyFilterToEntry(entryId, style);
      if (result.ok) {
        setStatus({
          kind: "success",
          message: "Filtered photo added to the timeline! ✨",
        });
        setOpen(false);
      } else {
        setStatus({
          kind: "error",
          message: ERROR_MESSAGES[result.error ?? "failed"],
        });
      }
    });
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-violet-600 hover:text-violet-800"
        >
          Apply filter ✨
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => apply(option.value)}
              disabled={pending}
              className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 hover:border-violet-500 hover:text-violet-700 disabled:opacity-50"
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            disabled={pending}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            Cancel
          </button>
        </div>
      )}
      {pending && (
        <p className="mt-1 text-xs text-zinc-500">Applying filter… up to 30s.</p>
      )}
      {status && (
        <p
          className={`mt-1 text-xs ${
            status.kind === "success" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
