import React, { useState, useEffect } from "react";
import axios from "axios";
import fetchSongs from "../../services/songService/fetchSongs";
import "../../assets/style/UserPage/HeadSearch.css";
import { useNavigate } from "react-router-dom";

export default function HeadSearch() {
  const [songs, setSongs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [photos, setPhotos] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const songRes = await fetchSongs();
        const songData = songRes.data || [];
        setSongs(songData);
        setFiltered(songData);

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
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (e) => setQuery(e.target.value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query.trim()) setFiltered(songs);
      else {
        const filteredSongs = songs.filter((song) =>
          song.title.toLowerCase().includes(query.toLowerCase())
        );
        setFiltered(filteredSongs);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, songs]);

  const handleSongClick = (song) => {
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

  const clearSearch = () => {
    setQuery("");
    setFiltered(songs);
  };

  return (
    <>
      {/* Back Button */}
      <div className="hs-back-button" onClick={() => navigate("/")}>
        <i className="fa-solid fa-arrow-left"></i>
      </div>

      <div className="hs-container">
        <div className="hs-search-bar">
          <input
            type="text"
            placeholder="Search songs by title..."
            value={query}
            onChange={handleSearch}
            autoFocus
          />
          {!query ? (
            <i className="fa-solid fa-magnifying-glass"></i>
          ) : (
            <i
              className="fa-solid fa-times hs-clear-icon"
              onClick={clearSearch}
            ></i>
          )}
        </div>

        {!loading && query && (
          <div className="hs-results-count">
            Found <strong>{filtered.length}</strong> song
            {filtered.length !== 1 ? "s" : ""} matching "{query}"
          </div>
        )}

        <div className="hs-results-list">
          {loading ? (
            <div className="hs-loading">Loading songs...</div>
          ) : filtered.length > 0 ? (
            filtered.map((song) => (
              <div
                key={song._id}
                onClick={() => handleSongClick(song)}
                className="hs-result-item"
              >
                {photos[song._id] ? (
                  <img
                    src={photos[song._id]}
                    alt={song.title}
                    className="hs-result-item-image"
                  />
                ) : (
                  <div className="hs-result-item-image placeholder">🎵</div>
                )}
                <span className="hs-result-item-title">{song.title}</span>
              </div>
            ))
          ) : query ? (
            <div className="hs-no-results">
              <i
                className="fa-solid fa-music"
                style={{
                  fontSize: "3rem",
                  marginBottom: "15px",
                  opacity: "0.5",
                }}
              ></i>
              <div>No songs found for "{query}"</div>
              <div
                style={{ fontSize: "1rem", marginTop: "10px", opacity: "0.7" }}
              >
                Try searching with different keywords
              </div>
            </div>
          ) : (
            <div className="hs-no-results">
              <i
                className="fa-solid fa-search"
                style={{
                  fontSize: "3rem",
                  marginBottom: "15px",
                  opacity: "0.5",
                }}
              ></i>
              <div>Search for songs</div>
              <div
                style={{ fontSize: "1rem", marginTop: "10px", opacity: "0.7" }}
              >
                Enter a song title in the search bar above
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
