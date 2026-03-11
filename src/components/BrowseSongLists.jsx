// components/BrowseSongLists.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
// import '../assets/style/BrowseSongList.css';

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
  const { photos, addToQueue, queue } = useData(); // Added queue
  const { playPlaylist, currentSong } = useGlobalPlayer();
  
  // Local state to track which songs are in queue with animation
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
    
    // Trigger animation
    setAnimatingSong(song._id);
    setTimeout(() => setAnimatingSong(null), 500);
    
    addToQueue(song);
    
    // Show mini notification
    showNotification('✓ Added to queue', '#4CAF50');
  };

  const handlePlayNow = (e, song, index) => {
    e.stopPropagation();
    playPlaylist(songs, index);
    
    showNotification(`▶ Playing: ${song.title}`, '#ffa500');
  };

  const showNotification = (message, color) => {
    const notification = document.createElement('div');
    notification.className = 'browse-songs__notification';
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const isSongPlaying = (song) => {
    return currentSong?._id === song._id;
  };

  return (
    <div className="browse-songs">
      {photo && (
        <div className="browse-songs__selected">
          <img
            src={photo}
            alt="Selected item"
            className="browse-songs__selected-photo"
          />
        </div>
      )}

      <div className="browse-songs__list">
        {songs.map((song, index) => (
          <div
            key={song._id}
            onClick={() => handleSongClick(index)}
            className={`browse-songs__item ${isSongPlaying(song) ? 'browse-songs__item--playing' : ''}`}
          >
            {photos[song._id] ? (
              <img
                src={photos[song._id]}
                alt={song.title}
                className="browse-songs__item-image"
              />
            ) : (
              <div className="browse-songs__item-placeholder">🎵</div>
            )}
            
            {/* Playing indicator */}
            {isSongPlaying(song) && (
              <div className="browse-songs__playing-indicator">
                <i className="fa-solid fa-volume-high"></i>
              </div>
            )}
            
            <span className="browse-songs__item-title" onClick={(e) => handlePlayNow(e, song, index)}>
              {song.title}
            </span>
            
            <div className="browse-songs__item-actions">
              <button 
                className={`browse-songs__item-add-btn ${queueStatus[song._id] ? 'browse-songs__item-add-btn--added' : ''} ${animatingSong === song._id ? 'browse-songs__item-add-btn--animating' : ''}`}
                onClick={(e) => handleAddToQueue(e, song)}
                title={queueStatus[song._id] ? "Added to queue" : "Add to queue"}
              >
                {queueStatus[song._id] ? (
                  <i className="fa-regular fa-square-check"></i> 
                ) : (
                  <i className="fa-regular fa-square-plus"></i>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}