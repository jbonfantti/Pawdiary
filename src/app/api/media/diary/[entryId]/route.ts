import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db/client";
import { pets, timelineEntries, users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";

// Diary media lives in a PRIVATE blob store, so the browser can't load it
// directly. This route is the only read path: it verifies the signed-in user
// owns the pet the entry belongs to, then streams the blob through.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  const [row] = await db
    .select({ mediaUrl: timelineEntries.mediaUrl })
    .from(timelineEntries)
    .innerJoin(pets, eq(timelineEntries.petId, pets.id))
    .innerJoin(users, eq(pets.userId, users.id))
    .where(and(eq(timelineEntries.id, entryId), eq(users.clerkId, clerkId)))
    .limit(1);

  if (!row?.mediaUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await get(row.mediaUrl, {
    access: "private",
    storeId: process.env.BLOB_DIARY_STORE_ID,
  });
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      // Private per-user content: allow the browser to cache, never shared caches.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
