// components/BrowseSongLists.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
// import '../assets/style/BrowseSongList.css';

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
  const { photos, addToQueue } = useData();
  const { playPlaylist, currentSong } = useGlobalPlayer(); // Added currentSong for active state

  const handleSongClick = (index) => {
    // Play immediately in global player and navigate to full player page
    playPlaylist(songs, index);
    navigate("/player", { state: { songs, startIndex: index } });
  };

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    addToQueue(song);
    
    // Show mini notification
    showNotification('✓ Added to queue', '#4CAF50');
  };

  const handlePlayNow = (e, song, index) => {
    e.stopPropagation();
    playPlaylist(songs, index);
    
    // Show mini notification
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

  // Check if a song is currently playing
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
            
            <span className="browse-songs__item-title">{song.title}</span>
            
            <div className="browse-songs__item-actions">
              <button 
                className="browse-songs__item-play-btn"
                onClick={(e) => handlePlayNow(e, song, index)}
                title="Play now"
              >
                <i className="fa-solid fa-play"></i>
              </button>
              
              <button 
                className="browse-songs__item-add-btn"
                onClick={(e) => handleAddToQueue(e, song)}
                title="Add to queue"
              >
                <i className="fa-regular fa-square-plus"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}