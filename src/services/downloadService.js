// src/services/downloadService.js
const DB_NAME = "RagaFyDownloadsDB";
const STORE_NAME = "downloads";
const DB_VERSION = 1;

function openDownloadDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "songId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readRecord(db, songId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(songId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function readAllRecords(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function writeRecord(db, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function deleteRecord(db, songId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(songId);
    getReq.onsuccess = () => {
      if (!getReq.result) {
        resolve(false);
        return;
      }
      const delReq = store.delete(songId);
      delReq.onsuccess = () => resolve(true);
      delReq.onerror = () => reject(delReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function downloadSong(song) {
  if (!song?._id || !song?.audioUrl) return false;
  if (!navigator.onLine) return false;

  const alreadyDownloaded = await isDownloaded(song._id);
  if (alreadyDownloaded) return true;

  const response = await fetch(song.audioUrl);
  if (!response.ok) throw new Error(`Failed to download: ${song.title || "song"}`);

  const blob = await response.blob();
  if (!blob.size) throw new Error(`Empty audio file: ${song.title || "song"}`);

  if (blob.type && !blob.type.startsWith("audio/") && blob.type !== "application/octet-stream") {
    throw new Error(`The URL did not return an audio file: ${song.title || "song"}`);
  }

  const db = await openDownloadDB();
  try {
    await writeRecord(db, {
      songId: song._id,
      blob,
      title: song.title || "Unknown song",
      audioUrl: song.audioUrl,
      language: song.language?.name || "Unknown",
      artistName: song.artist?.name || song.singers?.[0]?.name || "Unknown Artist",
      photoUrl: song.photo || song.imageUrl || null, // 🔥 Save the photo URL
      savedAt: Date.now(),
    });
  } finally {
    db.close();
  }
  return true;
}

// 🔥 Heal missing metadata (language, artist, photo)
export async function updateDownloadMetadata(songId, updates) {
  const db = await openDownloadDB();
  try {
    const record = await readRecord(db, songId);
    if (record) {
      let changed = false;
      if (updates.language && record.language === "Unknown") {
        record.language = updates.language;
        changed = true;
      }
      if (updates.artistName && record.artistName === "Unknown Artist") {
        record.artistName = updates.artistName;
        changed = true;
      }
      if (updates.photoUrl && !record.photoUrl) {
        record.photoUrl = updates.photoUrl;
        changed = true;
      }
      if (changed) {
        await writeRecord(db, record);
        return true;
      }
    }
    return false;
  } finally {
    db.close();
  }
}

export async function removeDownload(songId) {
  if (!songId) return false;
  const db = await openDownloadDB();
  try {
    return await deleteRecord(db, songId);
  } finally {
    db.close();
  }
}

export async function isDownloaded(songId) {
  if (!songId) return false;
  const db = await openDownloadDB();
  try {
    const record = await readRecord(db, songId);
    return Boolean(record?.blob);
  } finally {
    db.close();
  }
}

export async function getDownload(songId) {
  if (!songId) return null;
  const db = await openDownloadDB();
  try {
    return await readRecord(db, songId);
  } finally {
    db.close();
  }
}

export async function getDownloadedBlob(songId) {
  const record = await getDownload(songId);
  return record?.blob || null;
}

export async function getAllDownloadedIds() {
  const db = await openDownloadDB();
  try {
    const records = await readAllRecords(db);
    return records.filter((r) => r?.songId && r?.blob).map((r) => r.songId);
  } finally {
    db.close();
  }
}

export async function getAllDownloads() {
  const db = await openDownloadDB();
  try {
    return await readAllRecords(db);
  } finally {
    db.close();
  }
}

export async function getDownloadCount() {
  const ids = await getAllDownloadedIds();
  return ids.length;
}