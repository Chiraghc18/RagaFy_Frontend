import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BrowseSongLists({ songs, photo }) {
  const navigate = useNavigate();
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
