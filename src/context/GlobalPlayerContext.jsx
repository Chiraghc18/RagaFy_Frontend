import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";

import {
  cacheSongForOffline,
  getOfflineSong,
  trimAudioCache,
} from "../services/audioCache";

import { getDownloadedBlob } from "../services/downloadService";

const GlobalPlayerContext = createContext(null);

const STORAGE_KEYS = {
  PLAYLIST: "ragafy_global_playlist",
  CURRENT_INDEX: "ragafy_global_index",
  VOLUME: "ragafy_global_volume",
  SHUFFLE: "ragafy_global_shuffle",
  REPEAT: "ragafy_global_repeat",
  RECENTLY_PLAYED: "ragafy_recently_played",
  PLAYED_SONGS: "ragafy_played_song_ids",
};

const CACHE_START_DELAY_MS = 5000;
const UPCOMING_COUNT = 6;

export function GlobalPlayerProvider({ children }) {
  // =========================
  // NETWORK VERSION
  // =========================

  const [networkVersion, setNetworkVersion] = useState(0);

  useEffect(() => {
    const handleNetworkChange = () => {
      setNetworkVersion((v) => v + 1);
    };
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  // =========================
  // STATES
  // =========================

  const [currentPlaylist, setCurrentPlaylist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYLIST)) || [];
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX), 10) || 0;
    } catch {
      return 0;
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const [volume, setVolumeState] = useState(() => {
    const savedVolume = localStorage.getItem("ragafy_global_volume");
    if (savedVolume === null) return 1;
    const parsedVolume = Number(savedVolume);
    return Number.isFinite(parsedVolume)
      ? Math.max(0, Math.min(1, parsedVolume))
      : 1;
  });

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [shuffleMode, setShuffleMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SHUFFLE) === "true";
    } catch {
      return false;
    }
  });

  const [repeatMode, setRepeatMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.REPEAT) || "all";
    } catch {
      return "all";
    }
  });

  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const [playedSongIds, setPlayedSongIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYED_SONGS));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const markPlayed = useCallback((songId) => {
    if (!songId) return;
    setPlayedSongIds((prev) =>
      prev.includes(songId) ? prev : [...prev, songId]
    );
  }, []);

  const resetPlayed = useCallback(() => setPlayedSongIds([]), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYED_SONGS, JSON.stringify(playedSongIds));
    } catch {
      // ignore
    }
  }, [playedSongIds]);

  const [shuffleOrder, setShuffleOrder] = useState([]);

  // =========================
  // UNDO SNAPSHOT
  // =========================

  // Single-level undo: holds { playlist, index } captured just before a
  // queue-mutating action. Cleared after an undo.
  const undoSnapshotRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);

  const snapshotForUndo = useCallback(() => {
    undoSnapshotRef.current = {
      playlist: currentPlaylist,
      index: currentIndex,
    };
    setCanUndo(true);
  }, [currentPlaylist, currentIndex]);

  // =========================
  // CURRENT SONG
  // =========================

  const currentSong = currentPlaylist[currentIndex];

  // =========================
  // REFS
  // =========================

  const audioRef = useRef(null);
  const progressInterval = useRef(null);
  const loadedSongIdRef = useRef(null);

  const cachedForLoadedSongRef = useRef({ songId: null, available: false });
  const cacheCycleAbortRef = useRef(false);
  const cacheTimerRef = useRef(null);

  // =========================
  // UPDATE HISTORY WHEN SONG CHANGES
  // =========================

  useEffect(() => {
    if (!currentSong?._id) return;
    const songId = currentSong._id;

    setRecentlyPlayedIds((prev) => {
      const withoutCurrent = prev.filter((id) => id !== songId);
      const next = [songId, ...withoutCurrent].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    markPlayed(songId);
  }, [currentSong?._id, markPlayed]);

  // =========================
  // CACHE CYCLE
  // =========================

  useEffect(() => {
    const song = currentSong;
    const playlist = currentPlaylist;
    const index = currentIndex;

    if (cacheTimerRef.current) {
      clearTimeout(cacheTimerRef.current);
      cacheTimerRef.current = null;
    }
    cacheCycleAbortRef.current = false;

    if (!song?._id || !playlist?.length) return;
    if (!navigator.onLine) return;

    let cancelled = false;

    const isAudioReallyPlaying = () => {
      const a = audioRef.current;
      if (!a) return false;
      if (a.paused) return false;
      if (a.ended) return false;
      if (!Number.isFinite(a.currentTime) || a.currentTime <= 0) return false;
      return true;
    };

    const runCacheCycle = async () => {
      if (cancelled || cacheCycleAbortRef.current) return;
      if (!navigator.onLine) return;

      if (!isAudioReallyPlaying()) {
        console.log(
          "⏸️ Skipping cache cycle — audio element is not actually playing."
        );
        return;
      }

      const targets = [];
      const targetIds = new Set();

      if (song._id && song.audioUrl) {
        targets.push(song);
        targetIds.add(song._id);
      }

      for (let offset = 1; offset <= UPCOMING_COUNT; offset++) {
        if (playlist.length <= 1) break;
        const idx = (index + offset) % playlist.length;
        const s = playlist[idx];
        if (!s?._id || !s?.audioUrl) continue;
        if (targetIds.has(s._id)) continue;
        targetIds.add(s._id);
        targets.push(s);
      }

      let cachedCount = 0;
      let skippedCount = 0;

      for (const target of targets) {
        if (cancelled || cacheCycleAbortRef.current) {
          console.log("⏹️ Cache cycle cancelled.");
          return;
        }

        if (!isAudioReallyPlaying()) {
          console.log("⏸️ Audio stopped mid-batch — aborting cache cycle.");
          return;
        }

        try {
          const existing = await getOfflineSong(target._id);
          if (existing) {
            skippedCount += 1;
            continue;
          }

          if (!navigator.onLine) {
            console.log("⏹️ Offline mid-batch — stopping cache cycle.");
            return;
          }

          await cacheSongForOffline(target);
          cachedCount += 1;

          console.log(
            `✅ Cached "${target.title || target._id}" (${cachedCount}/${targets.length})`
          );
        } catch (error) {
          console.warn(
            `❌ Failed to cache "${target.title || target._id}":`,
            error
          );
        }
      }

      if (cancelled || cacheCycleAbortRef.current) return;

      console.log(
        `📦 Cache cycle complete: ${cachedCount} new, ${skippedCount} already cached.`
      );

      try {
        await trimAudioCache([...targetIds]);
      } catch (error) {
        console.warn("Could not trim offline audio cache:", error);
      }
    };

    cacheTimerRef.current = setTimeout(runCacheCycle, CACHE_START_DELAY_MS);

    return () => {
      cancelled = true;
      if (cacheTimerRef.current) {
        clearTimeout(cacheTimerRef.current);
        cacheTimerRef.current = null;
      }
      cacheCycleAbortRef.current = true;
    };
  }, [currentSong?._id, currentPlaylist, currentIndex, networkVersion]);

  // =========================
  // BUILD SHUFFLE ORDER
  // =========================

  useEffect(() => {
    if (shuffleMode && currentPlaylist.length > 0) {
      const indices = currentPlaylist.map((_, i) => i);
      const rest = indices.filter((i) => i !== currentIndex);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      setShuffleOrder([currentIndex, ...rest]);
    }
  }, [shuffleMode, currentPlaylist.length, currentIndex]);

  // =========================
  // NEXT INDEX
  // =========================

  const getNextIndex = useCallback(() => {
    if (repeatMode === "one") return currentIndex;
    if (shuffleMode && shuffleOrder.length > 0) {
      const position = shuffleOrder.indexOf(currentIndex);
      if (position === shuffleOrder.length - 1) return shuffleOrder[0];
      return shuffleOrder[position + 1];
    }
    if (currentIndex + 1 >= currentPlaylist.length) return 0;
    return currentIndex + 1;
  }, [currentIndex, currentPlaylist, shuffleMode, shuffleOrder, repeatMode]);

  // =========================
  // PREVIOUS INDEX
  // =========================

  const getPrevIndex = useCallback(() => {
    if (repeatMode === "one") return currentIndex;
    if (shuffleMode && shuffleOrder.length > 0) {
      const position = shuffleOrder.indexOf(currentIndex);
      if (position === 0) return shuffleOrder[shuffleOrder.length - 1];
      return shuffleOrder[position - 1];
    }
    if (currentIndex - 1 < 0) return currentPlaylist.length - 1;
    return currentIndex - 1;
  }, [currentIndex, currentPlaylist, shuffleMode, shuffleOrder, repeatMode]);

  // =========================
  // SONG END
  // =========================

  const handleSongEnd = useCallback(() => {
    const nextIndex = getNextIndex();
    if (nextIndex === null) {
      setIsPlaying(false);
      return;
    }
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [getNextIndex]);

  // =========================
  // NEXT SONG
  // =========================

  const handleNext = useCallback(() => {
    if (!currentPlaylist?.length) return;
    const nextIndex = getNextIndex();
    if (nextIndex === null) return;
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [currentPlaylist, getNextIndex]);

  // =========================
  // PREVIOUS SONG
  // =========================

  const handlePrevious = useCallback(() => {
    if (!currentPlaylist?.length) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const previousIndex = getPrevIndex();
    if (previousIndex === null) return;
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    setCurrentIndex(previousIndex);
    setIsPlaying(true);
  }, [currentPlaylist, getPrevIndex]);

  // =========================
  // SEEK
  // =========================

  const seekTo = useCallback(
    (time) => {
      if (audioRef.current && isAudioReady) {
        audioRef.current.currentTime = time;
        setProgress(time);
      }
    },
    [isAudioReady]
  );

  // =========================
  // PLAY PLAYLIST
  // =========================

  const playPlaylist = useCallback(
    (songs, startIndex = 0) => {
      if (!songs?.length) return;
      const safeIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
      const targetSong = songs[safeIndex];

      const alreadyLoaded =
        currentSong &&
        targetSong &&
        currentSong._id === targetSong._id &&
        currentIndex === safeIndex &&
        currentPlaylist.length === songs.length;

      if (alreadyLoaded) {
        setIsPlaying(true);
        return;
      }

      snapshotForUndo();
      setProgress(0);
      setDuration(0);
      setIsLoading(true);
      setCurrentPlaylist(songs);
      setCurrentIndex(safeIndex);
      setIsPlaying(true);
    },
    [currentSong, currentIndex, currentPlaylist, snapshotForUndo]
  );

  // =========================
  // PLAY SINGLE SONG
  // =========================

  const playSong = useCallback(
    (song, playlist = [], index = 0) => {
      if (!song) return;
      const targetPlaylist = playlist.length > 0 ? playlist : [song];
      const targetIndex =
        playlist.length > 0
          ? Math.max(0, Math.min(index, playlist.length - 1))
          : 0;

      const alreadyLoaded =
        currentSong &&
        currentSong._id === song._id &&
        currentIndex === targetIndex &&
        currentPlaylist.length === targetPlaylist.length;

      if (alreadyLoaded) {
        setIsPlaying(true);
        return;
      }

      snapshotForUndo();
      setProgress(0);
      setDuration(0);
      setIsLoading(true);
      setCurrentPlaylist(targetPlaylist);
      setCurrentIndex(targetIndex);
      setIsPlaying(true);
    },
    [currentSong, currentIndex, currentPlaylist, snapshotForUndo]
  );

  // =========================
  // ADD TO PLAYLIST
  // =========================

  const addToPlaylist = useCallback(
    (songs) => {
      if (!songs?.length) return;

      // Only snapshot if there's actually something new to add.
      const hasNew = songs.some(
        (song) => !currentPlaylist.some((existing) => existing._id === song._id)
      );
      if (!hasNew) return;

      snapshotForUndo();
      setCurrentPlaylist((prev) => {
        const newSongs = songs.filter(
          (song) => !prev.some((existing) => existing._id === song._id)
        );
        return [...prev, ...newSongs];
      });
    },
    [currentPlaylist, snapshotForUndo]
  );

  // =========================
  // REMOVE FROM PLAYLIST
  // =========================

  const removeFromPlaylist = useCallback(
    (songId) => {
      const exists = currentPlaylist.some((s) => s._id === songId);
      if (!exists) return;

      snapshotForUndo();
      setCurrentPlaylist((prevPlaylist) => {
        const indexToRemove = prevPlaylist.findIndex((s) => s._id === songId);
        if (indexToRemove === -1) return prevPlaylist;

        const newPlaylist = prevPlaylist.filter((s) => s._id !== songId);

        if (newPlaylist.length === 0) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }
          loadedSongIdRef.current = null;
          cachedForLoadedSongRef.current = { songId: null, available: false };
          setCurrentIndex(0);
          setIsPlaying(false);
          setProgress(0);
          setDuration(0);
          return [];
        }

        if (indexToRemove < currentIndex) {
          setCurrentIndex((i) => i - 1);
        } else if (indexToRemove === currentIndex) {
          const newIndex = Math.min(currentIndex, newPlaylist.length - 1);
          setCurrentIndex(newIndex);
          setProgress(0);
          setDuration(0);
        }

        return newPlaylist;
      });
    },
    [currentPlaylist, currentIndex, snapshotForUndo]
  );

  // =========================
  // CLEAR PLAYLIST
  // =========================

  const clearPlaylist = useCallback(() => {
    if (currentPlaylist.length === 0) return;

    snapshotForUndo();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    loadedSongIdRef.current = null;
    cachedForLoadedSongRef.current = { songId: null, available: false };
    setCurrentPlaylist([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [currentPlaylist.length, snapshotForUndo]);

  // =========================
  // UNDO PLAYLIST CHANGE
  // =========================

  const undoPlaylistChange = useCallback(() => {
    const snap = undoSnapshotRef.current;
    if (!snap) return;

    // Single-level undo: consume the snapshot.
    undoSnapshotRef.current = null;
    setCanUndo(false);

    const restoredPlaylist = Array.isArray(snap.playlist) ? snap.playlist : [];
    const safeIndex = Math.max(
      0,
      Math.min(snap.index ?? 0, Math.max(0, restoredPlaylist.length - 1))
    );

    setProgress(0);
    setDuration(0);

    if (restoredPlaylist.length === 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      loadedSongIdRef.current = null;
      cachedForLoadedSongRef.current = { songId: null, available: false };
      setCurrentPlaylist([]);
      setCurrentIndex(0);
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setCurrentPlaylist(restoredPlaylist);
    setCurrentIndex(safeIndex);
    setIsPlaying(true);
  }, []);

  // =========================
  // PLAY / PAUSE
  // =========================

  const togglePlayPause = useCallback(() => {
    if (currentSong) {
      setIsPlaying((prev) => !prev);
    }
  }, [currentSong]);

  // =========================
  // SHUFFLE TOGGLE
  // =========================

  const toggleShuffle = useCallback(() => {
    setShuffleMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SHUFFLE, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // =========================
  // REPEAT TOGGLE
  // =========================

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next = prev === "one" ? "all" : "one";
      try {
        localStorage.setItem(STORAGE_KEYS.REPEAT, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // =========================
  // VOLUME
  // =========================

  const setVolumeLevel = useCallback((value) => {
    const rounded = Math.round(Number(value) * 100) / 100;
    const newVolume = Math.max(0, Math.min(1, rounded));
    setVolumeState(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume;
    try {
      localStorage.setItem("ragafy_global_volume", String(newVolume));
    } catch {
      // ignore
    }
  }, []);

  const increaseVolume = useCallback(() => {
    setVolumeLevel(Math.min(volume + 0.1, 1));
  }, [volume, setVolumeLevel]);

  const decreaseVolume = useCallback(() => {
    setVolumeLevel(Math.max(volume - 0.1, 0));
  }, [volume, setVolumeLevel]);

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // =========================
  // INIT AUDIO
  // =========================

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    setIsAudioReady(true);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // =========================
  // AUDIO EVENTS
  // =========================

  useEffect(() => {
    if (!audioRef.current || !isAudioReady) return;
    const audio = audioRef.current;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setProgress(audio.currentTime || 0);
      setIsLoading(false);
    };

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onEnded = () => handleSongEnd();

    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const onCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, [isAudioReady, handleSongEnd, isPlaying]);

  // =========================
  // PROGRESS INTERVAL
  // =========================

  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;
    if (progressInterval.current) clearInterval(progressInterval.current);

    progressInterval.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setProgress(audioRef.current.currentTime);
      }
    }, 500);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  // =========================
  // PLAY / PAUSE EFFECT
  // =========================

  useEffect(() => {
    if (!audioRef.current || !isAudioReady || !currentSong || isLoading) {
      return;
    }
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoading, isAudioReady, currentSong]);

  // =========================
  // SONG CHANGE
  // =========================

  useEffect(() => {
    if (!audioRef.current || !isAudioReady || !currentSong) return;
    const audio = audioRef.current;

    let cancelled = false;
    let objectUrl = null;

    const isSameSong = loadedSongIdRef.current === currentSong._id;

    const resumeTime =
      isSameSong &&
      Number.isFinite(audio.currentTime) &&
      audio.currentTime > 0
        ? audio.currentTime
        : 0;

    const wasPlaying = isPlaying && !audio.paused;

    const restorePosition = () => {
      if (cancelled) return;
      if (resumeTime > 0 && Number.isFinite(audio.duration)) {
        try {
          audio.currentTime = Math.min(resumeTime, audio.duration);
        } catch {
          // ignore
        }
      } else {
        try {
          audio.currentTime = 0;
        } catch {
          // ignore
        }
      }
      if (wasPlaying) audio.play().catch(() => setIsPlaying(false));
    };

    const startPlayback = () => {
      if (!navigator.onLine) {
        loadFromCacheOnly();
        return;
      }

      const cachedInfo = cachedForLoadedSongRef.current;
      if (cachedInfo.songId === currentSong._id && cachedInfo.available) {
        loadFromCacheFirst();
        return;
      }

      if (!currentSong.audioUrl) {
        loadFromCacheOnly();
        return;
      }

      try {
        audio.addEventListener("loadedmetadata", restorePosition, { once: true });
        audio.src = currentSong.audioUrl;
        audio.load();
        loadedSongIdRef.current = currentSong._id;
        setIsLoading(true);
        console.log(
          `🌐 Streaming immediately: "${currentSong.title || currentSong._id}"`
        );
      } catch (err) {
        console.error("Failed to start streaming:", err);
        loadFromCacheOnly();
        return;
      }

      reconcileCache(currentSong);
    };

    const loadFromCacheFirst = async () => {
      try {
        setIsLoading(true);
        const userBlob = await getDownloadedBlob(currentSong._id);
        const offlineBlob = userBlob ? null : await getOfflineSong(currentSong._id);
        if (cancelled) return;
        const blob = userBlob || offlineBlob;

        if (!blob) {
          if (navigator.onLine && currentSong.audioUrl) {
            try {
              audio.addEventListener("loadedmetadata", restorePosition, { once: true });
              audio.src = currentSong.audioUrl;
              audio.load();
              loadedSongIdRef.current = currentSong._id;
              return;
            } catch {
              // fall through
            }
          }
          audio.removeAttribute("src");
          audio.load();
          setIsPlaying(false);
          setIsLoading(false);
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        audio.addEventListener("loadedmetadata", restorePosition, { once: true });
        audio.src = objectUrl;
        audio.load();
        loadedSongIdRef.current = currentSong._id;
        console.log(
          `⬇️ Playing from cache: "${currentSong.title || currentSong._id}"`
        );
      } catch (err) {
        console.error("Cache-first load failed:", err);
        if (cancelled) return;
        if (navigator.onLine && currentSong.audioUrl) {
          try {
            audio.addEventListener("loadedmetadata", restorePosition, { once: true });
            audio.src = currentSong.audioUrl;
            audio.load();
            loadedSongIdRef.current = currentSong._id;
            return;
          } catch {
            // fall through
          }
        }
        audio.removeAttribute("src");
        audio.load();
        setIsPlaying(false);
        setIsLoading(false);
      }
    };

    const loadFromCacheOnly = async () => {
      try {
        setIsLoading(true);
        const userBlob = await getDownloadedBlob(currentSong._id);
        const offlineBlob = userBlob ? null : await getOfflineSong(currentSong._id);
        if (cancelled) return;
        const blob = userBlob || offlineBlob;

        if (!blob) {
          audio.removeAttribute("src");
          audio.load();
          setIsPlaying(false);
          setIsLoading(false);
          console.warn(
            `⚠️ Offline and not cached: "${currentSong.title || currentSong._id}"`
          );
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        audio.addEventListener("loadedmetadata", restorePosition, { once: true });
        audio.src = objectUrl;
        audio.load();
        loadedSongIdRef.current = currentSong._id;
        console.log(
          `🎵 Offline playback: "${currentSong.title || currentSong._id}"`
        );
      } catch (err) {
        console.error("Offline load failed:", err);
        setIsPlaying(false);
        setIsLoading(false);
      }
    };

    const reconcileCache = async (song) => {
      if (cancelled) return;
      try {
        const userBlob = await getDownloadedBlob(song._id);
        const offlineBlob = userBlob ? null : await getOfflineSong(song._id);
        if (cancelled) return;
        const available = Boolean(userBlob || offlineBlob);
        cachedForLoadedSongRef.current = { songId: song._id, available };
        if (available) {
          console.log(
            `📦 Cache ready for next play: "${song.title || song._id}"`
          );
        }
      } catch (err) {
        if (!cancelled) console.warn("Cache reconcile failed:", err);
      }
    };

    startPlayback();

    return () => {
      cancelled = true;
      audio.removeEventListener("loadedmetadata", restorePosition);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentSong?._id, currentSong?.audioUrl, isAudioReady, networkVersion]);

  // =========================
  // VOLUME EFFECT
  // =========================

  useEffect(() => {
    if (audioRef.current && isAudioReady) {
      audioRef.current.volume = volume;
    }
  }, [volume, isAudioReady]);

  // =========================
  // SAVE PLAYER STATE
  // =========================

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PLAYLIST,
        JSON.stringify(currentPlaylist)
      );
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_INDEX,
        currentIndex.toString()
      );
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    } catch {
      // ignore
    }
  }, [currentPlaylist, currentIndex, volume]);

  // =========================
  // MEDIA SESSION API
  // =========================

  useEffect(() => {
    if (
      "mediaSession" in navigator &&
      currentSong &&
      typeof window.MediaMetadata === "function"
    ) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist?.name || "",
        album: currentSong.album?.name || "",
      });
      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevious);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
    }
  }, [currentSong, handleNext, handlePrevious]);

  // =========================
  // GLOBAL KEYBOARD SHORTCUTS
  // =========================

  useEffect(() => {
    const handleKey = (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
      ) {
        return;
      }
      if (!currentSong) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          if (event.altKey) {
            event.preventDefault();
            handleNext();
          } else if (event.shiftKey) {
            event.preventDefault();
            seekTo(Math.min((audioRef.current?.currentTime || 0) + 10, duration));
          }
          break;
        case "ArrowLeft":
          if (event.altKey) {
            event.preventDefault();
            handlePrevious();
          } else if (event.shiftKey) {
            event.preventDefault();
            seekTo(Math.max((audioRef.current?.currentTime || 0) - 10, 0));
          }
          break;
        case "ArrowUp":
          if (event.shiftKey) {
            event.preventDefault();
            increaseVolume();
          }
          break;
        case "ArrowDown":
          if (event.shiftKey) {
            event.preventDefault();
            decreaseVolume();
          }
          break;
        case "Equal":
          event.preventDefault();
          increaseVolume();
          break;
        case "Minus":
          event.preventDefault();
          decreaseVolume();
          break;
        case "NumpadAdd":
          event.preventDefault();
          increaseVolume();
          break;
        case "NumpadSubtract":
          event.preventDefault();
          decreaseVolume();
          break;
        case "KeyS":
          if (event.altKey) {
            event.preventDefault();
            toggleShuffle();
          }
          break;
        case "KeyR":
          if (event.altKey) {
            event.preventDefault();
            toggleRepeat();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    currentSong,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    duration,
    toggleShuffle,
    toggleRepeat,
    increaseVolume,
    decreaseVolume,
  ]);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {
    currentPlaylist,
    currentIndex,
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    isLoading,
    shuffleMode,
    repeatMode,
    recentlyPlayedIds,
    playedSongIds,
    markPlayed,
    resetPlayed,
    playPlaylist,
    playSong,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    canUndo,
    undoPlaylistChange,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume: setVolumeLevel,
    increaseVolume,
    decreaseVolume,
    toggleShuffle,
    toggleRepeat,
    formatTime,
  };

  return (
    <GlobalPlayerContext.Provider value={value}>
      {children}
    </GlobalPlayerContext.Provider>
  );
}

export const useGlobalPlayer = () => {
  const context = useContext(GlobalPlayerContext);
  if (!context) {
    throw new Error("useGlobalPlayer must be used within GlobalPlayerProvider");
  }
  return context;
};