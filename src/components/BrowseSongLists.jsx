import React from "react"; // Removed useState, useEffect
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext"; // <-- IMPORT
// Removed axios

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
  const { photos } = useData(); // <-- Get the globally-loaded photo map

  // The entire useEffect to load photos is GONE.

  const handleSongClick = (index) => {
    navigate("/player", { state: { songs, startIndex: index } });
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
            {/* This now works instantly from global state */}
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
          </div>
        ))}
      </div>
    </div>
  );
}