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
    <div className="browse-song-list">
      {photo && (
        <div>
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
