import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback
} from "react";

import {
  cacheSongForOffline,
  getOfflineSong,
  trimAudioCache,
} from "../services/audioCache";

const GlobalPlayerContext = createContext(null);

// =========================
// LOCAL STORAGE KEYS
// =========================

const STORAGE_KEYS = {
  PLAYLIST: "ragafy_global_playlist",
  CURRENT_INDEX: "ragafy_global_index",
  VOLUME: "ragafy_global_volume",
  SHUFFLE: "ragafy_global_shuffle",
  REPEAT: "ragafy_global_repeat",
  RECENTLY_PLAYED: "ragafy_recently_played",
  PLAYED_SONGS: "ragafy_played_song_ids"
};

export function GlobalPlayerProvider({ children }) {
  // =========================
  // NETWORK VERSION
  // =========================

  const [networkVersion, setNetworkVersion] = useState(0);

  useEffect(() => {
    const handleNetworkChange = () => {
      setNetworkVersion((version) => version + 1);
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
      return (
        JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYLIST)) || []
      );
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      return (
        parseInt(
          localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX),
          10
        ) || 0
      );
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

  // =========================
  // SHUFFLE & REPEAT
  // =========================

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

  // =========================
  // RECENTLY PLAYED
  // =========================

  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED)
      );

      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  // =========================
  // GLOBAL PLAYED HISTORY
  // =========================

  const [playedSongIds, setPlayedSongIds] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.PLAYED_SONGS)
      );

      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const markPlayed = useCallback((songId) => {
    if (!songId) return;

    setPlayedSongIds((previousIds) => {
      if (previousIds.includes(songId)) {
        return previousIds;
      }

      return [...previousIds, songId];
    });
  }, []);

  const resetPlayed = useCallback(() => {
    setPlayedSongIds([]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PLAYED_SONGS,
        JSON.stringify(playedSongIds)
      );
    } catch {
      // Continue playback if localStorage is unavailable
    }
  }, [playedSongIds]);

  const [shuffleOrder, setShuffleOrder] = useState([]);

  // =========================
  // CURRENT SONG
  // =========================

  const currentSong = currentPlaylist[currentIndex];

  // =========================
  // REFS
  // =========================

  const audioRef = useRef(null);
  const progressInterval = useRef(null);

  // =========================
  // UPDATE HISTORY WHEN SONG CHANGES
  // =========================

  useEffect(() => {
    if (!currentSong?._id) return;

    const songId = currentSong._id;

    setRecentlyPlayedIds((previousIds) => {
      const withoutCurrent = previousIds.filter(
        (id) => id !== songId
      );

      const next = [songId, ...withoutCurrent].slice(0, 20);

      try {
        localStorage.setItem(
          STORAGE_KEYS.RECENTLY_PLAYED,
          JSON.stringify(next)
        );
      } catch {
        // Ignore storage errors
      }

      return next;
    });

    markPlayed(songId);
  }, [currentSong?._id, markPlayed]);

  // =========================
  // PRE-CACHE UPCOMING SONGS
  // =========================

  useEffect(() => {
    if (!currentSong || !currentPlaylist?.length || !navigator.onLine) {
      return;
    }

    let cancelled = false;

    const cacheUpcomingSongs = async () => {
      const nextSongs = currentPlaylist.slice(
        currentIndex + 1,
        currentIndex + 6
      );

      const candidates = [currentSong, ...nextSongs];

      const uniqueSongs = [
        ...new Map(
          candidates
            .filter((song) => song?._id && song?.audioUrl)
            .map((song) => [song._id, song])
        ).values(),
      ];

      const priorityIds = uniqueSongs.map((song) => song._id);

      let cachedCount = 0;

      for (const song of uniqueSongs) {
        if (cancelled || !navigator.onLine) {
          break;
        }

        try {
          await cacheSongForOffline(song);

          cachedCount += 1;

          console.log(
            `✅ Song cached for offline: "${song.title || song._id}" (${cachedCount}/${uniqueSongs.length})`
          );
        } catch (error) {
          console.warn(
            `❌ Could not cache "${song.title || song._id}":`,
            error
          );
        }
      }

      if (!cancelled) {
        if (cachedCount > 0) {
          console.log(
            `📦 Offline cache batch complete: ${cachedCount} song(s) cached.`
          );
        }

        try {
          await trimAudioCache(priorityIds);
        } catch (error) {
          console.warn("Could not trim offline audio cache:", error);
        }
      }
    };

    cacheUpcomingSongs();

    return () => {
      cancelled = true;
    };
  }, [
    currentSong?._id,
    currentPlaylist,
    currentIndex,
    networkVersion,
  ]);

  // =========================
  // BUILD SHUFFLE ORDER
  // =========================

  useEffect(() => {
    if (shuffleMode && currentPlaylist.length > 0) {
      const indices = currentPlaylist.map((_, index) => index);

      const rest = indices.filter(
        (index) => index !== currentIndex
      );

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
    if (repeatMode === "one") {
      return currentIndex;
    }

    if (shuffleMode && shuffleOrder.length > 0) {
      const position = shuffleOrder.indexOf(currentIndex);

      if (position === shuffleOrder.length - 1) {
        return shuffleOrder[0];
      }

      return shuffleOrder[position + 1];
    }

    if (currentIndex + 1 >= currentPlaylist.length) {
      return 0;
    }

    return currentIndex + 1;
  }, [
    currentIndex,
    currentPlaylist,
    shuffleMode,
    shuffleOrder,
    repeatMode
  ]);

  // =========================
  // PREVIOUS INDEX
  // =========================

  const getPrevIndex = useCallback(() => {
    if (repeatMode === "one") {
      return currentIndex;
    }

    if (shuffleMode && shuffleOrder.length > 0) {
      const position = shuffleOrder.indexOf(currentIndex);

      if (position === 0) {
        return shuffleOrder[shuffleOrder.length - 1];
      }

      return shuffleOrder[position - 1];
    }

    if (currentIndex - 1 < 0) {
      return currentPlaylist.length - 1;
    }

    return currentIndex - 1;
  }, [
    currentIndex,
    currentPlaylist,
    shuffleMode,
    shuffleOrder,
    repeatMode
  ]);

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

    if (
      audioRef.current &&
      audioRef.current.currentTime > 3
    ) {
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

      const safeIndex = Math.max(
        0,
        Math.min(startIndex, songs.length - 1)
      );

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

      setProgress(0);
      setDuration(0);
      setIsLoading(true);

      setCurrentPlaylist(songs);
      setCurrentIndex(safeIndex);
      setIsPlaying(true);
    },
    [currentSong, currentIndex, currentPlaylist]
  );

  // =========================
  // PLAY SINGLE SONG
  // =========================

  const playSong = useCallback(
    (song, playlist = [], index = 0) => {
      if (!song) return;

      const targetPlaylist =
        playlist.length > 0 ? playlist : [song];

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

      setProgress(0);
      setDuration(0);
      setIsLoading(true);

      setCurrentPlaylist(targetPlaylist);
      setCurrentIndex(targetIndex);
      setIsPlaying(true);
    },
    [currentSong, currentIndex, currentPlaylist]
  );

  // =========================
  // ADD TO PLAYLIST
  // =========================

  const addToPlaylist = useCallback((songs) => {
    setCurrentPlaylist((previousSongs) => {
      const newSongs = songs.filter(
        (song) =>
          !previousSongs.some(
            (existingSong) => existingSong._id === song._id
          )
      );

      return [...previousSongs, ...newSongs];
    });
  }, []);

  // =========================
  // REMOVE FROM PLAYLIST  (FIXED)
  // =========================

  const removeFromPlaylist = useCallback(
    (songId) => {
      setCurrentPlaylist((previousPlaylist) => {
        const indexToRemove = previousPlaylist.findIndex(
          (song) => song._id === songId
        );

        if (indexToRemove === -1) return previousPlaylist;

        const newPlaylist = previousPlaylist.filter(
          (song) => song._id !== songId
        );

        // Playlist became empty → stop everything
        if (newPlaylist.length === 0) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }

          setCurrentIndex(0);
          setIsPlaying(false);
          setProgress(0);
          setDuration(0);

          return [];
        }

        // Adjust current index correctly
        if (indexToRemove < currentIndex) {
          // Removed a song before current → shift index down
          setCurrentIndex((i) => i - 1);
        } else if (indexToRemove === currentIndex) {
          // Removed the currently playing song → play replacement
          const newIndex = Math.min(
            currentIndex,
            newPlaylist.length - 1
          );

          setCurrentIndex(newIndex);
          setProgress(0);
          setDuration(0);
          // isPlaying stays as-is; song-change effect loads the new track
        }

        return newPlaylist;
      });
    },
    [currentIndex]
  );

  // =========================
  // CLEAR PLAYLIST
  // =========================

  const clearPlaylist = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    setCurrentPlaylist([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  // =========================
  // PLAY / PAUSE
  // =========================

  const togglePlayPause = useCallback(() => {
    if (currentSong) {
      setIsPlaying((previous) => !previous);
    }
  }, [currentSong]);

  // =========================
  // SHUFFLE TOGGLE
  // =========================

  const toggleShuffle = useCallback(() => {
    setShuffleMode((previous) => {
      const next = !previous;

      try {
        localStorage.setItem(
          STORAGE_KEYS.SHUFFLE,
          String(next)
        );
      } catch {
        // Ignore storage errors
      }

      return next;
    });
  }, []);

  // =========================
  // REPEAT TOGGLE
  // =========================

  const toggleRepeat = useCallback(() => {
    setRepeatMode((previous) => {
      const next = previous === "one" ? "all" : "one";

      try {
        localStorage.setItem(
          STORAGE_KEYS.REPEAT,
          next
        );
      } catch {
        // Ignore storage errors
      }

      return next;
    });
  }, []);

  // =========================
  // VOLUME
  // =========================

  const setVolumeLevel = useCallback((value) => {
    const rounded = Math.round(Number(value) * 100) / 100;

    const newVolume = Math.max(
      0,
      Math.min(1, rounded)
    );

    setVolumeState(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    try {
      localStorage.setItem(
        "ragafy_global_volume",
        String(newVolume)
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  // =========================
  // VOLUME STEP HELPERS (+10 / -10)
  // =========================

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
    if (!seconds || isNaN(seconds)) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
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
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

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

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const onEnded = () => {
      handleSongEnd();
    };

    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const onCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
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

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      if (
        audioRef.current &&
        !audioRef.current.paused
      ) {
        setProgress(audioRef.current.currentTime);
      }
    }, 500);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  // =========================
  // PLAY / PAUSE EFFECT
  // =========================

  useEffect(() => {
    if (
      !audioRef.current ||
      !isAudioReady ||
      !currentSong ||
      isLoading
    ) {
      return;
    }

    const audio = audioRef.current;

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [
    isPlaying,
    isLoading,
    isAudioReady,
    currentSong
  ]);

  // =========================
  // SONG CHANGE (offline-first, position-preserving)
  // =========================

  useEffect(() => {
    if (!audioRef.current || !isAudioReady || !currentSong) {
      return;
    }

    const audio = audioRef.current;

    let cancelled = false;
    let objectUrl = null;

    const resumeTime =
      Number.isFinite(audio.currentTime) && audio.currentTime > 0
        ? audio.currentTime
        : 0;

    const wasPlaying = isPlaying && !audio.paused;

    const restorePosition = () => {
      if (cancelled) return;

      if (resumeTime > 0 && Number.isFinite(audio.duration)) {
        try {
          audio.currentTime = Math.min(resumeTime, audio.duration);
        } catch {
          // Some browsers throw if the seek is invalid; ignore.
        }
      }

      if (wasPlaying) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    };

    const loadSongAudio = async () => {
      setIsLoading(true);

      try {
        const offlineBlob = await getOfflineSong(currentSong._id);

        if (cancelled) return;

        let newSrc = null;

        if (offlineBlob) {
          objectUrl = URL.createObjectURL(offlineBlob);
          newSrc = objectUrl;

          console.log(
            `🎵 Playing from offline cache: "${currentSong.title || currentSong._id}"`
          );
        } else if (navigator.onLine && currentSong.audioUrl) {
          newSrc = currentSong.audioUrl;

          console.log(
            `🌐 Streaming from server: "${currentSong.title || currentSong._id}"`
          );
        } else {
          audio.removeAttribute("src");
          audio.load();

          setIsPlaying(false);
          setIsLoading(false);

          console.warn(
            `⚠️ Cannot play "${currentSong.title || currentSong._id}" — not cached and offline.`
          );
          return;
        }

        const currentSrc = audio.currentSrc || audio.src;
        const isSameSource =
          currentSrc &&
          (currentSrc === newSrc ||
            currentSrc.endsWith(newSrc));

        if (isSameSource && !audio.error) {
          setIsLoading(false);
          return;
        }

        audio.addEventListener(
          "loadedmetadata",
          restorePosition,
          { once: true }
        );

        audio.src = newSrc;
        audio.load();
      } catch (error) {
        console.error("Error loading song audio:", error);

        if (cancelled) return;

        if (navigator.onLine && currentSong.audioUrl) {
          audio.addEventListener(
            "loadedmetadata",
            restorePosition,
            { once: true }
          );

          audio.src = currentSong.audioUrl;
          audio.load();
        } else {
          audio.removeAttribute("src");
          audio.load();

          setIsPlaying(false);
          setIsLoading(false);
        }
      }
    };

    loadSongAudio();

    return () => {
      cancelled = true;

      audio.removeEventListener("loadedmetadata", restorePosition);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    currentSong?._id,
    currentSong?.audioUrl,
    isAudioReady,
    networkVersion,
  ]);

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

      localStorage.setItem(
        STORAGE_KEYS.VOLUME,
        volume.toString()
      );
    } catch {
      // Ignore storage errors
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
        album: currentSong.album?.name || ""
      });

      navigator.mediaSession.setActionHandler(
        "play",
        () => setIsPlaying(true)
      );

      navigator.mediaSession.setActionHandler(
        "pause",
        () => setIsPlaying(false)
      );

      navigator.mediaSession.setActionHandler(
        "previoustrack",
        handlePrevious
      );

      navigator.mediaSession.setActionHandler(
        "nexttrack",
        handleNext
      );
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

            seekTo(
              Math.min(
                (audioRef.current?.currentTime || 0) + 10,
                duration
              )
            );
          }
          break;

        case "ArrowLeft":
          if (event.altKey) {
            event.preventDefault();
            handlePrevious();
          } else if (event.shiftKey) {
            event.preventDefault();

            seekTo(
              Math.max(
                (audioRef.current?.currentTime || 0) - 10,
                0
              )
            );
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

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
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
    decreaseVolume
  ]);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {
    // STATE
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

    // Existing history
    recentlyPlayedIds,

    // New global Played History
    playedSongIds,
    markPlayed,
    resetPlayed,

    // METHODS
    playPlaylist,
    playSong,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume: setVolumeLevel,
    increaseVolume,
    decreaseVolume,
    toggleShuffle,
    toggleRepeat,

    // UTILITIES
    formatTime
  };

  return (
    <GlobalPlayerContext.Provider value={value}>
      {children}
    </GlobalPlayerContext.Provider>
  );
}

// =========================
// HOOK
// =========================

export const useGlobalPlayer = () => {
  const context = useContext(GlobalPlayerContext);

  if (!context) {
    throw new Error(
      "useGlobalPlayer must be used within GlobalPlayerProvider"
    );
  }

  return context;
};