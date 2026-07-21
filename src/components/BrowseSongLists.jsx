import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import "../assets/style/BrowseSongList.css";

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
  const { photos, addToQueue, queue } = useData();
  const { playPlaylist, currentSong } = useGlobalPlayer();
  
  const [queueStatus, setQueueStatus] = useState({});
  const [animatingSong, setAnimatingSong] = useState(null);

  // Update queue status when queue changes
  useEffect(() => {
    const queueSongIds = new Set(queue.map(song => song._id));
    const newQueueStatus = {};
    songs.forEach(song => {
      newQueueStatus[song._id] = queueSongIds.has(song._id);
    });
    setQueueStatus(newQueueStatus);
  }, [queue, songs]);

  const handleSongClick = (index) => {
    playPlaylist(songs, index);
    navigate("/player", { state: { songs, startIndex: index } });
  };

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    setAnimatingSong(song._id);
    setTimeout(() => setAnimatingSong(null), 500);
    addToQueue(song);
    showNotification('✓ Added to queue', '#4CAF50');
  };

  const handlePlayNow = (e, song, index) => {
    e.stopPropagation();
    playPlaylist(songs, index);
    showNotification(`▶ Playing: ${song.title}`, '#FF6B00');
  };

  const showNotification = (message, color) => {
    const notification = document.createElement('div');
    notification.className = 'bsl-notification';
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const isSongPlaying = (song) => {
    return currentSong?._id === song._id;
  };

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

      <div className="bsl-song-list">
        {songs.map((song, index) => (
          <div
            key={song._id}
            onClick={() => handleSongClick(index)}
            className={`bsl-song-item ${isSongPlaying(song) ? 'bsl-song-item--playing' : ''}`}
          >
            {/* Song image */}
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
            
            {/* Playing indicator */}
            {isSongPlaying(song) && (
              <div className="bsl-playing-dot">
                <i className="fa-solid fa-volume-high"></i>
              </div>
            )}
            
            {/* Song info */}
            <div className="bsl-song-info" onClick={(e) => handlePlayNow(e, song, index)}>
              <span className="bsl-song-title">{song.title}</span>
              <span className="bsl-song-artist">
                {song.artist?.name || song.singers?.[0]?.name || 'Unknown'}
              </span>
            </div>
            
            {/* Add to queue button */}
            <div className="bsl-song-actions">
              <button 
                className={`bsl-add-btn ${queueStatus[song._id] ? 'bsl-add-btn--added' : ''} ${animatingSong === song._id ? 'bsl-add-btn--animating' : ''}`}
                onClick={(e) => handleAddToQueue(e, song)}
                title={queueStatus[song._id] ? "Remove from queue" : "Add to queue"}
              >
                {queueStatus[song._id] ? (
                  <i className="fa-solid fa-check"></i>
                ) : (
                  <i className="fa-solid fa-plus"></i>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}