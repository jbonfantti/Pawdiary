"use client";

import { useState, useTransition } from "react";
import {
  generateAvatar,
  generateStylistPreview,
  getOutfitSuggestions,
} from "@/app/app/studio-actions";

const AVATAR_STYLE_OPTIONS = [
  { value: "cartoon", label: "Cartoon" },
  { value: "watercolor", label: "Watercolor" },
  { value: "pop_art", label: "Pop Art" },
  { value: "pixel_art", label: "Pixel Art" },
  { value: "oil_painting", label: "Oil Painting" },
];

// Suggestion lines start with a decorative emoji; the accessory prompt
// reads better without it.
function stripEmoji(line: string): string {
  return line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

const ERROR_MESSAGES: Record<string, string> = {
  premium_required: "Image generation is a Premium feature — upgrade to unlock it.",
  no_photo: "Add a photo to the diary first so the AI has something to work with.",
  failed: "Something went wrong. Please try again.",
  unauthorized: "Please sign in again.",
};

export function AIStudio({ petId, premium }: { petId: string; premium: boolean }) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [accessory, setAccessory] = useState("");
  const [style, setStyle] = useState("cartoon");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: boolean; suggestions?: string; error?: string }>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error ?? "failed"]);
        return;
      }
      if (result.suggestions) {
        setSuggestions(result.suggestions);
      } else {
        setNotice("Done! Your new image was added to the timeline below. ✨");
      }
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50/40 p-6">
      <h2 className="text-lg font-semibold">
        AI Studio <span aria-hidden>✨</span>
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Uses the most recent photo in the diary.
      </p>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="font-medium">Stylist</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Outfit &amp; accessory ideas for your pet.
          </p>
          <button
            onClick={() => run(() => getOutfitSuggestions(petId))}
            disabled={pending}
            className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Get outfit ideas
          </button>

          {suggestions && (
            <div className="mt-3 grid gap-2">
              {suggestions
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => (
                  <button
                    key={line}
                    onClick={() => setAccessory(stripEmoji(line))}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 hover:border-violet-400 hover:bg-violet-50"
                  >
                    {line}
                  </button>
                ))}
              <p className="text-xs text-zinc-500">
                Tap an idea to try it on below.
              </p>
            </div>
          )}

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-600">
              Try it on {premium ? "" : "(Premium)"}
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={accessory}
                onChange={(e) => setAccessory(e.target.value)}
                maxLength={120}
                placeholder="a red bow tie"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => run(() => generateStylistPreview(petId, accessory))}
                disabled={pending || !accessory.trim()}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="font-medium">Avatars {premium ? "" : "(Premium)"}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Turn your pet into art — cartoon, watercolor, and more.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AVATAR_STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStyle(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  style === option.value
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => run(() => generateAvatar(petId, style))}
            disabled={pending}
            className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Generate avatar
          </button>
        </div>
      </div>

      {pending && (
        <p className="mt-4 text-sm text-zinc-600">
          Working on it… image generation can take up to 30 seconds.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}
    </section>
  );
}
