// pages/SongPlayerPage.jsx
import React, { useState, useEffect ,useRef} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import "../assets/style/SongPlayerPage.css";

export default function SongPlayerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { songs = [], startIndex = 0 } = location.state || {};
  
  const { photos, queue, addToQueue, removeFromQueue, clearQueue } = useData();
  const {
    currentPlaylist,
    currentIndex,
    currentSong,
    isPlaying,
    progress,
    duration,
    shuffleMode,
    repeatMode,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    playPlaylist,
    formatTime
  } = useGlobalPlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [animatingSong, setAnimatingSong] = useState(null);
  
  const queuePanelRef = useRef(null);
  const volumeRef = useRef(null);

  // Create a Set of queue song IDs for quick lookup
  const queueSongIds = new Set(queue.map(song => song._id));

  // Initialize player with songs from location if provided
  useEffect(() => {
    if (songs && songs.length > 0) {
      playPlaylist(songs, startIndex);
    }
  }, [songs, startIndex]);

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

  const showNotification = (message, color) => {
    const notification = document.createElement('div');
    notification.className = 'ragafy-player__notification';
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleAddToQueue = (song, playNext = false) => {
    // Trigger animation
    setAnimatingSong(song._id);
    setTimeout(() => setAnimatingSong(null), 500);
    
    if (playNext) {
      addToQueue(song);
      showNotification('✓ Added to play next', '#4CAF50');
    } else {
      addToQueue(song);
      showNotification('✓ Added to queue', '#4CAF50');
    }
  };

  const handleAddAllToQueue = () => {
    currentPlaylist.forEach(song => addToQueue(song));
    showNotification(`✓ Added ${currentPlaylist.length} songs to queue`, '#4CAF50');
  };

  const handleClearQueue = () => {
    if (queue.length > 0 && window.confirm('Clear the entire queue?')) {
      clearQueue();
      setShowQueue(false);
      showNotification('🗑️ Queue cleared', '#f44336');
    }
  };

  const isSongInQueue = (songId) => {
    return queueSongIds.has(songId);
  };

  if (!currentPlaylist.length || !currentSong) {
    return (
      <div className="ragafy-player__empty">
        <i className="fa-solid fa-music"></i>
        <h2>No song playing</h2>
        <p>Select a song to start playing</p>
        <button onClick={() => navigate('/browse')} className="ragafy-player__browse-btn">
          Browse Songs
        </button>
      </div>
    );
  }

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
              {repeatMode === 'one' && (
                <span className="mode-indicator repeat-one">
                  <i className="fa-solid fa-repeat-1"></i> Repeat one
                </span>
              )}
              {repeatMode === 'all' && (
                <span className="mode-indicator repeat-all">
                  <i className="fa-solid fa-repeat"></i> Repeat all
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
              onChange={(e) => seekTo(parseFloat(e.target.value))}
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
                className={`ragafy-player__control-btn repeat ${
                  repeatMode !== 'none' ? 'active' : ''
                }`}
                onClick={toggleRepeat}
                title={
                  repeatMode === 'one' 
                    ? 'Repeat one' 
                    : repeatMode === 'all' 
                    ? 'Repeat all' 
                    : 'Repeat off'
                }
              >
                <i className={`fa-solid ${
                  repeatMode === 'one' ? 'fa-repeat-1' : 'fa-repeat'
                }`}></i>
                {repeatMode === 'one' && <span className="repeat-one-indicator">1</span>}
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

        {/* Playlist */}
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
              {repeatMode === 'one' && (
                <span className="repeat-one-indicator-header">
                  <i className="fa-solid fa-repeat-1"></i>
                </span>
              )}
              {repeatMode === 'all' && (
                <span className="repeat-all-indicator-header">
                  <i className="fa-solid fa-repeat"></i>
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
            {currentPlaylist.map((song, idx) => {
              const inQueue = isSongInQueue(song._id);
              const isAnimating = animatingSong === song._id;
              
              return (
                <div
                  key={song._id}
                  onClick={() => {
                    navigate('/player', {
                      state: {
                        songs: currentPlaylist,
                        startIndex: idx
                      },
                      replace: true
                    });
                  }}
                  className={`ragafy-player__song-item ${
                    idx === currentIndex ? "active" : ""
                  }`}
                >
                  {photos && photos[song._id] && (
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
                  
                  {/* Add play indicator for current song */}
                  {idx === currentIndex && (
                    <div className="ragafy-player__song-item-playing">
                      <i className="fa-solid fa-volume-high"></i>
                    </div>
                  )}
                  
                  <button 
                    className={`ragafy-player__song-item-add ${inQueue ? 'added' : ''} ${isAnimating ? 'animating' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToQueue(song);
                    }}
                    title={inQueue ? "Added to queue" : "Add to queue"}
                  >
                    {inQueue ? (
                      <i className="fa-regular fa-square-check"></i> // Square check icon when added
                    ) : (
                      <i className="fa-regular fa-square-plus"></i> // Square plus icon when not added
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}