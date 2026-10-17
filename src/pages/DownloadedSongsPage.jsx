import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import {
  isDownloaded,
  downloadSong,
  removeDownload,
} from "../services/downloadService";
import "../assets/style/DownloadedSongsPage.css";

const ORDER_STORAGE_KEY = "ragafy_downloads_order";

function readStoredOrder() {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredOrder(order) {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Ignore storage errors
  }
}

export default function DownloadedSongsPage() {
  const navigate = useNavigate();
  const { songs, photos } = useData();
  const { playPlaylist, currentSong, isPlaying } = useGlobalPlayer();

  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [removingIds, setRemovingIds] = useState(new Set());
  const [removingAll, setRemovingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [order, setOrder] = useState(readStoredOrder);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Scan catalog for downloaded songs
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
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
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [songs]);

  // Reconcile order with downloadedIds
  useEffect(() => {
    const downloadedArray = songs
      .filter((s) => downloadedIds.has(s._id))
      .map((s) => s._id);

    setOrder((previousOrder) => {
      const keptInPrevious = previousOrder.filter((id) =>
        downloadedIds.has(id)
      );
      const missing = downloadedArray.filter(
        (id) => !keptInPrevious.includes(id)
      );
      const next = [...keptInPrevious, ...missing];

      if (next.length !== previousOrder.length) {
        writeStoredOrder(next);
      } else {
        for (let i = 0; i < next.length; i++) {
          if (next[i] !== previousOrder[i]) {
            writeStoredOrder(next);
            break;
          }
        }
      }
      return next;
    });
  }, [downloadedIds, songs]);

  const downloadedSongs = useMemo(() => {
    const byId = new Map(songs.map((s) => [s._id, s]));
    return order.map((id) => byId.get(id)).filter(Boolean);
  }, [songs, order]);

  const filteredDownloads = useMemo(() => {
    if (!searchTerm.trim()) return downloadedSongs;
    const q = searchTerm.toLowerCase();
    return downloadedSongs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        (s.artist?.name || s.singers?.[0]?.name || "")
          .toLowerCase()
          .includes(q)
    );
  }, [downloadedSongs, searchTerm]);

  const handlePlay = (index) => {
    playPlaylist(downloadedSongs, index);
    navigate("/player", {
      state: { songs: downloadedSongs, startIndex: index },
    });
  };

  const handlePlayAll = () => {
    if (!downloadedSongs.length) return;
    playPlaylist(downloadedSongs, 0);
    navigate("/player", {
      state: { songs: downloadedSongs, startIndex: 0 },
    });
  };

  const handleShufflePlay = () => {
    if (!downloadedSongs.length) return;
    const shuffled = [...downloadedSongs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playPlaylist(shuffled, 0);
    navigate("/player", {
      state: { songs: shuffled, startIndex: 0 },
    });
  };

  const handleDownload = async (e, song) => {
    e.stopPropagation();
    if (downloadedIds.has(song._id) || downloadingIds.has(song._id)) return;

    setDownloadingIds((prev) => new Set(prev).add(song._id));
    try {
      await downloadSong(song);
      setDownloadedIds((prev) => new Set(prev).add(song._id));
      showNotification("✓ Downloaded", "#4CAF50");
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

  const handleRemove = async (e, song) => {
    e.stopPropagation();
    if (removingIds.has(song._id) || removingAll) return;

    setRemovingIds((prev) => new Set(prev).add(song._id));
    try {
      await removeDownload(song._id);
      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.delete(song._id);
        return next;
      });
      showNotification("🗑️ Removed download", "#f44336");
    } catch (err) {
      console.error("Remove failed:", err);
      showNotification("✕ Remove failed", "#f44336");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(song._id);
        return next;
      });
    }
  };

  const handleRemoveAll = async () => {
    if (removingAll || downloadedSongs.length === 0) return;

    const confirmed = window.confirm(
      `Remove all ${downloadedSongs.length} downloaded song${
        downloadedSongs.length === 1 ? "" : "s"
      }? This cannot be undone.`
    );
    if (!confirmed) return;

    setRemovingAll(true);

    const targetIds = downloadedSongs.map((s) => s._id);
    setRemovingIds(new Set(targetIds));

    let removed = 0;
    let failed = 0;

    for (const id of targetIds) {
      try {
        await removeDownload(id);
        removed += 1;

        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        setDownloadedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        console.error("Remove failed:", id, err);
        failed += 1;

        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }

    setRemovingAll(false);

    if (failed === 0) {
      showNotification(
        `🗑️ Removed ${removed} download${removed === 1 ? "" : "s"}`,
        "#f44336"
      );
    } else if (removed === 0) {
      showNotification("✕ Could not remove downloads", "#f44336");
    } else {
      showNotification(`Removed ${removed}, ${failed} failed`, "#FF6B00");
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (index === draggedIndex) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      setOrder((previousOrder) => {
        const next = [...previousOrder];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(dragOverIndex, 0, moved);
        writeStoredOrder(next);
        return next;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const showNotification = (message, color) => {
    const el = document.createElement("div");
    el.className = "ds__notification";
    el.textContent = message;
    el.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  };

  const isSongPlaying = (song) =>
    currentSong?._id === song._id && isPlaying;

  const dragEnabled = !searchTerm.trim() && !removingAll;

  return (
    <>
      <div className="ds__back" onClick={() => navigate(-1)}>
        <div className="ds__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="ds__back-text">Back</span>
      </div>

      <div className="ds">
        <div className="ds__header">
          <div className="ds__header-left">
            <h1 className="ds__title">Downloaded</h1>
            {downloadedSongs.length > 0 && (
              <span className="ds__badge">{downloadedSongs.length}</span>
            )}
          </div>
        </div>

        {downloadedSongs.length > 0 && (
          <div className="ds__search">
            <i className="fa-solid fa-magnifying-glass ds__search-icon"></i>
            <input
              type="text"
              placeholder="Search downloads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ds__search-input"
              disabled={removingAll}
            />
            {searchTerm && (
              <i
                className="fa-solid fa-xmark ds__search-clear"
                onClick={() => setSearchTerm("")}
              ></i>
            )}
          </div>
        )}

        {loading ? (
          <div className="ds__loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Scanning downloads...</p>
          </div>
        ) : downloadedSongs.length === 0 ? (
          <div className="ds__empty">
            <div className="ds__empty-art">
              <i className="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <h2 className="ds__empty-title">No downloads yet</h2>
            <p className="ds__empty-text">
              Tap the download button on any song to save it for offline
              playback.
            </p>
            <button
              className="ds__btn ds__btn--primary"
              onClick={() => navigate("/")}
            >
              <i className="fa-solid fa-compass"></i> Browse Songs
            </button>
          </div>
        ) : (
          <>
            {/* ✅ 3-button action row: Play All / Shuffle / Remove All */}
            <div className="ds__actions">
              <button
                className="ds__action ds__action--play"
                onClick={handlePlayAll}
                disabled={removingAll}
              >
                <i className="fa-solid fa-play"></i> <span>Play All</span>
              </button>
              <button
                className="ds__action ds__action--shuffle"
                onClick={handleShufflePlay}
                disabled={removingAll}
              >
                <i className="fa-solid fa-shuffle"></i> <span>Shuffle</span>
              </button>
              <button
                className="ds__action ds__action--remove"
                onClick={handleRemoveAll}
                disabled={removingAll}
                title="Remove all downloads"
              >
                {removingAll ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>{" "}
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-regular fa-trash-can"></i>{" "}
                    <span>Remove All</span>
                  </>
                )}
              </button>
            </div>

            {searchTerm && (
              <div className="ds__search-info">
                Showing {filteredDownloads.length} of{" "}
                {downloadedSongs.length} downloads
              </div>
            )}

            <div className="ds__list">
              {filteredDownloads.length === 0 ? (
                <div className="ds__list-empty">
                  <i className="fa-solid fa-search"></i>
                  <p>No downloads match "{searchTerm}"</p>
                </div>
              ) : (
                filteredDownloads.map((song, filteredIndex) => {
                  const realIndex = dragEnabled
                    ? filteredIndex
                    : downloadedSongs.findIndex((s) => s._id === song._id);
                  const playing = isSongPlaying(song);
                  const isRemoving = removingIds.has(song._id);
                  const isDragging = draggedIndex === realIndex;
                  const isDragOver = dragOverIndex === realIndex;

                  return (
                    <div
                      key={song._id}
                      className={`ds__item ${playing ? "ds__item--playing" : ""} ${isDragging ? "ds__item--dragging" : ""} ${isDragOver ? "ds__item--drag-over" : ""}`}
                      onClick={() => !removingAll && handlePlay(realIndex)}
                      draggable={dragEnabled}
                      onDragStart={() =>
                        dragEnabled && handleDragStart(realIndex)
                      }
                      onDragOver={(e) =>
                        dragEnabled && handleDragOver(e, realIndex)
                      }
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      {photos[song._id] ? (
                        <img
                          src={photos[song._id]}
                          alt={song.title}
                          className="ds__item-img"
                        />
                      ) : (
                        <div className="ds__item-placeholder">
                          <i className="fa-solid fa-music"></i>
                        </div>
                      )}

                      {playing && (
                        <div className="ds__playing-bars">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )}

                      <div className="ds__item-details">
                        <span className="ds__item-title">{song.title}</span>
                        <span className="ds__item-artist">
                          {song.artist?.name ||
                            song.singers?.[0]?.name ||
                            "Unknown Artist"}
                        </span>
                      </div>

                      <div
                        className="ds__item-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="ds__download-btn ds__download-btn--remove"
                          onClick={(e) => handleRemove(e, song)}
                          disabled={isRemoving || removingAll}
                          title="Remove download"
                        >
                          {isRemoving ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa-regular fa-trash-can"></i>
                          )}
                        </button>

                        {dragEnabled && (
                          <span
                            className="ds__item-drag"
                            title="Drag to reorder"
                          >
                            <i className="fa-solid fa-grip-lines"></i>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}