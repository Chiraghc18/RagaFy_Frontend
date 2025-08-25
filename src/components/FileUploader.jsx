import React, { useEffect, useState } from "react";
import {
  fetchGenres,
  fetchArtists,
  fetchAlbums,
  fetchMovies,
  fetchHeroes,
  fetchHeroines,
  fetchSingers,
  fetchLanguages,
} from "../services/songService/songService";

export default function FileUploader({ onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [movie, setMovie] = useState("");
  const [hero, setHero] = useState("");
  const [heroine, setHeroine] = useState("");
  const [language, setLanguage] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [selectedSingers, setSelectedSingers] = useState([]);

  // All options
  const [genres, setGenres] = useState([]);
  const [subgenres, setSubgenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [movies, setMovies] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [heroines, setHeroines] = useState([]);
  const [singers, setSingers] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Search states
  const [search, setSearch] = useState({
    genre: "",
    subgenre: "",
    artist: "",
    album: "",
    movie: "",
    hero: "",
    heroine: "",
    singer: "",
    language: "",
  });

  useEffect(() => {
    fetchGenres().then(r => setGenres(r.data || [])).catch(()=>{});
    fetchArtists().then(r => setArtists(r.data || [])).catch(()=>{});
    fetchAlbums().then(r => setAlbums(r.data || [])).catch(()=>{});
    fetchMovies().then(r => setMovies(r.data || [])).catch(()=>{});
    fetchHeroes().then(r => setHeroes(r.data || [])).catch(()=>{});
    fetchHeroines().then(r => setHeroines(r.data || [])).catch(()=>{});
    fetchSingers().then(r => setSingers(r.data || [])).catch(()=>{});
    fetchLanguages().then(r => setLanguages(r.data || [])).catch(()=>{});
  }, []);

  const toggleSinger = (id) => {
    setSelectedSingers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const submit = (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an audio file");
    const meta = {
      title,
      genre,
      subgenre,
      artist,
      album,
      movie,
      singers: selectedSingers,
      hero,
      heroine,
      language,
      releaseDate,
    };
    onUpload(file, meta);
  };

  // Utility: filter options by search text
  const filterOptions = (options, key) =>
    options.filter(o =>
      o.name?.toLowerCase().includes(search[key].toLowerCase())
    );

  return (
    <form onSubmit={submit} style={{ marginBottom: 16 }}>
      {/* File Upload */}
      <div style={{ marginBottom: 8 }}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => {
            setFile(e.target.files[0] || null);
            if (!title && e.target.files[0]) setTitle(e.target.files[0].name);
          }}
        />
      </div>

      {/* Title */}
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Song Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: 6, width: "60%" }}
        />
      </div>

      {/* Genre + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Genre</label>
        <input
          type="text"
          placeholder="Search Genre..."
          value={search.genre}
          onChange={e => setSearch({ ...search, genre: e.target.value })}
        />
        <select value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="">Select Genre</option>
          {filterOptions(genres, "genre").map(g => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Subgenre + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Subgenre</label>
        <input
          type="text"
          placeholder="Search Subgenre..."
          value={search.subgenre}
          onChange={e => setSearch({ ...search, subgenre: e.target.value })}
        />
        <select value={subgenre} onChange={e => setSubgenre(e.target.value)}>
          <option value="">Select Subgenre</option>
          {filterOptions(subgenres, "subgenre").map(sg => (
            <option key={sg._id} value={sg._id}>{sg.name}</option>
          ))}
        </select>
      </div>

      {/* Artist + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Artist</label>
        <input
          type="text"
          placeholder="Search Artist..."
          value={search.artist}
          onChange={e => setSearch({ ...search, artist: e.target.value })}
        />
        <select value={artist} onChange={e => setArtist(e.target.value)}>
          <option value="">Select Artist</option>
          {filterOptions(artists, "artist").map(a => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Album + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Album</label>
        <input
          type="text"
          placeholder="Search Album..."
          value={search.album}
          onChange={e => setSearch({ ...search, album: e.target.value })}
        />
        <select value={album} onChange={e => setAlbum(e.target.value)}>
          <option value="">Select Album</option>
          {filterOptions(albums, "album").map(a => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Movie + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Movie</label>
        <input
          type="text"
          placeholder="Search Movie..."
          value={search.movie}
          onChange={e => setSearch({ ...search, movie: e.target.value })}
        />
        <select value={movie} onChange={e => setMovie(e.target.value)}>
          <option value="">Select Movie</option>
          {filterOptions(movies, "movie").map(m => (
            <option key={m._id} value={m._id}>{m.name || m.title}</option>
          ))}
        </select>
      </div>

      {/* Hero + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Hero</label>
        <input
          type="text"
          placeholder="Search Hero..."
          value={search.hero}
          onChange={e => setSearch({ ...search, hero: e.target.value })}
        />
        <select value={hero} onChange={e => setHero(e.target.value)}>
          <option value="">Select Hero</option>
          {filterOptions(heroes, "hero").map(h => (
            <option key={h._id} value={h._id}>{h.name}</option>
          ))}
        </select>
      </div>

      {/* Heroine + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Heroine</label>
        <input
          type="text"
          placeholder="Search Heroine..."
          value={search.heroine}
          onChange={e => setSearch({ ...search, heroine: e.target.value })}
        />
        <select value={heroine} onChange={e => setHeroine(e.target.value)}>
          <option value="">Select Heroine</option>
          {filterOptions(heroines, "heroine").map(h => (
            <option key={h._id} value={h._id}>{h.name}</option>
          ))}
        </select>
      </div>

      {/* Language + search */}
      <div style={{ marginBottom: 8 }}>
        <label>Language</label>
        <input
          type="text"
          placeholder="Search Language..."
          value={search.language}
          onChange={e => setSearch({ ...search, language: e.target.value })}
        />
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="">Select Language</option>
          {filterOptions(languages, "language").map(l => (
            <option key={l._id} value={l._id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Singers (multi-select with search) */}
      <div style={{ marginBottom: 8 }}>
        <label>Singers</label>
        <input
          type="text"
          placeholder="Search Singer..."
          value={search.singer}
          onChange={e => setSearch({ ...search, singer: e.target.value })}
        />
        <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #ddd", padding: 8 }}>
          {filterOptions(singers, "singer").map(s => (
            <label key={s._id} style={{ display: "block", marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={selectedSingers.includes(s._id)}
                onChange={() => toggleSinger(s._id)}
              />
              <span style={{ marginLeft: 8 }}>{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Release Date */}
      <div style={{ marginBottom: 8 }}>
        <label><strong>Release Date: </strong></label>
        <input
          type="date"
          value={releaseDate}
          onChange={e => setReleaseDate(e.target.value)}
        />
      </div>

      <button type="submit">Upload Song</button>
    </form>
  );
}
