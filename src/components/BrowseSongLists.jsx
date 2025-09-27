import React, { useState, useEffect } from "react";
import axios from "axios";

export default function BrowseSongLists({ songs, photo }) {
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    const loadPhotos = async () => {
      const photoMap = {};
      await Promise.all(
        songs.map(async (song) => {
          try {
            const res = await axios.get(
              `https://ragafy-backend.onrender.com/songs/${song._id}/photo`
            );
            photoMap[song._id] = res.data.url;
          } catch {
            photoMap[song._id] = null;
          }
        })
      );
      setPhotos(photoMap);
    };

    if (songs.length > 0) {
      loadPhotos();
    }
  }, [songs]);

  const handleSongClick = (index) => {
    // Save playlist + selected index in localStorage
    localStorage.setItem("ragafySongs", JSON.stringify(songs));
    localStorage.setItem("ragafyStartIndex", index);

    // Open new tab
    window.open("/player", "_blank");
  };

  return (
    <div className="browse-song-list">
      {photo && (
        <div className="selected-item-container">
          <img
            src={photo}
            alt="Selected item"
            className="selected-item-photo"
          />
        </div>
      )}

      <div className="song-list">
        {songs.map((song, index) => (
          <div
            key={song._id}
            onClick={() => handleSongClick(index)}
            className="song-item"
          >
            {photos[song._id] && (
              <img
                src={photos[song._id]}
                alt={song.title}
                className="song-item-image"
              />
            )}
            <span>{song.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
