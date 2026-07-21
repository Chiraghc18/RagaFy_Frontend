import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import BrowseSongLists from "../BrowseSongLists";
import "../../assets/style/UserPage/HeadSearch.css";
import { useNavigate } from "react-router-dom";

export default function HeadSearch() {
  const { songs, photos, loading } = useData();
  const { playPlaylist } = useGlobalPlayer();
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      setFiltered(songs);
    }
  }, [loading, songs]);

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

  const clearSearch = () => {
    setQuery("");
    setFiltered(songs);
  };

  return (
    <>
      {/* Back Button */}
      <div className="hs__back" onClick={() => navigate("/")}>
        <div className="hs__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="hs__back-text">Back</span>
      </div>

      <div className="hs">
        {/* Search Bar */}
        <div className="hs__search">
          <div className="hs__search-wrapper">
            <i className="fa-solid fa-magnifying-glass hs__search-icon-left"></i>
            <input
              type="text"
              placeholder="Search songs by title..."
              value={query}
              onChange={handleSearch}
              autoFocus
              className="hs__input"
            />
            {query && (
              <i
                className="fa-solid fa-xmark hs__clear"
                onClick={clearSearch}
              ></i>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && query && (
          <div className="hs__count">
            Found <strong>{filtered.length}</strong> song
            {filtered.length !== 1 ? "s" : ""} matching "<span>{query}</span>"
          </div>
        )}

        {/* Results List - Using BrowseSongLists */}
        <div className="hs__results">
          {loading ? (
            <div className="hs__loading">
              <div className="hs__spinner"></div>
              <p>Loading songs...</p>
            </div>
          ) : filtered.length > 0 ? (
            <BrowseSongLists songs={filtered} />
          ) : query ? (
            <div className="hs__empty">
              <i className="fa-solid fa-music hs__empty-icon"></i>
              <p className="hs__empty-title">No songs found</p>
              <p className="hs__empty-text">
                No results for "<span>{query}</span>". Try different keywords.
              </p>
            </div>
          ) : (
            <div className="hs__empty">
              <i className="fa-solid fa-search hs__empty-icon"></i>
              <p className="hs__empty-title">Search for songs</p>
              <p className="hs__empty-text">
                Enter a song title in the search bar above
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}