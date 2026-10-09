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
    currentIndex,

    playSong,

    // ADVANCED FEATURES
    shuffleMode,
    repeatMode,
    toggleShuffle,
    toggleRepeat

  } = useGlobalPlayer();

  const { photos, queue } = useData();

  const navigate = useNavigate();

  // =========================
  // LOCAL STATES
  // =========================

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const [showPlaylist, setShowPlaylist] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [touchStart, setTouchStart] = useState(null);

  // =========================
  // REFS
  // =========================

  const volumeRef = useRef(null);

  const playlistRef = useRef(null);

  const playerRef = useRef(null);




  // =========================
  // TOUCH EVENTS
  // =========================

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {

    if (!touchStart) return;

    const touchEnd = e.touches[0].clientY;

    const diff = touchStart - touchEnd;

    // Swipe down → collapse
    if (diff < -50 && !isCollapsed) {

      setIsCollapsed(true);

      setTouchStart(null);
    }

    // Swipe up → expand
    else if (diff > 50 && isCollapsed) {

      setIsCollapsed(false);

      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // =========================
  // CLICK OUTSIDE
  // =========================

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        volumeRef.current &&
        !volumeRef.current.contains(event.target)
      ) {
        setShowVolumeSlider(false);
      }

      if (
        playlistRef.current &&
        !playlistRef.current.contains(event.target)
      ) {
        setShowPlaylist(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };

  }, []);

  const handleGlobalVolumeChange = (event) => {
  setVolume(Number(event.target.value));
};

const toggleMute = () => {
  setVolume(volume === 0 ? 1 : 0);
};

  // =========================
  // NO SONG
  // =========================

  if (!currentSong) return null;

  // =========================
  // JSX
  // =========================

  return (
    <>
      <div
        className={`global-player ${
          isCollapsed ? 'collapsed' : ''
        }`}
        ref={playerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        {/* DRAG HANDLE */}
        <div className="global-player__drag-handle" />

        <div className="global-player__main">

          {/* ========================= */}
          {/* LEFT SIDE */}
          {/* ========================= */}

          <div
            className="global-player__info"
            onClick={() => {

              setIsCollapsed(false);

              navigate('/player', {
                state: {
                  songs: currentPlaylist,
                  startIndex:
                    currentPlaylist.findIndex(
                      (s) =>
                        s._id === currentSong._id
                    )
                }
              });
            }}
          >

            {/* IMAGE */}
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

            {/* IMAGE PLACEHOLDER */}
            {(!photos ||
              !photos[currentSong._id]) && (

              <div className="global-player__image-placeholder">
                <i className="fa-solid fa-music"></i>
              </div>
            )}

            {/* DETAILS */}
            <div className="global-player__details">

              <span className="global-player__title">
                {currentSong.title}
              </span>

            </div>
          </div>

          {/* ========================= */}
          {/* CENTER */}
          {/* ========================= */}

          <div className="global-player__center">

            {/* CONTROLS */}
            <div className="global-player__controls">

              {/* SHUFFLE */}
              <button
                className={`global-player__control ${
                  shuffleMode ? 'active' : ''
                }`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <i className="fa-solid fa-shuffle"></i>
              </button>

              {/* PREVIOUS */}
              <button
                className="global-player__control"
                onClick={handlePrevious}
                title="Previous"
                disabled={!currentPlaylist.length}
              >
                <i className="fa-solid fa-backward-step"></i>
              </button>

              {/* PLAY / PAUSE */}
              <button
                className="global-player__control play-pause"
                onClick={togglePlayPause}
                title={
                  isPlaying
                    ? 'Pause'
                    : 'Play'
                }
                disabled={!currentPlaylist.length}
              >

                <i
                  className={`fa-solid ${
                    isPlaying
                      ? 'fa-pause'
                      : 'fa-play'
                  }`}
                ></i>

              </button>

              {/* NEXT */}
              <button
                className="global-player__control"
                onClick={handleNext}
                title="Next"
                disabled={!currentPlaylist.length}
              >
                <i className="fa-solid fa-forward-step"></i>
              </button>

             {/* REPEAT CURRENT SONG ONLY */}
              <button
                className={`global-player__control ${
                  repeatMode === 'one'
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  if (repeatMode === 'one') {
                    setRepeatMode('all');
                  } else {
                    setRepeatMode('one');
                  }
                }}
                title={
                  repeatMode === 'one'
                    ? 'Repeat Current Song: ON'
                    : 'Repeat Current Song: OFF'
                }
              >

                <i
                  className={`fa-solid ${
                    repeatMode === 'one'
                      ? 'fa-repeat-1'
                      : 'fa-repeat'
                  }`}
                ></i>

              </button>

            </div>

            {/* PROGRESS */}
            <div className="global-player__progress-container">

              <span className="global-player__time">
                {formatTime(progress)}
              </span>

              <input
                type="range"
                className="global-player__progress"
                value={progress || 0}
                onChange={(e) =>
                  seekTo(
                    parseFloat(
                      e.target.value
                    )
                  )
                }
                max={duration || 0}
                step="0.1"
                disabled={!duration}
              />

              <span className="global-player__time">
                {formatTime(duration)}
              </span>

            </div>
          </div>

          {/* ========================= */}
          {/* RIGHT SIDE */}
          {/* ========================= */}

          <div className="global-player__right">

            {/* Volume Control */}
<div
  className="global-player__volume-control "
  ref={volumeRef}
>
  <button
    type="button"
    className={`global-player__volume-btn ${
      showVolumeSlider ? "active" : ""
    }`}
    onClick={() =>
      setShowVolumeSlider((previous) => !previous)
    }
    title="Volume"
    aria-label="Toggle volume control"
    aria-expanded={showVolumeSlider}
  >
    <i
      className={`fa-solid ${
        volume === 0
          ? "fa-volume-xmark"
          : volume < 0.5
          ? "fa-volume-low"
          : "fa-volume-high"
      }`}
    />
  </button>

  {showVolumeSlider && (
    <div className="global-player__volume-popup">
      <span className="global-player__volume-value">
        {Math.round(volume * 100)}%
      </span>

      <input
        type="range"
        className="global-player__volume-slider"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleGlobalVolumeChange}
        aria-label="Global volume"
      />

      <button
        type="button"
        className="global-player__volume-mute"
        onClick={toggleMute}
        title={volume === 0 ? "Unmute" : "Mute"}
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        <i
          className={`fa-solid ${
            volume === 0
              ? "fa-volume-high"
              : "fa-volume-xmark"
          }`}
        />
      </button>
    </div>
  )}
</div>

            {/* QUEUE */}
            <button
              className="global-player__queue-btn"
              onClick={() => navigate('/queue')}
              title="View Queue"
            >

              <i className="fa-solid fa-list"></i>

              {queue && queue.length > 0 && (

                <span className="global-player__queue-count">
                  {queue.length}
                </span>
              )}

            </button>

            {/* PLAYLIST TOGGLE */}
            {currentPlaylist.length > 1 && (

              <button
                className={`global-player__playlist-toggle ${
                  showPlaylist ? 'active' : ''
                }`}
                onClick={() =>
                  setShowPlaylist(
                    !showPlaylist
                  )
                }
                title="Show Playlist"
              >

                <i className="fa-solid fa-music"></i>

                <span className="global-player__playlist-count">
                  {currentPlaylist.length}
                </span>

              </button>
            )}
            

          </div>
        </div>

        {/* ========================= */}
        {/* PLAYLIST PANEL */}
        {/* ========================= */}

        {showPlaylist &&
          currentPlaylist.length > 0 && (

          <div
            className="global-player__playlist-panel"
            ref={playlistRef}
          >

            {/* HEADER */}
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
                onClick={() =>
                  setShowPlaylist(false)
                }
              >

                <i className="fa-solid fa-xmark"></i>

              </button>

            </div>

            {/* SONG LIST */}
            <div className="global-player__playlist-items">

              {currentPlaylist.map(
                (song, idx) => (

                <div
                  key={song._id}
                  className={`global-player__playlist-item ${
                    currentSong?._id ===
                    song._id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {

                    // PLAY SONG DIRECTLY
                    playSong(
                      song,
                      currentPlaylist,
                      idx
                    );

                    setShowPlaylist(false);
                  }}
                >

                  {/* IMAGE */}
                  {photos &&
                  photos[song._id] ? (

                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="global-player__playlist-image"
                      onError={(e) => {

                        e.target.style.display = 'none';

                        if (
                          e.target.nextSibling
                        ) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />

                  ) : null}

                  {/* PLACEHOLDER */}
                  {(!photos ||
                    !photos[song._id]) && (

                    <div className="global-player__playlist-image-placeholder">

                      <i className="fa-solid fa-music"></i>

                    </div>
                  )}

                  {/* INFO */}
                  <div className="global-player__playlist-info">

                    <span className="global-player__playlist-title">

                      {song.title}

                    </span>

                    <span className="global-player__playlist-artist">

                      {song.artist?.name ||

                        song.singers?.[0]?.name ||

                        ''}

                    </span>

                  </div>

                  {/* PLAYING INDICATOR */}
                  {currentSong?._id ===
                    song._id && (

                    <i className="fa-solid fa-volume-high playing-indicator"></i>
                  )}

                </div>
              ))}

            </div>
          </div>
        )}
      </div>

      {/* SPACER */}
      <div className="global-player-spacer"></div>
    </>
  );
}