import React, { useEffect, useState } from "react";
import SongFilterSearch from "../components/SongFilterSearch";
import { fetchAllFilters, fetchFilteredSongs } from "../services/songService/songFilterService";
import BrowseSongLists from "../components/BrowseSongLists";
import "../assets/style/SongFilterSearchPage.css";

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

    genreName: "",      // NEW
    subgenreName: "",   // NEW
    languageName: "",   // NEW
  });

  const [options, setOptions] = useState({
    genres: [],
    artists: [],
    albums: [],
    movies: [],
    heroes: [],
    heroines: [],
    singers: [],
    languages: [],
  });

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      const data = await fetchAllFilters();
      setOptions(data);
    };
    loadOptions();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    setLoading(true);
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
    <div className="song-filter-search-page">
      <h2 className="page-title">Filter Songs</h2>

      <SongFilterSearch filters={filters} options={options} handleChange={handleChange} />

      <button onClick={handleSearch} className="search-btn">
        Search
      </button>

      <div className="results-container">
        <h3 className="results-title">Results:</h3>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : songs.length === 0 ? (
          <p className="no-results">No songs found</p>
        ) : (
          <BrowseSongLists songs={songs} />
        )}
      </div>
    </div>
  );
}
