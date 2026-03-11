// context/DataContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import fetchSongs from "../services/songService/fetchSongs";
import { fetchPlaylists } from "../services/playlistService";
import { fetchAllFilters } from "../services/songService/songFilterService";

const DataContext = createContext(null);

// localStorage keys
const STORAGE_KEYS = {
  QUEUE: 'ragafy_queue',
  QUEUE_INDEX: 'ragafy_queue_index',
  QUEUE_HISTORY: 'ragafy_queue_history'
};

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [photos, setPhotos] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  
  // Queue state with localStorage initialization
  const [queue, setQueue] = useState(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEYS.QUEUE);
    return savedQueue ? JSON.parse(savedQueue) : [];
  });
  
  const [currentQueueIndex, setCurrentQueueIndex] = useState(() => {
    const savedIndex = localStorage.getItem(STORAGE_KEYS.QUEUE_INDEX);
    return savedIndex ? parseInt(savedIndex, 10) : 0;
  });
  
  const [currentQueueSong, setCurrentQueueSong] = useState(null);
  
  const [queueHistory, setQueueHistory] = useState(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.QUEUE_HISTORY);
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    
    // Update currentQueueSong when queue or index changes
    if (queue.length > 0 && currentQueueIndex < queue.length) {
      setCurrentQueueSong(queue[currentQueueIndex]);
    } else {
      setCurrentQueueSong(null);
    }
  }, [queue, currentQueueIndex]);

  // Save queue index to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUEUE_INDEX, currentQueueIndex.toString());
  }, [currentQueueIndex]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUEUE_HISTORY, JSON.stringify(queueHistory));
  }, [queueHistory]);

  // Load all data
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        const [songRes, plRes, filterRes] = await Promise.allSettled([
          fetchSongs(),
          fetchPlaylists(),
          fetchAllFilters(),
        ]);

        let allSongs = [];
        if (songRes.status === "fulfilled") {
          allSongs = songRes.value.data || [];
          setSongs(allSongs);

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

        if (plRes.status === "fulfilled") {
          setPlaylists(plRes.value.data || []);
        }

        if (filterRes.status === "fulfilled") {
          setFilterOptions(filterRes.value);
        }

      } catch (e) {
        console.error("Failed to load global data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Queue functions with localStorage auto-save (handled by useEffect)
  const addToQueue = (song) => {
    setQueue(prev => {
      // Check if song already exists in queue (optional)
      const exists = prev.some(s => s._id === song._id);
      if (exists) {
        // Option: Move existing song to end instead of duplicate
        const filtered = prev.filter(s => s._id !== song._id);
        return [...filtered, song];
      }
      return [...prev, song];
    });
  };

  const addMultipleToQueue = (newSongs) => {
    setQueue(prev => {
      // Remove duplicates based on song._id
      const existingIds = new Set(prev.map(s => s._id));
      const uniqueNewSongs = newSongs.filter(song => !existingIds.has(song._id));
      return [...prev, ...uniqueNewSongs];
    });
  };

  const addToQueueNext = (song) => {
    setQueue(prev => {
      const newQueue = [...prev];
      // Insert after current index
      newQueue.splice(currentQueueIndex + 1, 0, song);
      return newQueue;
    });
  };

  const removeFromQueue = (songId) => {
    setQueue(prev => {
      const newQueue = prev.filter(song => song._id !== songId);
      
      // Adjust current index if needed
      if (currentQueueIndex >= newQueue.length) {
        setCurrentQueueIndex(Math.max(0, newQueue.length - 1));
      }
      
      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentQueueIndex(0);
    setCurrentQueueSong(null);
    setQueueHistory([]);
    
    // Also clear from localStorage
    localStorage.removeItem(STORAGE_KEYS.QUEUE);
    localStorage.removeItem(STORAGE_KEYS.QUEUE_INDEX);
    localStorage.removeItem(STORAGE_KEYS.QUEUE_HISTORY);
  };

  const playQueue = (index = 0) => {
    if (queue.length > 0 && index < queue.length) {
      setCurrentQueueIndex(index);
      setCurrentQueueSong(queue[index]);
      return true;
    }
    return false;
  };

  const playNext = () => {
    if (currentQueueIndex < queue.length - 1) {
      // Add current song to history before moving
      setQueueHistory(prev => [...prev, queue[currentQueueIndex]]);
      setCurrentQueueIndex(prev => prev + 1);
      return true;
    } else if (queue.length > 0) {
      // Loop back to start
      setQueueHistory(prev => [...prev, queue[currentQueueIndex]]);
      setCurrentQueueIndex(0);
      return true;
    }
    return false;
  };

  const playPrevious = () => {
    if (currentQueueIndex > 0) {
      setCurrentQueueIndex(prev => prev - 1);
      return true;
    } else if (queueHistory.length > 0) {
      // Go to last played from history
      const lastPlayed = queueHistory[queueHistory.length - 1];
      const lastPlayedIndex = queue.findIndex(s => s._id === lastPlayed?._id);
      if (lastPlayedIndex !== -1) {
        setQueueHistory(prev => prev.slice(0, -1));
        setCurrentQueueIndex(lastPlayedIndex);
        return true;
      }
    }
    return false;
  };

  const shuffleQueue = () => {
    if (queue.length <= 1) return;
    
    const shuffled = [...queue];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setQueue(shuffled);
    setCurrentQueueIndex(0);
    setQueueHistory([]);
  };

  const moveSongInQueue = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedSong] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedSong);
      
      // Adjust current index if affected
      if (currentQueueIndex === fromIndex) {
        setCurrentQueueIndex(toIndex);
      } else if (
        currentQueueIndex > fromIndex && 
        currentQueueIndex <= toIndex
      ) {
        setCurrentQueueIndex(prev => prev - 1);
      } else if (
        currentQueueIndex < fromIndex && 
        currentQueueIndex >= toIndex
      ) {
        setCurrentQueueIndex(prev => prev + 1);
      }
      
      return newQueue;
    });
  };

  const getNextSongs = (count = 5) => {
    if (queue.length === 0) return [];
    
    const nextSongs = [];
    for (let i = 1; i <= count; i++) {
      const nextIndex = (currentQueueIndex + i) % queue.length;
      nextSongs.push({
        ...queue[nextIndex],
        position: i
      });
    }
    return nextSongs;
  };

  const getPreviousSongs = (count = 5) => {
    if (queue.length === 0) return [];
    
    const prevSongs = [];
    for (let i = 1; i <= count; i++) {
      const prevIndex = (currentQueueIndex - i + queue.length) % queue.length;
      prevSongs.push({
        ...queue[prevIndex],
        position: i
      });
    }
    return prevSongs;
  };

  const value = {
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
    // Queue stats
    queueLength: queue.length,
    hasQueue: queue.length > 0,
    isQueuePlaying: currentQueueSong !== null,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};