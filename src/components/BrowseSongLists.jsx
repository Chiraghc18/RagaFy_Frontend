// components/BrowseSongLists.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
// import '../assets/style/BrowseSongList.css';

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
  const { photos, addToQueue } = useData();

  const handleSongClick = (index) => {
    navigate("/player", { state: { songs, startIndex: index } });
  };

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    addToQueue(song);
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
            className="browse-songs__item"
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
            <span className="browse-songs__item-title">{song.title}</span>
            <button 
              className="browse-songs__item-add-btn"
              onClick={(e) => handleAddToQueue(e, song)}
            >
              <i className="fa-regular fa-square-plus"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}