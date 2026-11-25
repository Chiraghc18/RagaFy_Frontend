// src/context/DataContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";

import fetchSongs from "../services/songService/fetchSongs";
import { fetchPlaylists } from "../services/playlistService";
import { fetchAllFilters } from "../services/songService/songFilterService";

const DataContext = createContext(null);

const STORAGE_KEYS = {
  QUEUE: "ragafy_queue",
  QUEUE_INDEX: "ragafy_queue_index",
  QUEUE_PLAYBACK_HISTORY: "ragafy_queue_playback_history",
  SONGS_CACHE: "ragafy_songs_cache",
  PLAYLISTS_CACHE: "ragafy_playlists_cache",
  FILTERS_CACHE: "ragafy_filters_cache",
  PHOTOS_CACHE: "ragafy_photos_cache",
};

const getStorageItem = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
  }
};

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [songs, setSongs] = useState(() => getStorageItem(STORAGE_KEYS.SONGS_CACHE, []));
  const [photos, setPhotos] = useState(() => getStorageItem(STORAGE_KEYS.PHOTOS_CACHE, {}));
  const [playlists, setPlaylists] = useState(() => getStorageItem(STORAGE_KEYS.PLAYLISTS_CACHE, []));
  const [filterOptions, setFilterOptions] = useState(() => getStorageItem(STORAGE_KEYS.FILTERS_CACHE, {}));

  const [queue, setQueue] = useState(() => getStorageItem(STORAGE_KEYS.QUEUE, []));
  const [currentQueueIndex, setCurrentQueueIndex] = useState(() => {
    try {
      const index = localStorage.getItem(STORAGE_KEYS.QUEUE_INDEX);
      return index ? parseInt(index, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [queueHistory, setQueueHistory] = useState(() => getStorageItem(STORAGE_KEYS.QUEUE_PLAYBACK_HISTORY, []));
  const [currentQueueSong, setCurrentQueueSong] = useState(null);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.QUEUE, queue);
    if (queue.length > 0 && currentQueueIndex < queue.length) {
      setCurrentQueueSong(queue[currentQueueIndex]);
    } else {
      setCurrentQueueSong(null);
    }
  }, [queue, currentQueueIndex]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE_INDEX, currentQueueIndex.toString());
    } catch (err) {}
  }, [currentQueueIndex]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.QUEUE_PLAYBACK_HISTORY, queueHistory);
  }, [queueHistory]);

  // ───────────────────────────────────────────────────────────
  // Data loader
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async (isInitialLoad = false) => {
      if (!isMounted) return;

      // 🔥 ONLY show the splash screen on the initial app load
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      if (!navigator.onLine) {
        console.log("📴 Offline at startup — using localStorage cache");
        if (isInitialLoad) setLoading(false);
        return;
      }

      const [songRes, playlistRes, filterRes] = await Promise.allSettled([
        fetchSongs(),
        fetchPlaylists(),
        fetchAllFilters(),
      ]);

      if (!isMounted) return;

      if (songRes.status === "fulfilled") {
        const allSongs = songRes.value.data || [];
        setSongs(allSongs);
        setStorageItem(STORAGE_KEYS.SONGS_CACHE, allSongs);

        const photoMap = {};
        await Promise.all(
          allSongs.map(async (song) => {
            try {
              const res = await axios.get(`https://ragafy-backend.onrender.com/songs/${song._id}/photo`);
              photoMap[song._id] = res.data.url;
            } catch {
              photoMap[song._id] = null;
            }
          })
        );
        if (!isMounted) return;
        setPhotos(photoMap);
        setStorageItem(STORAGE_KEYS.PHOTOS_CACHE, photoMap);
      }

      if (playlistRes.status === "fulfilled") {
        const freshPlaylists = playlistRes.value.data || [];
        setPlaylists(freshPlaylists);
        setStorageItem(STORAGE_KEYS.PLAYLISTS_CACHE, freshPlaylists);
      }

      if (filterRes.status === "fulfilled") {
        const freshFilters = filterRes.value || {};
        setFilterOptions(freshFilters);
        setStorageItem(STORAGE_KEYS.FILTERS_CACHE, freshFilters);
      }

      const hasCachedSongs = getStorageItem(STORAGE_KEYS.SONGS_CACHE, []).length > 0;
      if (
        songRes.status === "rejected" &&
        playlistRes.status === "rejected" &&
        filterRes.status === "rejected" &&
        !hasCachedSongs
      ) {
        setError("Failed to load app data. Check your connection.");
      } else {
        setError(null);
      }

      // 🔥 Only hide the splash screen if this was the initial load
      if (isInitialLoad) {
        setLoading(false);
      }
    };

    // 1. Initial load (shows splash screen)
    loadAllData(true);

    // 2. Background refresh when coming back online (NO splash screen)
    const handleOnline = () => {
      console.log("🌐 System came back online — refreshing data in background...");
      loadAllData(false); // Pass false so it doesn't trigger the splash screen
    };

    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // ───────────────────────────────────────────────────────────
  // Queue functions
  // ───────────────────────────────────────────────────────────
  const addToQueue = useCallback((song) => {
    setQueue((prev) => {
      const exists = prev.some((s) => s._id === song._id);
      if (exists) return prev;
      return [...prev, song];
    });
  }, []);

  const addMultipleToQueue = useCallback((newSongs) => {
    setQueue((prev) => {
      const existingIds = new Set(prev.map((s) => s._id));
      const uniqueSongs = newSongs.filter((song) => !existingIds.has(song._id));
      return [...prev, ...uniqueSongs];
    });
  }, []);

  const addToQueueNext = useCallback((song) => {
    setQueue((prev) => {
      const exists = prev.some((s) => s._id === song._id);
      if (exists) return prev;
      const newQueue = [...prev];
      newQueue.splice(currentQueueIndex + 1, 0, song);
      return newQueue;
    });
  }, [currentQueueIndex]);

  const removeFromQueue = useCallback((songId) => {
    setQueue((prev) => {
      const removedIndex = prev.findIndex((song) => song._id === songId);
      const newQueue = prev.filter((song) => song._id !== songId);
      setCurrentQueueIndex((curr) => {
        if (newQueue.length === 0) return 0;
        if (removedIndex === curr) return curr >= newQueue.length ? newQueue.length - 1 : curr;
        if (removedIndex < curr) return curr - 1;
        return curr;
      });
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentQueueIndex(0);
    setCurrentQueueSong(null);
    setQueueHistory([]);
    localStorage.removeItem(STORAGE_KEYS.QUEUE);
    localStorage.removeItem(STORAGE_KEYS.QUEUE_INDEX);
    localStorage.removeItem(STORAGE_KEYS.QUEUE_PLAYBACK_HISTORY);
  }, []);

  const playQueue = useCallback((index = 0) => {
    if (queue.length === 0) return false;
    if (index >= queue.length) return false;
    setCurrentQueueIndex(index);
    return true;
  }, [queue]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return false;
    setQueueHistory((prev) => [...prev, queue[currentQueueIndex]]);
    const nextIndex = (currentQueueIndex + 1) % queue.length;
    setCurrentQueueIndex(nextIndex);
    return true;
  }, [queue, currentQueueIndex]);

  const playPrevious = useCallback(() => {
    if (currentQueueIndex > 0) {
      setCurrentQueueIndex((prev) => prev - 1);
      return true;
    }
    if (queueHistory.length > 0) {
      const lastPlayed = queueHistory[queueHistory.length - 1];
      const lastPlayedIndex = queue.findIndex((song) => song._id === lastPlayed?._id);
      if (lastPlayedIndex !== -1) {
        setQueueHistory((prev) => prev.slice(0, -1));
        setCurrentQueueIndex(lastPlayedIndex);
        return true;
      }
    }
    return false;
  }, [currentQueueIndex, queueHistory, queue]);

  const shuffleQueue = useCallback(() => {
    if (queue.length <= 1) return;
    const shuffled = [...queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled);
    setCurrentQueueIndex(0);
    setQueueHistory([]);
  }, [queue]);

  const moveSongInQueue = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setQueue((prev) => {
      const newQueue = [...prev];
      const [movedSong] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedSong);
      setCurrentQueueIndex((curr) => {
        if (curr === fromIndex) return toIndex;
        if (curr > fromIndex && curr <= toIndex) return curr - 1;
        if (curr < fromIndex && curr >= toIndex) return curr + 1;
        return curr;
      });
      return newQueue;
    });
  }, []);

  const getNextSongs = useCallback((count = 5) => {
    if (queue.length === 0) return [];
    return Array.from({ length: Math.min(count, queue.length - 1) }, (_, i) => ({
      ...queue[(currentQueueIndex + i + 1) % queue.length],
      position: i + 1,
    }));
  }, [queue, currentQueueIndex]);

  const getPreviousSongs = useCallback((count = 5) => {
    if (queue.length === 0) return [];
    return Array.from({ length: Math.min(count, queue.length - 1) }, (_, i) => ({
      ...queue[(currentQueueIndex - i - 1 + queue.length) % queue.length],
      position: i + 1,
    }));
  }, [queue, currentQueueIndex]);

  const value = useMemo(() => ({
    loading, error, songs, photos, playlists, filterOptions,
    queue, currentQueueIndex, currentQueueSong, queueHistory,
    addToQueue, addMultipleToQueue, addToQueueNext, removeFromQueue,
    clearQueue, playQueue, playNext, playPrevious, shuffleQueue,
    moveSongInQueue, getNextSongs, getPreviousSongs,
    queueLength: queue.length, hasQueue: queue.length > 0,
    isQueuePlaying: currentQueueSong !== null,
  }), [
    loading, error, songs, photos, playlists, filterOptions,
    queue, currentQueueIndex, currentQueueSong, queueHistory,
    addToQueue, addMultipleToQueue, addToQueueNext, removeFromQueue,
    clearQueue, playQueue, playNext, playPrevious, shuffleQueue,
    moveSongInQueue, getNextSongs, getPreviousSongs,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};