import type { Artwork } from './model.ts';

const DB_NAME = 'spell-garden-colouring';
const STORE = 'artworks';

export type SavedArt = Artwork & { preview?: Blob };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'sheetId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = op(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function loadArtwork(sheetId: string): Promise<Artwork | null> {
  return run<SavedArt | undefined>('readonly', (store) => store.get(sheetId)).then((row) => {
    if (!row || row.sheetId !== sheetId) return null;
    return {
      sheetId: row.sheetId,
      fills: row.fills ?? {},
      strokes: row.strokes ?? [],
      rewarded: row.rewarded === true,
      updatedAt: row.updatedAt ?? 0,
    };
  });
}

export function saveArtwork(art: Artwork, preview: Blob | null): Promise<void> {
  const record: SavedArt = preview ? { ...art, preview } : { ...art };
  return run('readwrite', (store) => store.put(record)).then(() => undefined);
}

export function listArtworks(): Promise<SavedArt[]> {
  return run<SavedArt[]>('readonly', (store) => store.getAll()).then((rows) => rows ?? []);
}
