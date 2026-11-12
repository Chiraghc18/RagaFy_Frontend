import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import { isDownloaded, downloadSong } from "../../services/downloadService";
import "../../assets/style/UserPage/AllSongs.css";
import { useNavigate } from "react-router-dom";

export default function AllSongs() {
  const { songs, photos, loading, error } = useData();
  const {
    playPlaylist,
    currentSong,
    currentPlaylist,
    addToPlaylist,
  } = useGlobalPlayer();
  const navigate = useNavigate();

  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  /* ---- Load which songs are already downloaded ---- */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        songs.map(async (song) => ({
          id: song._id,
          cached: await isDownloaded(song._id),
        }))
      );
      if (cancelled) return;
      setDownloadedIds(
        new Set(entries.filter((e) => e.cached).map((e) => e.id))
      );
    };

    if (songs.length) load();
    return () => {
      cancelled = true;
    };
  }, [songs]);

  const handleSongClick = (song) => {
    const filteredSameCategory = songs.filter(
      (s) =>
        s.genre?._id === song.genre?._id &&
        s.language?._id === song.language?._id
    );
    const startIndex = filteredSameCategory.findIndex((s) => s._id === song._id);
    navigate("/player", { state: { songs: filteredSameCategory, startIndex } });
  };

  /* ---- Add single song to queue ---- */
  const handleAddToQueue = (e, song) => {
    e.stopPropagation();

    const alreadyInQueue = currentPlaylist.some((s) => s._id === song._id);
    if (alreadyInQueue) {
      showNotification(`Already in queue: ${song.title}`, "#0066FF");
      return;
    }

    addToPlaylist([song]);
    showNotification(`＋ Added to queue: ${song.title}`, "#4CAF50");
  };

  /* ---- Download single song ---- */
  const handleDownload = async (e, song) => {
    e.stopPropagation();
    if (downloadedIds.has(song._id) || downloadingIds.has(song._id)) return;

    setDownloadingIds((prev) => new Set(prev).add(song._id));

    try {
      await downloadSong(song);
      setDownloadedIds((prev) => new Set(prev).add(song._id));
      showNotification(`✓ Downloaded: ${song.title}`, "#4CAF50");
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

  /* ---- Toast ---- */
  const showNotification = (message, color) => {
    const notification = document.createElement("div");
    notification.className = "all-songs__notification";
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const isSongQueued = (song) =>
    currentPlaylist.some((s) => s._id === song._id);

  const isSongPlaying = (song) => currentSong?._id === song._id;

  if (loading)
    return (
      <div className="all-songs-page">
        <div className="all-songs__loading">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="all-songs__skeleton-card">
              <div className="all-songs__skeleton-content">
                <div className="all-songs__skeleton-image"></div>
                <div className="all-songs__skeleton-text">
                  <div className="all-songs__skeleton-line"></div>
                  <div className="all-songs__skeleton-line all-songs__skeleton-line--short"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="all-songs-page">
        <div className="all-songs__error">
          <div className="all-songs__error-icon">⚠️</div>
          <h3 className="all-songs__error-title">Something went wrong</h3>
          <p className="all-songs__error-message">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="all-songs-page">
      {/* Songs Section - Only the full grid */}
      <div className="all-songs__songs">
        <h2 className="all-songs__section-title">All Songs</h2>
        <div className="all-songs__grid">
          {songs.length > 0 ? (
            songs.map((song) => {
              const queued = isSongQueued(song);
              const inDownloads = downloadedIds.has(song._id);
              const isDownloading = downloadingIds.has(song._id);
              const playing = isSongPlaying(song);

              return (
                <div
                  key={song._id}
                  className={`all-songs__card ${
                    playing ? "all-songs__card--playing" : ""
                  }`}
                  onClick={() => handleSongClick(song)}
                >
                  <div className="all-songs__card-content">
                    {photos[song._id] ? (
                      <img
                        src={photos[song._id]}
                        alt={song.title}
                        className="all-songs__image"
                      />
                    ) : (
                      <div className="all-songs__image all-songs__image--placeholder">
                        🎵
                      </div>
                    )}
                    <div className="all-songs__info">
                      <div className="all-songs__title">{song.title}</div>
                      <div className="all-songs__meta">
                        {song.artist?.name ||
                          song.singers?.map((s) => s.name).join(", ") ||
                          " "}
                      </div>
                    </div>
                    <div className="all-songs__play-icon">▶</div>
                  </div>

                  {/* Card actions: Add to queue + Download */}
                  <div className="all-songs__card-actions">
                    {/* Add to queue */}
                    {!queued && (
                      <button
                        className="all-songs__add-to-queue"
                        onClick={(e) => handleAddToQueue(e, song)}
                        title="Add to queue"
                        aria-label={`Add ${song.title} to queue`}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    )}

                    {/* Download */}
                    {!inDownloads && (
                      <button
                        className="all-songs__add-to-queue all-songs__download"
                        onClick={(e) => handleDownload(e, song)}
                        disabled={isDownloading}
                        title="Download for offline"
                        aria-label={`Download ${song.title}`}
                      >
                        {isDownloading ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-solid fa-cloud-arrow-down"></i>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="all-songs__empty">
              <div className="all-songs__empty-icon">🎵</div>
              <p className="all-songs__empty-text">No songs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}