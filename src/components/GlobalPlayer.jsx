// components/GlobalPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useGlobalPlayer } from '../context/GlobalPlayerContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import '../assets/style/GlobalPlayer.css';

export default function GlobalPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume,
    formatTime,
    currentPlaylist,
    currentIndex
  } = useGlobalPlayer();

  const { photos, queue } = useData();
  const navigate = useNavigate();
  
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  
  const volumeRef = useRef(null);
  const playlistRef = useRef(null);
  const playerRef = useRef(null);

  // Handle touch events for drag to collapse/expand on mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.touches[0].clientY;
    const diff = touchStart - touchEnd;
    
    // If swiping down more than 50px, collapse
    if (diff < -50 && !isCollapsed) {
      setIsCollapsed(true);
      setTouchStart(null);
    }
    // If swiping up more than 50px, expand
    else if (diff > 50 && isCollapsed) {
      setIsCollapsed(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
      if (playlistRef.current && !playlistRef.current.contains(event.target)) {
        setShowPlaylist(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if no song is playing
  if (!currentSong) return null;

  return (
    <>
      <div 
        className={`global-player ${isCollapsed ? 'collapsed' : ''}`}
        ref={playerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle for mobile */}
        <div className="global-player__drag-handle" />

        <div className="global-player__main">
          {/* Left Side - Song Info */}
          <div 
            className="global-player__info"
            onClick={() => {
              setIsCollapsed(false);
              navigate('/player', { 
                state: { 
                  songs: currentPlaylist,
                  startIndex: currentPlaylist.findIndex(s => s._id === currentSong._id)
                } 
              });
            }}
          >
            {photos && photos[currentSong._id] ? (
              <img
                src={photos[currentSong._id]}
                alt={currentSong.title}
                className="global-player__image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            {(!photos || !photos[currentSong._id]) && (
              <div className="global-player__image-placeholder">
                <i className="fa-solid fa-music"></i>
              </div>
            )}
            
            <div className="global-player__details">
              <span className="global-player__title">{currentSong.title}</span>
              <span className="global-player__artist">
                {currentSong.artist?.name || currentSong.singers?.[0]?.name || 'Unknown Artist'}
              </span>
            </div>
          </div>

          {/* Center - Controls and Progress stacked */}
          <div className="global-player__center">
            {/* Control Buttons */}
            <div className="global-player__controls">
              <button
                className="global-player__control"
                onClick={handlePrevious}
                title="Previous"
                disabled={!currentPlaylist.length}
              >
                <i className="fa-solid fa-backward-step"></i>
              </button>

              <button
                className="global-player__control play-pause"
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
                disabled={!currentPlaylist.length}
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>

              <button
                className="global-player__control"
                onClick={handleNext}
                title="Next"
                disabled={!currentPlaylist.length}
              >
                <i className="fa-solid fa-forward-step"></i>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="global-player__progress-container">
              <span className="global-player__time">{formatTime(progress)}</span>
              <input
                type="range"
                className="global-player__progress"
                value={progress || 0}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                max={duration || 0}
                step="0.1"
                disabled={!duration}
              />
              <span className="global-player__time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Side - Queue, Playlist Toggle, Volume */}
          <div className="global-player__right">
            {/* Queue Button */}
            <button
              className="global-player__queue-btn"
              onClick={() => navigate('/queue')}
              title="View Queue"
            >
              <i className="fa-solid fa-list"></i>
              {queue && queue.length > 0 && (
                <span className="global-player__queue-count">{queue.length}</span>
              )}
            </button>

            {/* Playlist Toggle */}
            {currentPlaylist.length > 1 && (
              <button
                className={`global-player__playlist-toggle ${showPlaylist ? 'active' : ''}`}
                onClick={() => setShowPlaylist(!showPlaylist)}
                title="Show playlist"
              >
                <i className="fa-solid fa-music"></i>
                <span className="global-player__playlist-count">
                  {currentPlaylist.length}
                </span>
              </button>
            )}

            {/* Volume Control */}
            
          </div>
        </div>

        {/* Mini Playlist Panel */}
        {showPlaylist && currentPlaylist.length > 0 && (
          <div className="global-player__playlist-panel" ref={playlistRef}>
            <div className="global-player__playlist-header">
              <h4>
                <i className="fa-solid fa-music"></i>
                Now Playing
                <span className="global-player__playlist-badge">
                  {currentPlaylist.length} songs
                </span>
              </h4>
              <button 
                className="global-player__playlist-close"
                onClick={() => setShowPlaylist(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="global-player__playlist-items">
              {currentPlaylist.map((song, idx) => (
                <div
                  key={song._id}
                  className={`global-player__playlist-item ${
                    currentSong?._id === song._id ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate('/player', {
                      state: {
                        songs: currentPlaylist,
                        startIndex: idx
                      }
                    });
                    setShowPlaylist(false);
                  }}
                >
                  {photos && photos[song._id] ? (
                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="global-player__playlist-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  {(!photos || !photos[song._id]) && (
                    <div className="global-player__playlist-image-placeholder">
                      <i className="fa-solid fa-music"></i>
                    </div>
                  )}
                  
                  <div className="global-player__playlist-info">
                    <span className="global-player__playlist-title">
                      {song.title}
                    </span>
                    <span className="global-player__playlist-artist">
                      {song.artist?.name || song.singers?.[0]?.name || 'Unknown Artist'}
                    </span>
                  </div>
                  
                  {currentSong?._id === song._id && (
                    <i className="fa-solid fa-volume-high playing-indicator"></i>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spacer for fixed player */}
      <div className="global-player-spacer"></div>
    </>
  );
}