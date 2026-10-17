import React, { useState, useEffect, useRef } from "react";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import "../assets/style/GlobalPlayer.css";

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
    increaseVolume,
    decreaseVolume,
    formatTime,
    currentPlaylist,
    currentIndex,
    playSong,
    shuffleMode,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    removeFromPlaylist,
  } = useGlobalPlayer();

  const { photos } = useData();
  const navigate = useNavigate();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const volumeRef = useRef(null);
  const volumePopupRef = useRef(null);
  const playlistRef = useRef(null);
  const playerRef = useRef(null);
  const activeSongRef = useRef(null);
  const playlistItemsRef = useRef(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touchEnd = e.touches[0].clientY;
    const diff = touchStart - touchEnd;
    if (diff < -50 && !isCollapsed) {
      setIsCollapsed(true);
      setTouchStart(null);
    } else if (diff > 50 && isCollapsed) {
      setIsCollapsed(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideVolumeButton =
        volumeRef.current && volumeRef.current.contains(event.target);
      const clickedInsideVolumePopup =
        volumePopupRef.current && volumePopupRef.current.contains(event.target);

      if (!clickedInsideVolumeButton && !clickedInsideVolumePopup) {
        setShowVolumeSlider(false);
      }

      if (playlistRef.current && !playlistRef.current.contains(event.target)) {
        setShowPlaylist(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!showPlaylist) return;

    const timeout = setTimeout(() => {
      const container = playlistItemsRef.current;
      const activeRow = activeSongRef.current;
      if (!container || !activeRow) return;

      const containerHeight = container.clientHeight;
      const rowTop = activeRow.offsetTop;
      const rowHeight = activeRow.offsetHeight;
      const targetScroll = rowTop - containerHeight / 2 + rowHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }, 120);

    return () => clearTimeout(timeout);
  }, [showPlaylist, currentSong?._id, currentIndex]);

  const handleGlobalVolumeChange = (event) => {
    setVolume(Number(event.target.value));
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 1 : 0);
  };

  if (!currentSong) return null;

  return (
    <>
      <div
        className={`global-player ${isCollapsed ? "collapsed" : ""}`}
        ref={playerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="global-player__drag-handle" />

        <div className="global-player__main">
          <div
            className="global-player__info"
            onClick={() => {
              setIsCollapsed(false);
              navigate("/player", {
                state: {
                  songs: currentPlaylist,
                  startIndex: currentPlaylist.findIndex(
                    (s) => s._id === currentSong._id
                  ),
                },
              });
            }}
          >
            {photos && photos[currentSong._id] ? (
              <img
                src={photos[currentSong._id]}
                alt={currentSong.title}
                className="global-player__image"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = "flex";
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
            </div>
          </div>

          <div className="global-player__center">
            <div className="global-player__controls">
              <button
                className={`global-player__control ${shuffleMode ? "active" : ""}`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <i className="fa-solid fa-shuffle"></i>
              </button>

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
                title={isPlaying ? "Pause" : "Play"}
                disabled={!currentPlaylist.length}
              >
                <i
                  className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}
                ></i>
              </button>

              <button
                className="global-player__control"
                onClick={handleNext}
                title="Next"
                disabled={!currentPlaylist.length}
              >
                <i className="fa-solid fa-forward-step"></i>
              </button>

              <button
                className={`global-player__control ${repeatMode === "one" ? "active" : ""}`}
                onClick={toggleRepeat}
                title={
                  repeatMode === "one"
                    ? "Repeat Current Song: ON"
                    : "Repeat Current Song: OFF"
                }
              >
                <i
                  className={`fa-solid ${
                    repeatMode === "one" ? "fa-repeat-1" : "fa-repeat"
                  }`}
                ></i>
              </button>
            </div>

            <div className="global-player__progress-container">
              <span className="global-player__time">
                {formatTime(progress)}
              </span>

              <input
                type="range"
                className="global-player__progress"
                value={progress || 0}
                onInput={(e) => seekTo(parseFloat(e.target.value))}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                max={duration || 0}
                step="0.1"
                disabled={!duration}
              />

              <span className="global-player__time">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="global-player__right">
            <div className="global-player__volume-control" ref={volumeRef}>
              <button
                type="button"
                className={`global-player__volume-btn ${showVolumeSlider ? "active" : ""}`}
                onClick={() => setShowVolumeSlider((previous) => !previous)}
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
                <div
                  className="global-player__volume-popup"
                  ref={volumePopupRef}
                >
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
                    onInput={handleGlobalVolumeChange}
                    onChange={handleGlobalVolumeChange}
                    aria-label="Global volume"
                  />

                  <div className="global-player__volume-actions">
                    <button
                      type="button"
                      className="global-player__volume-step"
                      onClick={decreaseVolume}
                      title="Volume -10"
                      aria-label="Decrease volume by 10"
                    >
                      <i className="fa-solid fa-minus" />
                    </button>

                    <button
                      type="button"
                      className="global-player__volume-step"
                      onClick={increaseVolume}
                      title="Volume +10"
                      aria-label="Increase volume by 10"
                    >
                      <i className="fa-solid fa-plus" />
                    </button>

                    <button
                      type="button"
                      className="global-player__volume-mute"
                      onClick={toggleMute}
                      title={volume === 0 ? "Unmute" : "Mute"}
                      aria-label={volume === 0 ? "Unmute" : "Mute"}
                    >
                      <i
                        className={`fa-solid ${
                          volume === 0 ? "fa-volume-high" : "fa-volume-xmark"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="global-player__downloads-btn"
              onClick={() => navigate("/downloads")}
              title="Downloaded Songs"
            >
              <i className="fa-solid fa-cloud-arrow-down"></i>
            </button>

            {currentPlaylist.length > 1 && (
              <button
                className={`global-player__playlist-toggle ${showPlaylist ? "active" : ""}`}
                onClick={() => setShowPlaylist(!showPlaylist)}
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

            <div
              className="global-player__playlist-items"
              ref={playlistItemsRef}
            >
              {currentPlaylist.map((song, idx) => (
                <div
                  key={song._id}
                  ref={currentSong?._id === song._id ? activeSongRef : null}
                  className={`global-player__playlist-item ${
                    currentSong?._id === song._id ? "active" : ""
                  }`}
                  onClick={() => {
                    playSong(song, currentPlaylist, idx);
                    setShowPlaylist(false);
                  }}
                >
                  {photos && photos[song._id] ? (
                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="global-player__playlist-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
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
                      {song.artist?.name || song.singers?.[0]?.name || ""}
                    </span>
                  </div>

                  {currentSong?._id === song._id && (
                    <i className="fa-solid fa-volume-high playing-indicator"></i>
                  )}

                  <button
                    type="button"
                    className="global-player__playlist-remove"
                    title="Remove from playlist"
                    aria-label={`Remove ${song.title} from playlist`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(song._id);
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="global-player-spacer"></div>
    </>
  );
}