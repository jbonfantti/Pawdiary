import { put, del } from "@vercel/blob";

const DIARY_STORE_ID = process.env.BLOB_DIARY_STORE_ID;
const FEED_STORE_ID = process.env.BLOB_FEED_STORE_ID;

export async function uploadDiaryMedia(pathname: string, body: Blob | Buffer | ArrayBuffer) {
  return put(pathname, body, {
    access: "private",
    storeId: DIARY_STORE_ID,
    addRandomSuffix: true,
  });
}

export async function uploadFeedMedia(pathname: string, body: Blob | Buffer | ArrayBuffer) {
  return put(pathname, body, {
    access: "public",
    storeId: FEED_STORE_ID,
    addRandomSuffix: true,
  });
}

export async function deleteDiaryMedia(url: string) {
  return del(url, { storeId: DIARY_STORE_ID });
}

export async function deleteFeedMedia(url: string) {
  return del(url, { storeId: FEED_STORE_ID });
}
