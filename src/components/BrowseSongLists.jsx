import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import { isDownloaded, downloadSong } from "../services/downloadService";
import "../assets/style/BrowseSongList.css";

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
  const { photos } = useData();
  const { playPlaylist, currentSong, currentPlaylist, addToPlaylist } =
    useGlobalPlayer();

  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());

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

    load();
    return () => {
      cancelled = true;
    };
  }, [songs]);

  const handleSongClick = (index) => {
    playPlaylist(songs, index);
    navigate("/player", { state: { songs, startIndex: index } });
  };

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();

    const alreadyInQueue = currentPlaylist.some((s) => s._id === song._id);
    if (alreadyInQueue) return;

    addToPlaylist([song]);
    showNotification(`＋ Added to queue: ${song.title}`, "#4CAF50");
  };

  const handleAddAllToQueue = (e) => {
    e.stopPropagation();

    const notQueued = songs.filter(
      (s) => !currentPlaylist.some((existing) => existing._id === s._id)
    );

    if (notQueued.length === 0) return;

    addToPlaylist(notQueued);
    showNotification(
      `＋ Added ${notQueued.length} song${
        notQueued.length === 1 ? "" : "s"
      } to queue`,
      "#4CAF50"
    );
  };

  const handleDownload = async (e, song) => {
    e.stopPropagation();
    if (downloadedIds.has(song._id) || downloadingIds.has(song._id)) return;

    setDownloadingIds((prev) => new Set(prev).add(song._id));

    try {
      await downloadSong(song);
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

  const handlePlayNow = (e, song, index) => {
    e.stopPropagation();
    playPlaylist(songs, index);
    showNotification(`▶ Playing: ${song.title}`, "#FF6B00");
  };

  const showNotification = (message, color) => {
    const notification = document.createElement("div");
    notification.className = "bsl-notification";
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const isSongPlaying = (song) => currentSong?._id === song._id;
  const isSongQueued = (song) =>
    currentPlaylist.some((s) => s._id === song._id);

  const allQueued = songs.every((s) =>
    currentPlaylist.some((existing) => existing._id === s._id)
  );

  return (
    <div className="bsl-container">
      {photo && (
        <div className="bsl-selected-photo-wrap">
          <img
            src={photo}
            alt="Selected item"
            className="bsl-selected-photo"
          />
        </div>
      )}

      {/* 👇 Header row: label on left, Add-all button on the right */}
      <div className="bsl-list-header">
        <h3 className="bsl-list-header-title">
          <i className="fa-solid fa-list-ol"></i> Songs
          <span className="bsl-list-header-count">{songs.length}</span>
        </h3>

        {!allQueued && (
          <button className="bsl-add-all-btn" onClick={handleAddAllToQueue}>
            <i className="fa-solid fa-plus" />
            Add all to queue
          </button>
        )}
      </div>

      <div className="bsl-song-list">
        {songs.map((song, index) => {
          const inDownloads = downloadedIds.has(song._id);
          const isDownloading = downloadingIds.has(song._id);
          const queued = isSongQueued(song);

          return (
            <div
              key={song._id}
              onClick={() => handleSongClick(index)}
              className={`bsl-song-item ${
                isSongPlaying(song) ? "bsl-song-item--playing" : ""
              }`}
            >
              {photos[song._id] ? (
                <img
                  src={photos[song._id]}
                  alt={song.title}
                  className="bsl-song-img"
                />
              ) : (
                <div className="bsl-song-img-placeholder">
                  <i className="fa-solid fa-music"></i>
                </div>
              )}

              {isSongPlaying(song) && (
                <div className="bsl-playing-dot">
                  <i className="fa-solid fa-volume-high"></i>
                </div>
              )}

              <div
                className="bsl-song-info"
                onClick={(e) => handlePlayNow(e, song, index)}
              >
                <span className="bsl-song-title">{song.title}</span>
                <span className="bsl-song-artist">
                  {song.artist?.name || song.singers?.[0]?.name || " "}
                </span>
              </div>

              <div className="bsl-song-actions">
                {!queued && (
                  <button
                    className="bsl-queue-btn"
                    onClick={(e) => handleAddToQueue(e, song)}
                    title="Add to queue"
                    aria-label={`Add ${song.title} to queue`}
                  >
                    <i className="fa-solid fa-plus" />
                  </button>
                )}

                {!inDownloads && (
                  <button
                    className="bsl-download-btn"
                    onClick={(e) => handleDownload(e, song)}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}