// context/DataContext.jsx
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

// ─────────────────────────────────────────────────────────────
// localStorage keys
// ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  QUEUE: "ragafy_queue",
  QUEUE_INDEX: "ragafy_queue_index",
  QUEUE_PLAYBACK_HISTORY: "ragafy_queue_playback_history",
};

// ─────────────────────────────────────────────────────────────
// Safe localStorage helpers
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function DataProvider({ children }) {
  // ───────────────────────────────────────────────────────────
  // Global states
  // ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [songs, setSongs] = useState([]);
  const [photos, setPhotos] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});

  // ───────────────────────────────────────────────────────────
  // Queue states
  // ───────────────────────────────────────────────────────────
  const [queue, setQueue] = useState(() =>
    getStorageItem(STORAGE_KEYS.QUEUE, [])
  );

  const [currentQueueIndex, setCurrentQueueIndex] = useState(() => {
    try {
      const index = localStorage.getItem(STORAGE_KEYS.QUEUE_INDEX);
      return index ? parseInt(index, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [queueHistory, setQueueHistory] = useState(() =>
    getStorageItem(STORAGE_KEYS.QUEUE_PLAYBACK_HISTORY, [])
  );

  const [currentQueueSong, setCurrentQueueSong] = useState(null);

  // ───────────────────────────────────────────────────────────
  // Sync queue to localStorage
  // ───────────────────────────────────────────────────────────
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
      localStorage.setItem(
        STORAGE_KEYS.QUEUE_INDEX,
        currentQueueIndex.toString()
      );
    } catch (err) {
      console.error("Failed to save queue index:", err);
    }
  }, [currentQueueIndex]);

  useEffect(() => {
    setStorageItem(
      STORAGE_KEYS.QUEUE_PLAYBACK_HISTORY,
      queueHistory
    );
  }, [queueHistory]);

  // ───────────────────────────────────────────────────────────
  // Load remote data
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        const [songRes, playlistRes, filterRes] =
          await Promise.allSettled([
            fetchSongs(),
            fetchPlaylists(),
            fetchAllFilters(),
          ]);

        // Songs
        if (songRes.status === "fulfilled") {
          const allSongs = songRes.value.data || [];

          setSongs(allSongs);

          // Fetch photos
          const photoMap = {};

          await Promise.all(
            allSongs.map(async (song) => {
              try {
                const res = await axios.get(
                  `https://ragafy-backend.onrender.com/songs/${song._id}/photo`
                );

                photoMap[song._id] = res.data.url;
              } catch {
                photoMap[song._id] = null;
              }
            })
          );

          setPhotos(photoMap);
        }

        // Playlists
        if (playlistRes.status === "fulfilled") {
          setPlaylists(playlistRes.value.data || []);
        }

        // Filters
        if (filterRes.status === "fulfilled") {
          setFilterOptions(filterRes.value || {});
        }
      } catch (err) {
        console.error("Failed loading global data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // ───────────────────────────────────────────────────────────
  // Queue functions
  // ───────────────────────────────────────────────────────────

  // Add single song
  const addToQueue = useCallback((song) => {
    setQueue((prev) => {
      const exists = prev.some((s) => s._id === song._id);

      if (exists) return prev;

      return [...prev, song];
    });
  }, []);

  // Add multiple songs
  const addMultipleToQueue = useCallback((newSongs) => {
    setQueue((prev) => {
      const existingIds = new Set(prev.map((s) => s._id));

      const uniqueSongs = newSongs.filter(
        (song) => !existingIds.has(song._id)
      );

      return [...prev, ...uniqueSongs];
    });
  }, []);

  // Add next
  const addToQueueNext = useCallback(
    (song) => {
      setQueue((prev) => {
        const exists = prev.some((s) => s._id === song._id);

        if (exists) return prev;

        const newQueue = [...prev];

        newQueue.splice(currentQueueIndex + 1, 0, song);

        return newQueue;
      });
    },
    [currentQueueIndex]
  );

  // Remove song
  const removeFromQueue = useCallback(
    (songId) => {
      setQueue((prev) => {
        const removedIndex = prev.findIndex(
          (song) => song._id === songId
        );

        const newQueue = prev.filter(
          (song) => song._id !== songId
        );

        setCurrentQueueIndex((curr) => {
          if (newQueue.length === 0) return 0;

          // Removed current song
          if (removedIndex === curr) {
            return curr >= newQueue.length
              ? newQueue.length - 1
              : curr;
          }

          // Removed before current
          if (removedIndex < curr) {
            return curr - 1;
          }

          return curr;
        });

        return newQueue;
      });
    },
    []
  );

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentQueueIndex(0);
    setCurrentQueueSong(null);
    setQueueHistory([]);

    localStorage.removeItem(STORAGE_KEYS.QUEUE);
    localStorage.removeItem(STORAGE_KEYS.QUEUE_INDEX);
    localStorage.removeItem(
      STORAGE_KEYS.QUEUE_PLAYBACK_HISTORY
    );
  }, []);

  // Play queue
  const playQueue = useCallback(
    (index = 0) => {
      if (queue.length === 0) return false;

      if (index >= queue.length) return false;

      setCurrentQueueIndex(index);

      return true;
    },
    [queue]
  );

  // Next song
  const playNext = useCallback(() => {
    if (queue.length === 0) return false;

    setQueueHistory((prev) => [
      ...prev,
      queue[currentQueueIndex],
    ]);

    const nextIndex =
      (currentQueueIndex + 1) % queue.length;

    setCurrentQueueIndex(nextIndex);

    return true;
  }, [queue, currentQueueIndex]);

  // Previous song
  const playPrevious = useCallback(() => {
    // Go previous in queue
    if (currentQueueIndex > 0) {
      setCurrentQueueIndex((prev) => prev - 1);
      return true;
    }

    // Use history
    if (queueHistory.length > 0) {
      const lastPlayed =
        queueHistory[queueHistory.length - 1];

      const lastPlayedIndex = queue.findIndex(
        (song) => song._id === lastPlayed?._id
      );

      if (lastPlayedIndex !== -1) {
        setQueueHistory((prev) => prev.slice(0, -1));

        setCurrentQueueIndex(lastPlayedIndex);

        return true;
      }
    }

    return false;
  }, [currentQueueIndex, queueHistory, queue]);

  // Shuffle queue
  const shuffleQueue = useCallback(() => {
    if (queue.length <= 1) return;

    const shuffled = [...queue];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    setQueue(shuffled);
    setCurrentQueueIndex(0);
    setQueueHistory([]);
  }, [queue]);

  // Move song
  const moveSongInQueue = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;

      setQueue((prev) => {
        const newQueue = [...prev];

        const [movedSong] = newQueue.splice(
          fromIndex,
          1
        );

        newQueue.splice(toIndex, 0, movedSong);

        setCurrentQueueIndex((curr) => {
          if (curr === fromIndex) return toIndex;

          if (
            curr > fromIndex &&
            curr <= toIndex
          ) {
            return curr - 1;
          }

          if (
            curr < fromIndex &&
            curr >= toIndex
          ) {
            return curr + 1;
          }

          return curr;
        });

        return newQueue;
      });
    },
    []
  );

  // Next songs
  const getNextSongs = useCallback(
    (count = 5) => {
      if (queue.length === 0) return [];

      return Array.from(
        { length: Math.min(count, queue.length - 1) },
        (_, i) => ({
          ...queue[
            (currentQueueIndex + i + 1) %
              queue.length
          ],
          position: i + 1,
        })
      );
    },
    [queue, currentQueueIndex]
  );

  // Previous songs
  const getPreviousSongs = useCallback(
    (count = 5) => {
      if (queue.length === 0) return [];

      return Array.from(
        { length: Math.min(count, queue.length - 1) },
        (_, i) => ({
          ...queue[
            (currentQueueIndex -
              i -
              1 +
              queue.length) %
              queue.length
          ],
          position: i + 1,
        })
      );
    },
    [queue, currentQueueIndex]
  );

  // ───────────────────────────────────────────────────────────
  // Context value (memoized)
  // ───────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      // Global state
      loading,
      error,
      songs,
      photos,
      playlists,
      filterOptions,

      // Queue state
      queue,
      currentQueueIndex,
      currentQueueSong,
      queueHistory,

      // Queue functions
      addToQueue,
      addMultipleToQueue,
      addToQueueNext,
      removeFromQueue,
      clearQueue,
      playQueue,
      playNext,
      playPrevious,
      shuffleQueue,
      moveSongInQueue,
      getNextSongs,
      getPreviousSongs,

      // Stats
      queueLength: queue.length,
      hasQueue: queue.length > 0,
      isQueuePlaying: currentQueueSong !== null,
    }),
    [
      loading,
      error,
      songs,
      photos,
      playlists,
      filterOptions,
      queue,
      currentQueueIndex,
      currentQueueSong,
      queueHistory,
      addToQueue,
      addMultipleToQueue,
      addToQueueNext,
      removeFromQueue,
      clearQueue,
      playQueue,
      playNext,
      playPrevious,
      shuffleQueue,
      moveSongInQueue,
      getNextSongs,
      getPreviousSongs,
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export const useData = () => {
  const context = useContext(DataContext);

  if (context === null) {
    throw new Error(
      "useData must be used within a DataProvider"
    );
  }

  return context;
};