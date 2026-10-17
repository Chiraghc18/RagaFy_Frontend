import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import {
  isDownloaded,
  downloadSong,
} from "../services/downloadService";
import "../assets/style/SongPlayerPage.css";

export default function SongPlayerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { songs = [], startIndex = 0 } = location.state || {};

  const { photos } = useData();

  const {
    currentPlaylist,
    currentIndex,
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    setVolume,
    shuffleMode,
    repeatMode,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    playPlaylist,
    playSong,
    formatTime,
    removeFromPlaylist,
  } = useGlobalPlayer();

  const [initialized, setInitialized] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  const audioRef = useRef(null);
  const activeSongRef = useRef(null);

  // Initialize player
  useEffect(() => {
    if (songs && songs.length > 0 && !initialized) {
      playPlaylist(songs, startIndex);
      setInitialized(true);
    }
  }, [songs, startIndex, playPlaylist, initialized]);

  // Set volume on audio element
  useEffect(() => {
    const audio = document.querySelector("audio");
    if (audio) {
      audio.volume = volume;
      audioRef.current = audio;
    }
  }, [volume]);

  // Scan downloads for current playlist
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        currentPlaylist.map(async (song) => ({
          id: song._id,
          cached: await isDownloaded(song._id),
        }))
      );
      if (cancelled) return;
      setDownloadedIds(
        new Set(entries.filter((e) => e.cached).map((e) => e.id))
      );
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentPlaylist]);

  // Auto-scroll to active song
  useEffect(() => {
    if (!currentSong?._id) return;

    const timeout = setTimeout(() => {
      if (activeSongRef.current) {
        activeSongRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [currentSong?._id, currentIndex]);

  const showNotification = (message, color) => {
    const notification = document.createElement("div");
    notification.className = "ragafy-player__notification";
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // ── Download one song (per-row button) ──
  const handleDownloadOne = async (e, song) => {
    e.stopPropagation();
    if (downloadedIds.has(song._id) || downloadingIds.has(song._id)) return;

    setDownloadingIds((prev) => new Set(prev).add(song._id));

    try {
      await downloadSong(song);
      // ✅ Add to downloaded set → button disappears
      setDownloadedIds((prev) => new Set(prev).add(song._id));
    } catch (err) {
      console.error("Download failed:", err);
      showNotification("✕ Download failed", "#f44336");
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(song._id);
        return next;
      });
    }
  };

  // ── Download all songs in the playlist ──
  const handleDownloadAll = async () => {
    if (downloadingAll) return;

    const toDownload = currentPlaylist.filter(
      (song) => !downloadedIds.has(song._id)
    );

    if (toDownload.length === 0) {
      showNotification("All songs already downloaded", "#0066FF");
      return;
    }

    setDownloadingAll(true);

    let success = 0;
    let failed = 0;

    for (const song of toDownload) {
      try {
        await downloadSong(song);
        setDownloadedIds((prev) => new Set(prev).add(song._id));
        success += 1;
      } catch (err) {
        console.error("Download failed:", song.title, err);
        failed += 1;
      }
    }

    setDownloadingAll(false);

    if (failed === 0) {
      showNotification(
        `✓ Downloaded ${success} song${success === 1 ? "" : "s"}`,
        "#4CAF50"
      );
    } else if (success === 0) {
      showNotification("✕ Download failed", "#f44336");
    } else {
      showNotification(
        `Downloaded ${success}, ${failed} failed`,
        "#FF6B00"
      );
    }
  };

  const handleSongPlayerVolume = (event) => {
    const newVolume = Math.max(0, Math.min(1, Number(event.target.value)));
    setVolume(newVolume);
  };

  const handleSongClick = (song, index) => {
    playSong(song, currentPlaylist, index);
  };

  if (!currentPlaylist.length || !currentSong) {
    return (
      <div className="ragafy-player">
        <div className="ragafy-player__back" onClick={() => navigate(-1)}>
          <div className="ragafy-player__back-icon">
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <span className="ragafy-player__back-text">Back</span>
        </div>
        <div className="ragafy-player__empty">
          <i className="fa-solid fa-music"></i>
          <h2>No song playing</h2>
          <p>Select a song to start playing</p>
          <button
            onClick={() => navigate("/")}
            className="ragafy-player__browse-btn"
          >
            Browse Songs
          </button>
        </div>
      </div>
    );
  }

  const allDownloaded =
    currentPlaylist.length > 0 &&
    currentPlaylist.every((s) => downloadedIds.has(s._id));

  const downloadedInPlaylist = currentPlaylist.filter((s) =>
    downloadedIds.has(s._id)
  ).length;

  return (
    <>
      <div className="ragafy-player__back" onClick={() => navigate(-1)}>
        <div className="ragafy-player__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="ragafy-player__back-text">Back</span>
      </div>

      <div className="ragafy-player">
        <div className="ragafy-player__main">
          <div className="ragafy-player__header">
            <div className="ragafy-player__art-container">
              {photos[currentSong._id] ? (
                <img
                  src={photos[currentSong._id]}
                  alt={currentSong.title}
                  className={`ragafy-player__photo ${isPlaying ? "playing" : "paused"}`}
                />
              ) : (
                <div
                  className={`ragafy-player__photo-placeholder ${isPlaying ? "playing" : ""}`}
                >
                  <i className="fa-solid fa-music"></i>
                </div>
              )}

              {isPlaying && (
                <div className="ragafy-player__art-overlay">
                  <div className="playing-bars">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <h2 className="ragafy-player__title">{currentSong.title}</h2>

            <div className="ragafy-player__artist-info">
              {currentSong.artist?.name && (
                <span className="ragafy-player__artist">
                  {currentSong.artist.name}
                </span>
              )}
              {currentSong.singers?.length > 0 && (
                <span className="ragafy-player__singers">
                  {currentSong.singers.map((s) => s.name).join(", ")}
                </span>
              )}
            </div>

            <div className="ragafy-player__mode-indicators">
              {shuffleMode && (
                <span className="mode-indicator shuffle">
                  <i className="fa-solid fa-shuffle"></i> Shuffle
                </span>
              )}
              {repeatMode === "one" && (
                <span className="mode-indicator repeat-one">
                  <i className="fa-solid fa-repeat"></i> Repeat One
                </span>
              )}
              {repeatMode === "all" && (
                <span className="mode-indicator repeat-all">
                  <i className="fa-solid fa-repeat"></i> Repeat All
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
            <div className="ragafy-player__time-display">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <input
              type="range"
              className="ragafy-player__progress"
              value={progress}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              max={duration || 0}
              step="0.1"
            />

            <div className="ragafy-player__controls">
              <button
                className={`ragafy-player__control-btn shuffle ${shuffleMode ? "active" : ""}`}
                onClick={toggleShuffle}
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
                <i
                  className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}
                ></i>
              </button>
              <button
                className="ragafy-player__control-btn next"
                onClick={handleNext}
              >
                <i className="fa-solid fa-forward-step"></i>
              </button>
              <button
                className={`ragafy-player__control-btn repeat ${repeatMode !== "none" ? "active" : ""}`}
                onClick={toggleRepeat}
              >
                <i className="fa-solid fa-repeat"></i>
                {repeatMode === "one" && (
                  <span className="repeat-one-indicator">1</span>
                )}
              </button>
            </div>

            <div className="ragafy-player__bottom-controls">
              <button
                className="ragafy-player__downloads-btn"
                onClick={() => navigate("/downloads")}
                title="Downloaded Songs"
              >
                <i className="fa-solid fa-cloud-arrow-down"></i>
                <span className="ragafy-player__queue-count">
                  {downloadedInPlaylist}
                </span>
              </button>

              <div className="song-player__volume-control">
                <i
                  className={`fa-solid ${
                    volume === 0
                      ? "fa-volume-xmark"
                      : volume < 0.5
                        ? "fa-volume-low"
                        : "fa-volume-high"
                  }`}
                />

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleSongPlayerVolume}
                  aria-label="Song player volume"
                />

                <span>{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ragafy-player__song-list">
          <div className="ragafy-player__song-list-header">
            <h3>
              <i className="fa-solid fa-list-ol"></i> Playlist
              {shuffleMode && (
                <span className="shuffle-indicator">
                  <i className="fa-solid fa-shuffle"></i>
                </span>
              )}
              {repeatMode === "one" && (
                <span className="repeat-one-indicator-header">
                  <i className="fa-solid fa-repeat"></i> 1
                </span>
              )}
            </h3>

            <button
              className={`ragafy-player__add-all-btn ${
                allDownloaded ? "ragafy-player__add-all-btn--done" : ""
              }`}
              onClick={handleDownloadAll}
              disabled={downloadingAll || allDownloaded}
              title={
                allDownloaded
                  ? "All songs downloaded"
                  : "Download all songs for offline"
              }
            >
              {downloadingAll ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Downloading...
                </>
              ) : allDownloaded ? (
                <>
                  <i className="fa-solid fa-check"></i> Downloaded
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-down"></i> Download All
                </>
              )}
            </button>
          </div>

          <div className="ragafy-player__song-list-items">
            {currentPlaylist.map((song, idx) => {
              const inDownloads = downloadedIds.has(song._id);
              const isDownloading = downloadingIds.has(song._id);

              return (
                <div
                  key={song._id}
                  ref={idx === currentIndex ? activeSongRef : null}
                  onClick={() => handleSongClick(song, idx)}
                  className={`ragafy-player__song-item ${idx === currentIndex ? "active" : ""}`}
                >
                  {photos && photos[song._id] ? (
                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="ragafy-player__song-item-image"
                    />
                  ) : (
                    <div className="ragafy-player__song-item-image-placeholder">
                      <i className="fa-solid fa-music"></i>
                    </div>
                  )}

                  <div className="ragafy-player__song-item-info">
                    <span className="ragafy-player__song-item-title">
                      {song.title}
                      {idx === currentIndex && (
                        <span className="now-playing-badge">
                          NOW PLAYING
                        </span>
                      )}
                    </span>
                    <span className="ragafy-player__song-item-subtitle">
                      {song.artist?.name || song.singers?.[0]?.name || " "}
                    </span>
                  </div>

                  {idx === currentIndex && isPlaying && (
                    <div className="ragafy-player__song-item-playing">
                      <i className="fa-solid fa-volume-high"></i>
                    </div>
                  )}
                  {idx === currentIndex && !isPlaying && (
                    <div className="ragafy-player__song-item-paused">
                      <i className="fa-solid fa-pause"></i>
                    </div>
                  )}

                  {/* Small download button — disappears once downloaded */}
                  {!inDownloads && (
                    <button
                      className="ragafy-player__song-item-download"
                      onClick={(e) => handleDownloadOne(e, song)}
                      disabled={isDownloading}
                      title="Download for offline"
                    >
                      {isDownloading ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-cloud-arrow-down"></i>
                      )}
                    </button>
                  )}

                  <button
                    className="ragafy-player__song-item-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(song._id);
                      showNotification("🗑️ Removed from playlist", "#f44336");
                    }}
                    title="Remove from playlist"
                  >
                    <i className="fa-solid fa-xmark"></i>
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