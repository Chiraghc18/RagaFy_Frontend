import React, { useEffect, useState} from "react";
import SongFilterSearch from "../components/SongFilterSearch";
import { fetchAllFilters, fetchFilteredSongs } from "../services/songService/songFilterService";
import BrowseSongLists from "../components/BrowseSongLists";
import "../assets/style/SongFilterSearchPage.css";
import { useNavigate } from 'react-router-dom';
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

    const navigate = useNavigate();

  return (
    <>
    <div
        className="browse__back"
        onClick={() => {navigate(-1);}}
      >
        <i className="browse__back-icon fa-solid fa-arrow-left"></i>
      </div>
    <div className="sfs-page">
      <h2 className="sfs-page__title">Filter Songs</h2>

      <SongFilterSearch
        filters={filters}
        options={options}
        handleChange={handleChange}
      />

      <button onClick={handleSearch} className="sfs-page__search-btn">
        Search
      </button>

      <div className="sfs-results">
        <h3 className="sfs-results__title">Results:</h3>

        {loading ? (
          <p className="sfs-results__loading">Loading...</p>
        ) : songs.length === 0 ? (
          <p className="sfs-results__empty">No songs found</p>
        ) : (
          <BrowseSongLists songs={songs} />
        )}
      </div>
    </div>
  </>
  );
}
