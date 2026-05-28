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

// localStorage keys
const STORAGE_KEYS = {
  PLAYLIST: 'ragafy_global_playlist',
  CURRENT_INDEX: 'ragafy_global_index',
  VOLUME: 'ragafy_global_volume'
};

export function GlobalPlayerProvider({ children }) {

  // =========================
  // STATES
  // =========================

  const [currentPlaylist, setCurrentPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
      return saved ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
  // SONG END
  // =========================

  const handleSongEnd = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;

    const nextIndex =
      (currentIndex + 1) % currentPlaylist.length;

    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    setCurrentIndex(nextIndex);
    setIsPlaying(true);

  }, [currentIndex, currentPlaylist]);

  // =========================
  // NEXT SONG
  // =========================

  const handleNext = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;

    const nextIndex =
      (currentIndex + 1) % currentPlaylist.length;

    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    setCurrentIndex(nextIndex);
    setIsPlaying(true);

  }, [currentIndex, currentPlaylist]);

  // =========================
  // PREVIOUS SONG
  // =========================

  const handlePrevious = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;

    const prevIndex =
      (currentIndex - 1 + currentPlaylist.length) %
      currentPlaylist.length;

    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    setCurrentIndex(prevIndex);
    setIsPlaying(true);

  }, [currentIndex, currentPlaylist]);

  // =========================
  // SEEK
  // =========================

  const seekTo = useCallback((time) => {
    if (audioRef.current && isAudioReady) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, [isAudioReady]);

  // =========================
  // PLAY PLAYLIST
  // =========================

  const playPlaylist = useCallback((songs, startIndex = 0) => {
    if (!songs || songs.length === 0) return;

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

  const playSong = useCallback((song, playlist = [], index = 0) => {

    if (!song) return;

    console.log('🎵 Playing selected song:', song.title);

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
        song => !prev.some(s => s._id === song._id)
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
        prev.filter(song => song._id !== songId);

      if (currentIndex >= newPlaylist.length) {
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
  // VOLUME
  // =========================

  const setVolumeLevel = useCallback((newVolume) => {
    setVolume(newVolume);
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

    return `${mins}:${secs.toString().padStart(2, '0')}`;

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
        clearInterval(progressInterval.current);
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

    if (!audioRef.current || !isAudioReady) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setProgress(0);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleEnded = () => {
      handleSongEnd();
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleCanPlay = () => {

      if (isPlaying) {

        audio.play().catch(error => {
          console.error(error);
          setIsPlaying(false);
        });

      }
    };

    audio.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata
    );

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate
    );

    audio.addEventListener(
      'ended',
      handleEnded
    );

    audio.addEventListener(
      'error',
      handleError
    );

    audio.addEventListener(
      'canplay',
      handleCanPlay
    );

    return () => {

      audio.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      audio.removeEventListener(
        'timeupdate',
        handleTimeUpdate
      );

      audio.removeEventListener(
        'ended',
        handleEnded
      );

      audio.removeEventListener(
        'error',
        handleError
      );

      audio.removeEventListener(
        'canplay',
        handleCanPlay
      );
    };

  }, [isAudioReady, handleSongEnd, isPlaying]);

  // =========================
  // PROGRESS TRACKING
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
  // PLAY / PAUSE CONTROL
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

      audio.play().catch(error => {
        console.error(error);
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

    const audio = audioRef.current;

    if (!currentSong.audioUrl) {
      console.error('No audio URL');
      setIsLoading(false);
      return;
    }

    audio.pause();

    audio.src = currentSong.audioUrl;

    audio.load();

  }, [
    currentIndex,
    isAudioReady,
    currentSong
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
  // SAVE LOCAL STORAGE
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

    } catch (error) {

      console.error(error);

    }

  }, [
    currentPlaylist,
    currentIndex,
    volume
  ]);

  // =========================
  // MEDIA SESSION
  // =========================

  useEffect(() => {

    if ("mediaSession" in navigator && currentSong) {

      navigator.mediaSession.metadata =
        new window.MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist?.name || '',
          album: currentSong.album?.name || '',
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

  }, [
    currentSong,
    handleNext,
    handlePrevious
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

export const useGlobalPlayer = () => {

  const context = useContext(GlobalPlayerContext);

  if (!context) {
    throw new Error(
      'useGlobalPlayer must be used within GlobalPlayerProvider'
    );
  }

  return context;
};