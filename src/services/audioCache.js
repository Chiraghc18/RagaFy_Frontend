// src/services/audioCache.js

const DB_NAME = "RagaFyAudioDB";
const STORE_NAME = "songs";
const DB_VERSION = 1;
const MAX_CACHED_SONGS = 25;

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "songId",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readAllCachedSongs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineSong(songId) {
  if (!songId) return null;

  const db = await openAudioDB();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(songId);

      request.onsuccess = () => {
        resolve(request.result?.blob || null);
      };

      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function isSongCached(songId) {
  return Boolean(await getOfflineSong(songId));
}

export async function cacheSongForOffline(song) {
  if (!song?._id || !song?.audioUrl) {
    return false;
  }

  if (!navigator.onLine) {
    return false;
  }

  // Avoid downloading an audio file already stored locally.
  const existing = await getOfflineSong(song._id);

  if (existing) {
    return true;
  }

  const response = await fetch(song.audioUrl);

  if (!response.ok) {
    throw new Error(`Failed to download: ${song.title || "song"}`);
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error(`Empty audio file: ${song.title || "song"}`);
  }

  // Do not save non-audio error responses as songs.
  if (
    blob.type &&
    !blob.type.startsWith("audio/") &&
    blob.type !== "application/octet-stream"
  ) {
    throw new Error(
      `The URL did not return an audio file: ${song.title || "song"}`
    );
  }

  const db = await openAudioDB();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put({
        songId: song._id,
        blob,
        title: song.title || "Unknown song",
        audioUrl: song.audioUrl,
        savedAt: Date.now(),
      });

      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }

  return true;
}

/**
 * Keep at most 25 cached songs.
 * Songs in keepSongIds are protected from deletion.
 * Other songs are removed oldest-first.
 */
export async function trimAudioCache(keepSongIds = []) {
  const db = await openAudioDB();

  try {
    const songs = await readAllCachedSongs(db);

    if (songs.length <= MAX_CACHED_SONGS) {
      return;
    }

    const protectedIds = new Set(keepSongIds);

    const removableSongs = songs
      .filter((song) => !protectedIds.has(song.songId))
      .sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));

    const excess = songs.length - MAX_CACHED_SONGS;
    const idsToDelete = removableSongs
      .slice(0, excess)
      .map((song) => song.songId);

    if (!idsToDelete.length) {
      return;
    }

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      idsToDelete.forEach((songId) => store.delete(songId));

      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function getCachedSongCount() {
  const db = await openAudioDB();

  try {
    const songs = await readAllCachedSongs(db);
    return songs.length;
  } finally {
    db.close();
  }
}