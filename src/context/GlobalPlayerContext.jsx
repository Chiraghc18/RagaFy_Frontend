// context/GlobalPlayerContext.jsx

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback
} from 'react';

const GlobalPlayerContext = createContext(null);

// =========================
// LOCAL STORAGE KEYS
// =========================

const STORAGE_KEYS = {
  PLAYLIST: 'ragafy_global_playlist',
  CURRENT_INDEX: 'ragafy_global_index',
  VOLUME: 'ragafy_global_volume',
  SHUFFLE: 'ragafy_global_shuffle',
  REPEAT: 'ragafy_global_repeat'
};

export function GlobalPlayerProvider({ children }) {

  // =========================
  // STATES
  // =========================

  const [currentPlaylist, setCurrentPlaylist] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.PLAYLIST)
      ) || [];
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      return parseInt(
        localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX),
        10
      ) || 0;
    } catch {
      return 0;
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const [volume, setVolumeState] = useState(() => {
    try {
      return parseFloat(
        localStorage.getItem(STORAGE_KEYS.VOLUME)
      ) || 1;
    } catch {
      return 1;
    }
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
      return localStorage.getItem(
        STORAGE_KEYS.SHUFFLE
      ) === 'true';
    } catch {
      return false;
    }
  });

  const [repeatMode, setRepeatMode] = useState(() => {
  try {
    return (
      localStorage.getItem(
        STORAGE_KEYS.REPEAT
      ) || 'all'
    );
  } catch {
    return 'all';
  }
});

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
  // BUILD SHUFFLE ORDER
  // =========================

  useEffect(() => {

    if (
      shuffleMode &&
      currentPlaylist.length > 0
    ) {

      const indices =
        currentPlaylist.map((_, i) => i);

      const rest = indices.filter(
        i => i !== currentIndex
      );

      for (
        let i = rest.length - 1;
        i > 0;
        i--
      ) {
        const j = Math.floor(
          Math.random() * (i + 1)
        );

        [rest[i], rest[j]] =
          [rest[j], rest[i]];
      }

      setShuffleOrder([
        currentIndex,
        ...rest
      ]);
    }

  }, [
    shuffleMode,
    currentPlaylist.length,
    currentIndex
  ]);

  // =========================
  // NEXT INDEX
  // =========================

  const getNextIndex = useCallback(() => {

    if (repeatMode === 'one') {
      return currentIndex;
    }

    if (
      shuffleMode &&
      shuffleOrder.length > 0
    ) {

      const pos =
        shuffleOrder.indexOf(currentIndex);

      if (pos === shuffleOrder.length - 1) {
          return shuffleOrder[0];
      }

      return shuffleOrder[pos + 1];
    }

    if (
      currentIndex + 1 >=
      currentPlaylist.length
    ) {
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

    if (repeatMode === 'one') {
      return currentIndex;
    }

    if (
      shuffleMode &&
      shuffleOrder.length > 0
    ) {

      const pos =
        shuffleOrder.indexOf(currentIndex);

      if (pos === 0) {
  return shuffleOrder[
    shuffleOrder.length - 1
  ];
}

      return shuffleOrder[pos - 1];
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

  }, [
    currentPlaylist,
    getNextIndex
  ]);

  // =========================
  // PREVIOUS SONG
  // =========================

  const handlePrevious = useCallback(() => {

    if (!currentPlaylist?.length) return;

    // Restart song if >3 sec
    if (
      audioRef.current &&
      audioRef.current.currentTime > 3
    ) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    const prevIndex = getPrevIndex();

    if (prevIndex === null) return;

    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    setCurrentIndex(prevIndex);
    setIsPlaying(true);

  }, [
    currentPlaylist,
    getPrevIndex
  ]);

  // =========================
  // SEEK
  // =========================

  const seekTo = useCallback((time) => {

    if (
      audioRef.current &&
      isAudioReady
    ) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }

  }, [isAudioReady]);

  // =========================
  // PLAY PLAYLIST
  // =========================

  const playPlaylist = useCallback((
    songs,
    startIndex = 0
  ) => {

    if (!songs?.length) return;

    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    setCurrentPlaylist(songs);
    setCurrentIndex(startIndex);

    setIsPlaying(true);

  }, []);

  // =========================
  // PLAY SINGLE SONG
  // =========================

  const playSong = useCallback((
    song,
    playlist = [],
    index = 0
  ) => {

    if (!song) return;

    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    if (playlist.length > 0) {

      setCurrentPlaylist(playlist);
      setCurrentIndex(index);

    } else {

      setCurrentPlaylist([song]);
      setCurrentIndex(0);

    }

    setIsPlaying(true);

  }, []);

  // =========================
  // ADD TO PLAYLIST
  // =========================

  const addToPlaylist = useCallback((songs) => {

    setCurrentPlaylist(prev => {

      const newSongs = songs.filter(
        song =>
          !prev.some(
            s => s._id === song._id
          )
      );

      return [...prev, ...newSongs];
    });

  }, []);

  // =========================
  // REMOVE FROM PLAYLIST
  // =========================

  const removeFromPlaylist = useCallback((songId) => {

    setCurrentPlaylist(prev => {

      const newPlaylist =
        prev.filter(
          song => song._id !== songId
        );

      if (
        currentIndex >=
        newPlaylist.length
      ) {
        setCurrentIndex(0);
        setProgress(0);
        setDuration(0);
      }

      return newPlaylist;
    });

  }, [currentIndex]);

  // =========================
  // CLEAR PLAYLIST
  // =========================

  const clearPlaylist = useCallback(() => {

    if (audioRef.current) {

      audioRef.current.pause();
      audioRef.current.src = '';
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
      setIsPlaying(prev => !prev);
    }

  }, [currentSong]);

  // =========================
  // SHUFFLE TOGGLE
  // =========================

  const toggleShuffle = useCallback(() => {

    setShuffleMode(prev => {

      const next = !prev;

      localStorage.setItem(
        STORAGE_KEYS.SHUFFLE,
        String(next)
      );

      return next;
    });

  }, []);

  // =========================
  // REPEAT TOGGLE
  // =========================

  const toggleRepeat = useCallback(() => {

  setRepeatMode(prev => {

      const next =
        prev === 'one'
          ? 'all'
          : 'one';

      localStorage.setItem(
        STORAGE_KEYS.REPEAT,
        next
      );

      return next;
    });

  }, []);

  // =========================
  // VOLUME
  // =========================

  const setVolumeLevel = useCallback((newVolume) => {

    setVolumeState(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    localStorage.setItem(
      STORAGE_KEYS.VOLUME,
      String(newVolume)
    );

  }, []);

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = useCallback((seconds) => {

    if (!seconds || isNaN(seconds)) {
      return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs
      .toString()
      .padStart(2, '0')}`;

  }, []);

  // =========================
  // INIT AUDIO
  // =========================

  useEffect(() => {

    const audio = new Audio();

    audio.preload = 'metadata';

    audioRef.current = audio;

    setIsAudioReady(true);

    return () => {

      if (progressInterval.current) {
        clearInterval(
          progressInterval.current
        );
      }

      audio.pause();
      audio.src = '';

      audioRef.current = null;
    };

  }, []);

  // =========================
  // AUDIO EVENTS
  // =========================

  useEffect(() => {

    if (
      !audioRef.current ||
      !isAudioReady
    ) return;

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

    audio.addEventListener(
      'loadedmetadata',
      onLoadedMetadata
    );

    audio.addEventListener(
      'timeupdate',
      onTimeUpdate
    );

    audio.addEventListener(
      'ended',
      onEnded
    );

    audio.addEventListener(
      'error',
      onError
    );

    audio.addEventListener(
      'canplay',
      onCanPlay
    );

    return () => {

      audio.removeEventListener(
        'loadedmetadata',
        onLoadedMetadata
      );

      audio.removeEventListener(
        'timeupdate',
        onTimeUpdate
      );

      audio.removeEventListener(
        'ended',
        onEnded
      );

      audio.removeEventListener(
        'error',
        onError
      );

      audio.removeEventListener(
        'canplay',
        onCanPlay
      );
    };

  }, [
    isAudioReady,
    handleSongEnd,
    isPlaying
  ]);

  // =========================
  // PROGRESS INTERVAL
  // =========================

  useEffect(() => {

    if (
      !audioRef.current ||
      !isPlaying
    ) return;

    if (progressInterval.current) {
      clearInterval(
        progressInterval.current
      );
    }

    progressInterval.current =
      setInterval(() => {

        if (
          audioRef.current &&
          !audioRef.current.paused
        ) {
          setProgress(
            audioRef.current.currentTime
          );
        }

      }, 500);

    return () => {

      if (progressInterval.current) {
        clearInterval(
          progressInterval.current
        );
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
    ) return;

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
    ) return;

    if (!currentSong.audioUrl) {

      setIsLoading(false);
      return;
    }

    audioRef.current.pause();

    audioRef.current.src =
      currentSong.audioUrl;

    audioRef.current.load();

  }, [
    currentIndex,
    isAudioReady,
    currentSong
  ]);

  // =========================
  // VOLUME EFFECT
  // =========================

  useEffect(() => {

    if (
      audioRef.current &&
      isAudioReady
    ) {
      audioRef.current.volume = volume;
    }

  }, [volume, isAudioReady]);

  // =========================
  // SAVE TO LOCAL STORAGE
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

    } catch {}

  }, [
    currentPlaylist,
    currentIndex,
    volume
  ]);

  // =========================
  // MEDIA SESSION API
  // =========================

  useEffect(() => {

    if (
      'mediaSession' in navigator &&
      currentSong
    ) {

      navigator.mediaSession.metadata =
        new window.MediaMetadata({
          title: currentSong.title,
          artist:
            currentSong.artist?.name || '',
          album:
            currentSong.album?.name || ''
        });

      navigator.mediaSession.setActionHandler(
        'play',
        () => setIsPlaying(true)
      );

      navigator.mediaSession.setActionHandler(
        'pause',
        () => setIsPlaying(false)
      );

      navigator.mediaSession.setActionHandler(
        'previoustrack',
        handlePrevious
      );

      navigator.mediaSession.setActionHandler(
        'nexttrack',
        handleNext
      );
    }

  }, [
    currentSong,
    handleNext,
    handlePrevious
  ]);

  // =========================
  // GLOBAL KEYBOARD SHORTCUTS
  // =========================

  useEffect(() => {

    const handleKey = (e) => {

      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (!currentSong) return;

      switch (e.code) {

        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;

        case 'ArrowRight':

          if (e.altKey) {

            e.preventDefault();
            handleNext();

          } else if (e.shiftKey) {

            e.preventDefault();

            seekTo(
              Math.min(
                (
                  audioRef.current
                    ?.currentTime || 0
                ) + 10,
                duration
              )
            );
          }

          break;

        case 'ArrowLeft':

          if (e.altKey) {

            e.preventDefault();
            handlePrevious();

          } else if (e.shiftKey) {

            e.preventDefault();

            seekTo(
              Math.max(
                (
                  audioRef.current
                    ?.currentTime || 0
                ) - 10,
                0
              )
            );
          }

          break;

        case 'ArrowUp':

          if (e.shiftKey) {

            e.preventDefault();

            setVolumeLevel(
              Math.min(volume + 0.1, 1)
            );
          }

          break;

        case 'ArrowDown':

          if (e.shiftKey) {

            e.preventDefault();

            setVolumeLevel(
              Math.max(volume - 0.1, 0)
            );
          }

          break;

        case 'KeyS':

          if (e.altKey) {

            e.preventDefault();
            toggleShuffle();
          }

          break;

        case 'KeyR':

          if (e.altKey) {

            e.preventDefault();
            toggleRepeat();
          }

          break;

        default:
          break;
      }
    };

    window.addEventListener(
      'keydown',
      handleKey
    );

    return () => {

      window.removeEventListener(
        'keydown',
        handleKey
      );
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

  // =========================
  // RETURN
  // =========================

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

  const context =
    useContext(GlobalPlayerContext);

  if (!context) {

    throw new Error(
      'useGlobalPlayer must be used within GlobalPlayerProvider'
    );
  }

  return context;
};