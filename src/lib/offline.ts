import { openDB } from "idb";

const DB_NAME = "music-connections";
const STORE_FAVORITES = "favorites";

export async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE_FAVORITES);
    }
  });
}

export async function setFavorite(id: string, on: boolean) {
  const d = await db();
  if (on) await d.put(STORE_FAVORITES, true, id);
  else await d.delete(STORE_FAVORITES, id);
}

export async function isFavorite(id: string) {
  const d = await db();
  return Boolean(await d.get(STORE_FAVORITES, id));
}
