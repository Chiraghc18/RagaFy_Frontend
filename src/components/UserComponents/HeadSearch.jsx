// src/components/HeadSearch.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import  fetchSongs  from "../../services/songService/fetchSongs";
import "../../assets/style/UserPage/HeadSearch.css";
import { useNavigate } from "react-router-dom";

export default function HeadSearch({ onBack }) {
  const [songs, setSongs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [photos, setPhotos] = useState({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch songs
        const songRes = await fetchSongs();
        const songData = songRes.data || [];
        setSongs(songData);
        setFiltered(songData);

        // Fetch each song's photo individually
        const photoMap = {};
        await Promise.all(
          songData.map(async (song) => {
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
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setFiltered(songs);
    } else {
      const filteredSongs = songs.filter((song) =>
        song.title.toLowerCase().includes(value.toLowerCase())
      );
      setFiltered(filteredSongs);
    }
  };

  const navigate = useNavigate();
  const handleSongClick = (song) => {
  // Compare by IDs (safer than names in case of spelling differences)
  const filteredSameCategory = songs.filter(
    (s) =>
      s.genre?._id === song.genre?._id &&
      s.language?._id === song.language?._id
  );

  const startIndex = filteredSameCategory.findIndex(
    (s) => s._id === song._id
  );

  navigate("/player", {
    state: { songs: filteredSameCategory, startIndex },
  });
};

  return (
     <>
      <div className="back" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i>
      </div>

    <div className="head-search">
       
      {/* Search Bar */}
      <div className="head-search_search-bar">
        
        <input
          type="text"
          placeholder="Search songs..."
          value={query}
          onChange={handleSearch}
        />
        <i className="fa-solid fa-magnifying-glass"></i>
      </div>

      {/* Song List */}
      <div className="head-search_results">
        {filtered.length > 0 ? (
          filtered.map((song) => (
            <div key={song._id} onClick={() => handleSongClick(song)} className="song-item">
              {photos[song._id] && (
                <img
                  src={photos[song._id]}
                  alt={song.title}
                  className="song-item-image"
                />
              )}
              <span>{song.title}</span>
            </div>
          ))
        ) : (
          <p>No songs found.</p>
        )}
      </div>
    </div>
    </>
  );
  
}

