import React, { useState } from "react";
import SongFilterSearch from "../components/SongFilterSearch";
import { fetchFilteredSongs } from "../services/songService/songFilterService";
import BrowseSongLists from "../components/BrowseSongLists";
import "../assets/style/SongFilterSearchPage.css";
import { useNavigate } from 'react-router-dom';
import { useData } from "../context/DataContext";

export default function SongFilterSearchPage() {
  const [filters, setFilters] = useState({
    genre: "",
    artist: "",
    album: "",
    movie: "",
    hero: "",
    heroine: "",
    subgenre: "",
    language: "",
    singer: "",
    releaseYear: "",
    name: "",
    artistName: "",
    albumName: "",
    movieName: "",
    heroName: "",
    heroineName: "",
    singerName: "",
    genreName: "",
    subgenreName: "",
    languageName: "",
  });

  const { filterOptions: options, loading: dataLoading } = useData();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await fetchFilteredSongs(filters);
      setSongs(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sfs-page__back" onClick={() => navigate(-1)}>
        <div className="sfs-page__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="sfs-page__back-text">Back</span>
      </div>

      <div className="sfs-page">
        <h2 className="sfs-page__title">Filter Songs</h2>

        {dataLoading ? (
          <div className="sfs-page__loading">
            <div className="sfs-page__spinner"></div>
            <p>Loading filters...</p>
          </div>
        ) : (
          <SongFilterSearch
            filters={filters}
            options={options}
            handleChange={handleChange}
          />
        )}

        <button 
          onClick={handleSearch} 
          className="sfs-page__search-btn" 
          disabled={loading || dataLoading}
        >
          {loading ? (
            <>
              <span className="sfs-page__search-spinner"></span>
              Searching...
            </>
          ) : (
            <>
              <i className="fa-solid fa-magnifying-glass"></i>
              Search
            </>
          )}
        </button>

        <div className="sfs-results">
          <h3 className="sfs-results__title">
            Results
            {hasSearched && songs.length > 0 && (
              <span className="sfs-results__count">{songs.length} songs</span>
            )}
          </h3>

          <div className="sfs-results__content">
            {loading ? (
              <div className="sfs-results__loading">
                <div className="sfs-page__spinner"></div>
                <p>Searching songs...</p>
              </div>
            ) : !hasSearched ? (
              <div className="sfs-results__empty">
                <i className="fa-solid fa-magnifying-glass sfs-results__empty-icon"></i>
                <p>Use the filters above and click Search to find songs</p>
              </div>
            ) : songs.length === 0 ? (
              <div className="sfs-results__empty">
                <i className="fa-solid fa-music sfs-results__empty-icon"></i>
                <p>No songs found. Try adjusting your filters.</p>
              </div>
            ) : (
              <BrowseSongLists songs={songs} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}