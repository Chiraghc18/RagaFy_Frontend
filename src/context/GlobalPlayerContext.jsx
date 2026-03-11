// context/GlobalPlayerContext.jsx
import React, { createContext, useState, useContext, useRef, useEffect, useCallback } from 'react';

const GlobalPlayerContext = createContext(null);

// localStorage keys for global player
const STORAGE_KEYS = {
  PLAYLIST: 'ragafy_global_playlist',
  CURRENT_INDEX: 'ragafy_global_index',
  VOLUME: 'ragafy_global_volume'
};

export function GlobalPlayerProvider({ children }) {
  // ===== 1. ALL useState declarations =====
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

  // ===== 2. Define currentSong =====
  const currentSong = currentPlaylist[currentIndex];

  // ===== 3. useRef declarations =====
  const audioRef = useRef(null);
  const progressInterval = useRef(null);

  // ===== 4. ALL useCallback hooks =====

  const handleSongEnd = useCallback(() => {
    console.log('🔴 ===== SONG ENDED =====');
    console.log('Current index:', currentIndex);
    console.log('Playlist length:', currentPlaylist?.length);
    
    if (!currentPlaylist || currentPlaylist.length === 0) {
      console.log('❌ No playlist');
      return;
    }

    // Calculate next index (loop back to 0 if at the end)
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    
    console.log('➡️ Moving to next song:', {
      from: currentIndex,
      to: nextIndex,
      song: currentPlaylist[nextIndex]?.title
    });

    // CRITICAL FIX: Reset progress and duration BEFORE changing song
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    
    // Update to next song and play
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
    
  }, [currentIndex, currentPlaylist]);

  const handleNext = useCallback(() => {
    console.log('⏭️ Next button clicked');
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    
    // Calculate next index with loop
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    console.log('Manual next to index:', nextIndex, 'song:', currentPlaylist[nextIndex]?.title);
    
    // CRITICAL FIX: Reset progress and duration
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
    
  }, [currentIndex, currentPlaylist]);

  const handlePrevious = useCallback(() => {
    console.log('⏮️ Previous button clicked');
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    
    // Calculate previous index with loop
    const prevIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    console.log('Manual previous to index:', prevIndex, 'song:', currentPlaylist[prevIndex]?.title);
    
    // CRITICAL FIX: Reset progress and duration
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
    
  }, [currentIndex, currentPlaylist]);

  const seekTo = useCallback((time) => {
    if (audioRef.current && isAudioReady) {
      console.log('🎯 Seeking to:', time);
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, [isAudioReady]);

  // Public methods
  const playPlaylist = useCallback((songs, startIndex = 0) => {
    if (!songs || songs.length === 0) return;
    
    console.log('🎵 Playing playlist with', songs.length, 'songs, starting at index:', startIndex);
    console.log('First song:', songs[startIndex]?.title);
    
    // Reset states for new playlist
    setProgress(0);
    setDuration(0);
    setIsLoading(true);
    
    setCurrentPlaylist(songs);
    setCurrentIndex(startIndex);
    setIsPlaying(true);
  }, []);

  const addToPlaylist = useCallback((songs) => {
    setCurrentPlaylist(prev => {
      const newSongs = songs.filter(
        song => !prev.some(s => s._id === song._id)
      );
      console.log('Adding', newSongs.length, 'new songs to playlist');
      return [...prev, ...newSongs];
    });
  }, []);

  const removeFromPlaylist = useCallback((songId) => {
    setCurrentPlaylist(prev => {
      const newPlaylist = prev.filter(song => song._id !== songId);
      
      // Adjust current index if needed
      if (currentIndex >= newPlaylist.length) {
        setCurrentIndex(0); // Reset to first song if current was removed
        setProgress(0);
        setDuration(0);
      }
      
      return newPlaylist;
    });
  }, [currentIndex]);

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

  const togglePlayPause = useCallback(() => {
    if (currentSong) {
      console.log('⏯️ Toggle play/pause, currently:', isPlaying ? 'playing' : 'paused');
      setIsPlaying(prev => !prev);
    }
  }, [currentSong, isPlaying]);

  const setVolumeLevel = useCallback((newVolume) => {
    setVolume(newVolume);
  }, []);

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ===== 5. ALL useEffect hooks =====

  // Initialize audio element
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

  // Set up audio event listeners
  useEffect(() => {
    if (!audioRef.current || !isAudioReady) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      console.log('📊 Audio loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setProgress(0); // CRITICAL: Reset progress when new song loads
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleEnded = () => {
      console.log('🎵 ===== AUDIO ENDED EVENT FIRED =====');
      handleSongEnd();
    };

    const handleError = (e) => {
      console.error('❌ Audio error:', e);
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log('✅ Audio can play now');
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('❌ Playback failed:', error);
          setIsPlaying(false);
        });
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isAudioReady, handleSongEnd, isPlaying]);

  // Progress tracking (fallback)
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Set up new interval
    progressInterval.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setProgress(audioRef.current.currentTime);
      }
    }, 500);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  // Play/pause control
  useEffect(() => {
    if (!audioRef.current || !isAudioReady || !currentSong || isLoading) return;

    const audio = audioRef.current;

    if (isPlaying) {
      console.log('▶️ Playing:', currentSong.title);
      audio.play().catch(error => {
        console.error('❌ Playback failed:', error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoading, isAudioReady, currentSong]);

  // Update audio source when song changes
  useEffect(() => {
    if (!audioRef.current || !isAudioReady || !currentSong) return;

    const audio = audioRef.current;
    const wasPlaying = isPlaying;

    console.log('🎵 Loading:', currentSong.title);

    if (!currentSong.audioUrl) {
      console.error('❌ No audio URL for song:', currentSong.title);
      setIsLoading(false);
      return;
    }

    // Pause current playback
    audio.pause();
    
    // Set new source
    audio.src = currentSong.audioUrl;
    audio.load();

    // Note: We don't call play() here - it will be triggered by canplay event
    
  }, [currentIndex, isAudioReady, currentSong]);

  // Volume control
  useEffect(() => {
    if (audioRef.current && isAudioReady) {
      audioRef.current.volume = volume;
    }
  }, [volume, isAudioReady]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(currentPlaylist));
      localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, currentIndex.toString());
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    } catch (error) {
      console.error('Error saving player state:', error);
    }
  }, [currentPlaylist, currentIndex, volume]);

  // Media Session API
  useEffect(() => {
    if ("mediaSession" in navigator && currentSong) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist?.name || '',
        album: currentSong.album?.name || '',
      });
      
      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevious);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
    }
  }, [currentSong, handleNext, handlePrevious]);

  // ===== 6. Prepare value object =====
  const value = {
    // State
    currentPlaylist,
    currentIndex,
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    isLoading,
    
    // Methods
    playPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume: setVolumeLevel,
    
    // Utilities
    formatTime
  };

  // ===== 7. Return Provider =====
  return (
    <GlobalPlayerContext.Provider value={value}>
      {children}
    </GlobalPlayerContext.Provider>
  );
}

export const useGlobalPlayer = () => {
  const context = useContext(GlobalPlayerContext);
  if (!context) {
    throw new Error('useGlobalPlayer must be used within a GlobalPlayerProvider');
  }
  return context;
};