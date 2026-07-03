"use client";

import { useState } from "react";
import { DOG_BREEDS, CAT_BREEDS } from "@/lib/breeds";
import type { petSpeciesValues } from "@/lib/db/schema";

type Species = (typeof petSpeciesValues)[number];

export const SPECIES_LABELS: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  bird: "Bird",
  rabbit: "Rabbit",
  hamster: "Hamster",
  guinea_pig: "Guinea Pig",
  fish: "Fish",
  reptile: "Reptile",
  ferret: "Ferret",
  other: "Other",
};

export function AddPetForm({ action }: { action: (formData: FormData) => void }) {
  const [species, setSpecies] = useState<Species>("dog");

  // Breed suggestions only make sense for dogs and cats; other species keep
  // the field as plain free text.
  const breedOptions =
    species === "dog" ? DOG_BREEDS : species === "cat" ? CAT_BREEDS : null;

  return (
    <form action={action} className="mt-4 grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Pet type</span>
        <select
          name="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value as Species)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
        >
          {Object.entries(SPECIES_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
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
          placeholder={
            breedOptions ? "Start typing or pick from the list…" : "e.g. Netherland Dwarf"
          }
          list={breedOptions ? "breed-options" : undefined}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        {breedOptions && (
          <datalist id="breed-options">
            {breedOptions.map((breed) => (
              <option key={breed} value={breed} />
            ))}
          </datalist>
        )}
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
  );
}
