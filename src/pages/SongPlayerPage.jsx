// components/SongPlayerPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import "../assets/style/SongPlayerPage.css";

export default function SongPlayerPage() {
  const location = useLocation();
  const { songs = [], startIndex = 0 } = location.state || {};
  
  // Local state for current playlist/songs
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [playlistSongs, setPlaylistSongs] = useState(songs);
  const [originalSongs, setOriginalSongs] = useState(songs); // For restoring order when shuffle off
  
  // Player modes
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatOneMode, setRepeatOneMode] = useState(false); // Just true/false for repeat one
  
  const { 
    photos, 
    queue, 
    addToQueue, 
    addToQueueNext, 
    removeFromQueue,
    clearQueue 
  } = useData();
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const audioRef = useRef(null);
  const queuePanelRef = useRef(null);
  const volumeRef = useRef(null);

  const currentSong = playlistSongs[currentIndex];
  const navigate = useNavigate();

  // Shuffle function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    if (!shuffleMode) {
      // Save original order first time
      if (originalSongs.length === 0) {
        setOriginalSongs(playlistSongs);
      }
      // Shuffle current playlist
      setPlaylistSongs(shuffleArray(playlistSongs));
      setShuffleMode(true);
      
      showNotification('🔀 Shuffle on', '#ffa500');
    } else {
      // Restore original order
      setPlaylistSongs(originalSongs);
      // Find new index for current song in restored order
      if (currentSong) {
        const newIndex = originalSongs.findIndex(s => s._id === currentSong._id);
        if (newIndex !== -1) {
          setCurrentIndex(newIndex);
        }
      }
      setShuffleMode(false);
      
      showNotification('🔀 Shuffle off', '#666');
    }
  };

  // Toggle repeat one on/off
  const toggleRepeatOne = () => {
    const newMode = !repeatOneMode;
    setRepeatOneMode(newMode);
    
    // Show notification
    if (newMode) {
      showNotification('🔂 Repeat one - Current song repeats', '#2196F3');
    } else {
      showNotification('▶️ Normal playback - Playlist continues', '#ffa500');
    }
  };

  // Show notification helper
  const showNotification = (message, color) => {
    const notification = document.createElement('div');
    notification.className = 'ragafy-player__notification';
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (queuePanelRef.current && !queuePanelRef.current.contains(event.target) && 
          !event.target.closest('.ragafy-player__queue-toggle')) {
        setShowQueue(false);
      }
      if (volumeRef.current && !volumeRef.current.contains(event.target) &&
          !event.target.closest('.ragafy-player__volume-icon')) {
        setShowVolumeSlider(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio progress update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => setProgress(audio.currentTime);
    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Play/pause control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => console.log("Autoplay blocked"));
      else audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Media Session API
  useEffect(() => {
    if ("mediaSession" in navigator && currentSong) {
      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevious);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist?.name || "",
        album: currentSong.album?.name || "",
        artwork: photos[currentSong._id]
          ? [
              { src: photos[currentSong._id], sizes: "96x96", type: "image/png" },
              { src: photos[currentSong._id], sizes: "128x128", type: "image/png" },
              { src: photos[currentSong._id], sizes: "192x192", type: "image/png" },
              { src: photos[currentSong._id], sizes: "256x256", type: "image/png" },
              { src: photos[currentSong._id], sizes: "512x512", type: "image/png" },
            ]
          : [],
      });
    }
  }, [currentIndex, playlistSongs, photos, currentSong]);

  // Handle song end - PLAYLISTS ALWAYS CONTINUE AUTOMATICALLY (built-in)
  const handleSongEnd = () => {
    if (repeatOneMode) {
      // REPEAT ONE: Replay the same song
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      
      // Subtle visual feedback
      const notification = document.createElement('div');
      notification.className = 'ragafy-player__notification';
      notification.textContent = '🔂 Repeating current song';
      notification.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 1000);
      
      return;
    }

    // NORMAL PLAYLIST BEHAVIOR (ALWAYS HAPPENS)
    if (currentIndex < playlistSongs.length - 1) {
      // Go to next song
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of playlist - loop back to start (AUTOMATIC)
      setCurrentIndex(0);
      
      // Optional: Show playlist looping notification
      const notification = document.createElement('div');
      notification.className = 'ragafy-player__notification';
      notification.textContent = '🔄 Continuing from start';
      notification.style.background = 'linear-gradient(135deg, #ffa500, #ff8c00)';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 1500);
    }
  };

  // Handle next button
  const handleNext = () => {
    if (currentIndex < playlistSongs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop to start
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(playlistSongs.length - 1); // Loop to end
    }
  };

  const togglePlayPause = () => setIsPlaying(prev => !prev);
  
  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const handleAddToQueue = (song, playNext = false) => {
    if (playNext) {
      addToQueueNext(song);
      showNotification('✓ Added to play next', '#4CAF50');
    } else {
      addToQueue(song);
      showNotification('✓ Added to queue', '#4CAF50');
    }
  };

  const handleAddAllToQueue = () => {
    playlistSongs.forEach(song => addToQueue(song));
    showNotification(`✓ Added ${playlistSongs.length} songs to queue`, '#4CAF50');
  };

  const handleClearQueue = () => {
    if (queue.length > 0 && window.confirm('Clear the entire queue?')) {
      clearQueue();
      setShowQueue(false);
      showNotification('🗑️ Queue cleared', '#f44336');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get tooltip text for repeat button
  const getRepeatTitle = () => {
    return repeatOneMode 
      ? 'Repeat one - Current song repeats' 
      : 'Repeat off - Playlist continues automatically';
  };

  if (!playlistSongs.length || !currentSong) return <p>No songs provided</p>;

  return (
    <>
      <div className="ragafy-player__back" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left"></i>
      </div>

      <div className="ragafy-player">
        {/* Main Player Content */}
        <div className="ragafy-player__main">
          <div className="ragafy-player__header">
            {photos[currentSong._id] ? (
              <img
                src={photos[currentSong._id]}
                alt={currentSong.title}
                className="ragafy-player__photo"
              />
            ) : (
              <div className="ragafy-player__photo-placeholder">
                <i className="fa-solid fa-music"></i>
              </div>
            )}

            <h2 className="ragafy-player__title">{currentSong.title}</h2>

            <div className="ragafy-player__artist-info">
              {currentSong.artist?.name && (
                <span className="ragafy-player__artist">{currentSong.artist.name}</span>
              )}
              {currentSong.singers?.length > 0 && (
                <span className="ragafy-player__singers">
                  {currentSong.singers.map(s => s.name).join(", ")}
                </span>
              )}
            </div>

            {/* Mode Indicators */}
            <div className="ragafy-player__mode-indicators">
              {shuffleMode && (
                <span className="mode-indicator shuffle">
                  <i className="fa-solid fa-shuffle"></i> Shuffle on
                </span>
              )}
              {repeatOneMode && (
                <span className="mode-indicator repeat-one">
                  <i className="fa-solid fa-repeat-1"></i> Repeat one
                </span>
              )}
            </div>

            <div className="ragafy-player__meta-grid">
              {currentSong.album?.name && (
                <div className="ragafy-player__meta-item">
                  <i className="fa-solid fa-compact-disc"></i>
                  <span>{currentSong.album.name}</span>
                </div>
              )}
              {currentSong.movie?.name && (
                <div className="ragafy-player__meta-item">
                  <i className="fa-solid fa-film"></i>
                  <span>{currentSong.movie.name}</span>
                </div>
              )}
              {currentSong.language?.name && (
                <div className="ragafy-player__meta-item">
                  <i className="fa-solid fa-language"></i>
                  <span>{currentSong.language.name}</span>
                </div>
              )}
              {currentSong.genre?.name && (
                <div className="ragafy-player__meta-item">
                  <i className="fa-solid fa-tag"></i>
                  <span>{currentSong.genre.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="ragafy-player__audio-container">
            <audio
              ref={audioRef}
              src={currentSong.audioUrl}
              autoPlay
              onEnded={handleSongEnd}
              onLoadedMetadata={() => { 
                setDuration(audioRef.current.duration); 
                setProgress(0); 
              }}
            />

            {/* Time Display */}
            <div className="ragafy-player__time-display">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Progress Bar */}
            <input
              type="range"
              className="ragafy-player__progress"
              value={progress}
              onChange={handleSeek}
              max={duration || 0}
              step="0.1"
            />

            {/* Main Controls */}
            <div className="ragafy-player__controls">
              <button 
                className={`ragafy-player__control-btn shuffle ${shuffleMode ? 'active' : ''}`}
                onClick={toggleShuffle}
                title={shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
              >
                <i className="fa-solid fa-shuffle"></i>
              </button>

              <button 
                className="ragafy-player__control-btn previous"
                onClick={handlePrevious}
              >
                <i className="fa-solid fa-backward-step"></i>
              </button>

              <button 
                className="ragafy-player__control-btn play-pause"
                onClick={togglePlayPause}
              >
                <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
              </button>

              <button 
                className="ragafy-player__control-btn next"
                onClick={handleNext}
              >
                <i className="fa-solid fa-forward-step"></i>
              </button>

              <button 
                className={`ragafy-player__control-btn repeat-one ${repeatOneMode ? 'active' : ''}`}
                onClick={toggleRepeatOne}
                title={getRepeatTitle()}
              >
                <i className="fa-solid fa-repeat"></i>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="ragafy-player__bottom-controls">
              {/* Queue Toggle */}
              <button 
                className={`ragafy-player__queue-toggle ${showQueue ? 'active' : ''}`}
                onClick={() => setShowQueue(!showQueue)}
              >
                <i className="fa-solid fa-list"></i>
                <span className="ragafy-player__queue-count">{queue.length}</span>
              </button>

              {/* Volume Control */}
              <div className="ragafy-player__volume-control" ref={volumeRef}>
                <button 
                  className="ragafy-player__volume-icon"
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                >
                  {volume === 0 ? (
                    <i className="fa-solid fa-volume-off"></i>
                  ) : volume < 0.5 ? (
                    <i className="fa-solid fa-volume-low"></i>
                  ) : (
                    <i className="fa-solid fa-volume-high"></i>
                  )}
                </button>
                
                {showVolumeSlider && (
                  <input
                    type="range"
                    className="ragafy-player__volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        {showQueue && (
          <div className="ragafy-player__queue-panel" ref={queuePanelRef}>
            <div className="ragafy-player__queue-header">
              <h3>
                <i className="fa-solid fa-list"></i>
                Queue
                <span className="ragafy-player__queue-count-badge">{queue.length}</span>
              </h3>
              <button 
                className="ragafy-player__queue-close"
                onClick={() => setShowQueue(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Now Playing */}
            {currentSong && (
              <div className="ragafy-player__queue-now-playing">
                <span className="ragafy-player__queue-label">NOW PLAYING</span>
                <div className="ragafy-player__queue-current">
                  {photos[currentSong._id] && (
                    <img 
                      src={photos[currentSong._id]} 
                      alt={currentSong.title}
                      className="ragafy-player__queue-current-image"
                    />
                  )}
                  <div className="ragafy-player__queue-current-info">
                    <span className="ragafy-player__queue-current-title">
                      {currentSong.title}
                    </span>
                    <span className="ragafy-player__queue-current-artist">
                      {currentSong.artist?.name || currentSong.singers?.[0]?.name}
                    </span>
                  </div>
                  <button 
                    className="ragafy-player__queue-add-next"
                    onClick={() => handleAddToQueue(currentSong, true)}
                    title="Play next"
                  >
                    <i className="fa-solid fa-forward"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Queue List */}
            <div className="ragafy-player__queue-list">
              <span className="ragafy-player__queue-label">NEXT IN QUEUE</span>
              
              {queue.length === 0 ? (
                <div className="ragafy-player__queue-empty">
                  <i className="fa-solid fa-music"></i>
                  <p>Queue is empty</p>
                  <button 
                    className="ragafy-player__queue-browse"
                    onClick={() => navigate('/browse')}
                  >
                    Browse Songs
                  </button>
                </div>
              ) : (
                queue.map((song, index) => (
                  <div 
                    key={`${song._id}-${index}`}
                    className="ragafy-player__queue-item"
                  >
                    <span className="ragafy-player__queue-item-index">
                      {index + 1}
                    </span>
                    
                    {photos[song._id] && (
                      <img 
                        src={photos[song._id]} 
                        alt={song.title}
                        className="ragafy-player__queue-item-image"
                      />
                    )}
                    
                    <div className="ragafy-player__queue-item-info">
                      <span className="ragafy-player__queue-item-title">
                        {song.title}
                      </span>
                      <span className="ragafy-player__queue-item-artist">
                        {song.artist?.name || song.singers?.[0]?.name}
                      </span>
                    </div>

                    <div className="ragafy-player__queue-item-actions">
                      <button 
                        className="ragafy-player__queue-item-btn play-next"
                        onClick={() => handleAddToQueue(song, true)}
                        title="Play next"
                      >
                        <i className="fa-solid fa-forward"></i>
                      </button>
                      <button 
                        className="ragafy-player__queue-item-btn remove"
                        onClick={() => removeFromQueue(song._id)}
                        title="Remove from queue"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Queue Actions */}
            {queue.length > 0 && (
              <div className="ragafy-player__queue-actions">
                <button 
                  className="ragafy-player__queue-action"
                  onClick={() => {
                    navigate('/queue');
                    setShowQueue(false);
                  }}
                >
                  <i className="fa-solid fa-expand"></i>
                  View Full Queue
                </button>
                <button 
                  className="ragafy-player__queue-action clear"
                  onClick={handleClearQueue}
                >
                  <i className="fa-regular fa-trash-can"></i>
                  Clear Queue
                </button>
              </div>
            )}
          </div>
        )}

        {/* Song List */}
        <div className="ragafy-player__song-list">
          <div className="ragafy-player__song-list-header">
            <h3>
              <i className="fa-regular fa-rectangle-list"></i>
              Playlist
              {shuffleMode && (
                <span className="shuffle-indicator">
                  <i className="fa-solid fa-shuffle"></i>
                </span>
              )}
              {repeatOneMode && (
                <span className="repeat-one-indicator-header">
                  <i className="fa-solid fa-repeat-1"></i>
                </span>
              )}
            </h3>
            <button 
              className="ragafy-player__add-all-btn"
              onClick={handleAddAllToQueue}
              title="Add all to queue"
            >
              <i className="fa-regular fa-square-plus"></i>
              Add All
            </button>
          </div>
          
          <div className="ragafy-player__song-list-items">
            {playlistSongs.map((song, idx) => (
              <div
                key={song._id}
                onClick={() => setCurrentIndex(idx)}
                className={`ragafy-player__song-item ${
                  idx === currentIndex ? "active" : ""
                }`}
              >
                {photos[song._id] && (
                  <img 
                    src={photos[song._id]} 
                    alt={song.title} 
                    className="ragafy-player__song-item-image" 
                  />
                )}
                <div className="ragafy-player__song-item-info">
                  <span className="ragafy-player__song-item-title">
                    {song.title}
                  </span>
                  <span className="ragafy-player__song-item-subtitle">
                    {song.artist?.name || song.singers?.[0]?.name}
                  </span>
                </div>
                <button 
                  className="ragafy-player__song-item-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToQueue(song);
                  }}
                  title="Add to queue"
                >
                  <i className="fa-regular fa-square-plus"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}