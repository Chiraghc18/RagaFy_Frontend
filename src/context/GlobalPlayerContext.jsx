import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback
} from "react";

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
  // Existing feature: latest 20 songs
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
  // New feature for HomeSections
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

  // Add a song to the history only once
  const markPlayed = useCallback((songId) => {
    if (!songId) return;

    setPlayedSongIds((previousIds) => {
      if (previousIds.includes(songId)) {
        return previousIds;
      }

      return [...previousIds, songId];
    });
  }, []);

  // Clear only the new Played History
  const resetPlayed = useCallback(() => {
    setPlayedSongIds([]);
  }, []);

  // Save Played History
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
  // Works across the application
  // =========================

  useEffect(() => {
    if (!currentSong?._id) return;

    const songId = currentSong._id;

    // Preserve the existing Recently Played functionality
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

    // Add to the global Played History
    markPlayed(songId);
  }, [currentSong?._id, markPlayed]);

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

    // Restart the current song if it has played for more than 3 seconds
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

      // If the same song is already loaded at the same position,
      // resume without resetting playback.
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
  // REMOVE FROM PLAYLIST
  // =========================

  const removeFromPlaylist = useCallback(
    (songId) => {
      setCurrentPlaylist((previousPlaylist) => {
        const newPlaylist = previousPlaylist.filter(
          (song) => song._id !== songId
        );

        if (currentIndex >= newPlaylist.length) {
          setCurrentIndex(0);
          setProgress(0);
          setDuration(0);
        }

        return newPlaylist;
      });
    },
    [currentIndex]
  );

  // =========================
  // CLEAR PLAYLIST
  // Does not clear Played History
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
  const newVolume = Math.max(
    0,
    Math.min(1, Number(value))
  );

  setVolumeState(newVolume);

  if (audioRef.current) {
    audioRef.current.volume = newVolume;
  }

  localStorage.setItem(
    "ragafy_global_volume",
    String(newVolume)
  );
}, []);

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
      setProgress(0);
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
  // SONG CHANGE
  // =========================

  useEffect(() => {
    if (
      !audioRef.current ||
      !isAudioReady ||
      !currentSong
    ) {
      return;
    }

    if (!currentSong.audioUrl) {
      setIsLoading(false);
      return;
    }

    audioRef.current.pause();
    audioRef.current.src = currentSong.audioUrl;
    audioRef.current.load();
  }, [currentIndex, isAudioReady, currentSong]);

  // =========================
  // VOLUME EFFECT
  // =========================

  useEffect(() => {
    if (audioRef.current && isAudioReady) {
      audioRef.current.volume = volume;
    }
  }, [volume, isAudioReady]);

  useEffect(() => {
  if (audioRef.current) {
    audioRef.current.volume = volume;
  }
}, [volume]);
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
            setVolumeLevel(Math.min(volume + 0.1, 1));
          }
          break;

        case "ArrowDown":
          if (event.shiftKey) {
            event.preventDefault();
            setVolumeLevel(Math.max(volume - 0.1, 0));
          }
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
    volume,
    duration,
    toggleShuffle,
    toggleRepeat,
    setVolumeLevel
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