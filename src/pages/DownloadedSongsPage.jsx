// src/pages/DownloadedSongsPage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import {
  getAllDownloads,
  removeDownload,
  updateDownloadMetadata, // 🔥 Use the new healing function
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
  } catch {}
}

export default function DownloadedSongsPage() {
  const navigate = useNavigate();
  const { photos, songs: allSongs } = useData();
  const { playPlaylist, currentSong, isPlaying } = useGlobalPlayer();

  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [removingAll, setRemovingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  const [order, setOrder] = useState(readStoredOrder);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const hasHealedRef = useRef(false);

  // Load directly from IndexedDB
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const records = await getAllDownloads();
        if (cancelled) return;

        const mappedSongs = records.map((r) => ({
          _id: r.songId,
          title: r.title,
          audioUrl: r.audioUrl,
          language: r.language || "Unknown",
          artistName: r.artistName || "Unknown Artist",
          photoUrl: r.photoUrl || null,
        }));

        const orderedSongs = [...mappedSongs].sort((a, b) => {
          const idxA = order.indexOf(a._id);
          const idxB = order.indexOf(b._id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });

        setDownloadedSongs(orderedSongs);
      } catch (err) {
        console.error("Failed to load downloads:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []); 

  // 🔥 HEALING EFFECT: Backfill missing Language, Artist, and Photo
  useEffect(() => {
    if (!allSongs.length || downloadedSongs.length === 0 || hasHealedRef.current) {
      return;
    }

    const healMetadata = async () => {
      let needsStateRefresh = false;
      const updatedDownloads = [...downloadedSongs];

      for (let i = 0; i < updatedDownloads.length; i++) {
        const dl = updatedDownloads[i];
        const catalogSong = allSongs.find((s) => s._id === dl._id);

        if (catalogSong) {
          const updates = {};
          
          // Check Language
          if (dl.language === "Unknown" && catalogSong.language?.name) {
            updates.language = catalogSong.language.name;
          }
          
          // Check Artist
          if (dl.artistName === "Unknown Artist") {
            const realArtist = catalogSong.artist?.name || catalogSong.singers?.[0]?.name;
            if (realArtist) updates.artistName = realArtist;
          }

          // Check Photo
          if (!dl.photoUrl) {
            const realPhoto = catalogSong.photo || catalogSong.imageUrl || photos[catalogSong._id];
            if (realPhoto) updates.photoUrl = realPhoto;
          }

          // If we found any missing data, update IndexedDB and local state
          if (Object.keys(updates).length > 0) {
            await updateDownloadMetadata(dl._id, updates);
            updatedDownloads[i] = { ...dl, ...updates };
            needsStateRefresh = true;
          }
        }
      }

      if (needsStateRefresh) {
        setDownloadedSongs(updatedDownloads);
      }
      
      hasHealedRef.current = true;
    };

    healMetadata();
  }, [allSongs, downloadedSongs, photos]);

  // Sync order when new songs are added or removed
  useEffect(() => {
    const currentIds = downloadedSongs.map((s) => s._id);
    const keptInPrevious = order.filter((id) => currentIds.includes(id));
    const missing = currentIds.filter((id) => !keptInPrevious.includes(id));
    const nextOrder = [...keptInPrevious, ...missing];

    if (nextOrder.length !== order.length || !nextOrder.every((id, i) => id === order[i])) {
      setOrder(nextOrder);
      writeStoredOrder(nextOrder);
    }
  }, [downloadedSongs, order]);

  const availableLanguages = useMemo(() => {
    const langs = new Set(downloadedSongs.map((s) => s.language));
    return ["All", ...Array.from(langs)];
  }, [downloadedSongs]);

  const filteredDownloads = useMemo(() => {
    let result = downloadedSongs;

    if (selectedLanguage !== "All") {
      result = result.filter((s) => s.language === selectedLanguage);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.artistName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [downloadedSongs, searchTerm, selectedLanguage]);

  const handlePlay = (index) => {
    // Map to format expected by the player
    const playableSongs = filteredDownloads.map(s => ({
      _id: s._id,
      title: s.title,
      audioUrl: s.audioUrl,
      artist: { name: s.artistName }
    }));
    playPlaylist(playableSongs, index);
    navigate("/player", { state: { songs: playableSongs, startIndex: index } });
  };

  const handlePlayAll = () => {
    if (!filteredDownloads.length) return;
    const playableSongs = filteredDownloads.map(s => ({
      _id: s._id,
      title: s.title,
      audioUrl: s.audioUrl,
      artist: { name: s.artistName }
    }));
    playPlaylist(playableSongs, 0);
    navigate("/player", { state: { songs: playableSongs, startIndex: 0 } });
  };

  const handleRemove = async (e, song) => {
    e.stopPropagation();
    if (removingIds.has(song._id) || removingAll) return;

    setRemovingIds((prev) => new Set(prev).add(song._id));
    try {
      await removeDownload(song._id);
      setDownloadedSongs((prev) => prev.filter((s) => s._id !== song._id));
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
      `Remove all ${downloadedSongs.length} downloaded song${downloadedSongs.length === 1 ? "" : "s"}? This cannot be undone.`
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
        setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        setDownloadedSongs((prev) => prev.filter((s) => s._id !== id));
      } catch (err) {
        console.error("Remove failed:", id, err);
        failed += 1;
        setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    }

    setRemovingAll(false);
    setSelectedLanguage("All");

    if (failed === 0) showNotification(`🗑️ Removed ${removed} download${removed === 1 ? "" : "s"}`, "#f44336");
    else if (removed === 0) showNotification("✕ Could not remove downloads", "#f44336");
    else showNotification(`Removed ${removed}, ${failed} failed`, "#FF6B00");
  };

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || index === draggedIndex) return;
    setDragOverIndex(index);
  };
  const handleDragLeave = () => setDragOverIndex(null);

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setDownloadedSongs((prevSongs) => {
        const next = [...prevSongs];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(dragOverIndex, 0, moved);
        writeStoredOrder(next.map((s) => s._id));
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

  const isSongPlaying = (song) => currentSong?._id === song._id && isPlaying;
  const dragEnabled = !searchTerm.trim() && selectedLanguage === "All" && !removingAll;

  return (
    <>
      <div className="ds__back" onClick={() => navigate(-1)}>
        <div className="ds__back-icon"><i className="fa-solid fa-arrow-left"></i></div>
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
          <div className="ds__filters">
            <div className="ds__search" style={{ flex: 1, marginBottom: 0 }}>
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
                <i className="fa-solid fa-xmark ds__search-clear" onClick={() => setSearchTerm("")}></i>
              )}
            </div>

            <div className="ds__select-wrapper">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="ds__select"
                disabled={removingAll}
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down ds__select-icon"></i>
            </div>
          </div>
        )}

        {loading ? (
          <div className="ds__loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Scanning downloads...</p>
          </div>
        ) : downloadedSongs.length === 0 ? (
          <div className="ds__empty">
            <div className="ds__empty-art"><i className="fa-solid fa-cloud-arrow-down"></i></div>
            <h2 className="ds__empty-title">No downloads yet</h2>
            <p className="ds__empty-text">Tap the download button on any song to save it for offline playback.</p>
            <button className="ds__btn ds__btn--primary" onClick={() => navigate("/")}>
              <i className="fa-solid fa-compass"></i> Browse Songs
            </button>
          </div>
        ) : (
          <>
            <div className="ds__actions">
              <button className="ds__action ds__action--play" onClick={handlePlayAll} disabled={removingAll || filteredDownloads.length === 0}>
                <i className="fa-solid fa-play"></i> <span>Play All</span>
              </button>
              
              <div style={{ flex: 1 }}></div>

              <button className="ds__action ds__action--remove" onClick={handleRemoveAll} disabled={removingAll}>
                {removingAll ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> <span>Removing...</span></>
                ) : (
                  <><i className="fa-regular fa-trash-can"></i> <span>Remove All</span></>
                )}
              </button>
            </div>

            {(searchTerm || selectedLanguage !== "All") && (
              <div className="ds__search-info">
                Showing {filteredDownloads.length} of {downloadedSongs.length} downloads
              </div>
            )}

            <div className="ds__list">
              {filteredDownloads.length === 0 ? (
                <div className="ds__list-empty">
                  <i className="fa-solid fa-search"></i>
                  <p>No downloads match your filters</p>
                </div>
              ) : (
                filteredDownloads.map((song, filteredIndex) => {
                  const realIndex = dragEnabled ? filteredIndex : downloadedSongs.findIndex((s) => s._id === song._id);
                  const playing = isSongPlaying(song);
                  const isRemoving = removingIds.has(song._id);
                  const isDragging = draggedIndex === realIndex;
                  const isDragOver = dragOverIndex === realIndex;
                  
                  // Use saved photoUrl first, fallback to DataContext photos
                  const displayPhoto = song.photoUrl || photos[song._id];

                  return (
                    <div
                      key={song._id}
                      className={`ds__item ${playing ? "ds__item--playing" : ""} ${isDragging ? "ds__item--dragging" : ""} ${isDragOver ? "ds__item--drag-over" : ""}`}
                      onClick={() => !removingAll && handlePlay(filteredIndex)}
                      draggable={dragEnabled}
                      onDragStart={() => dragEnabled && handleDragStart(realIndex)}
                      onDragOver={(e) => dragEnabled && handleDragOver(e, realIndex)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                    >
                      {displayPhoto ? (
                        <img src={displayPhoto} alt={song.title} className="ds__item-img" />
                      ) : (
                        <div className="ds__item-placeholder"><i className="fa-solid fa-music"></i></div>
                      )}

                      {playing && (
                        <div className="ds__playing-bars"><span></span><span></span><span></span></div>
                      )}

                      <div className="ds__item-details">
                        <span className="ds__item-title">{song.title}</span>
                        <span className="ds__item-artist">
                          {song.artistName}
                        </span>
                      </div>

                      <div className="ds__item-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="ds__download-btn ds__download-btn--remove"
                          onClick={(e) => handleRemove(e, song)}
                          disabled={isRemoving || removingAll}
                          title="Remove download"
                        >
                          {isRemoving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-trash-can"></i>}
                        </button>

                        {dragEnabled && (
                          <span className="ds__item-drag" title="Drag to reorder">
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