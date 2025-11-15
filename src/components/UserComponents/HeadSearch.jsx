import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext"; // <-- IMPORT
import "../../assets/style/UserPage/HeadSearch.css";
import { useNavigate } from "react-router-dom";
// Removed axios and fetchSongs

export default function HeadSearch() {
  // Get global data
  const { songs, photos, loading } = useData();

  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // The main data loading useEffect is GONE.

  // This new useEffect initializes the filter state once songs are loaded
  useEffect(() => {
    if (!loading) {
      setFiltered(songs);
    }
  }, [loading, songs]);

  const handleSearch = (e) => setQuery(e.target.value);

  // This client-side search logic remains
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
                {/* This now reads from the global photo map */}
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