import React, { useEffect, useState } from "react";
import {
  fetchGenres,
  fetchArtists,
  fetchAlbums,
  fetchMovies,
  fetchHeroes,
  fetchHeroines,
  fetchSingers,
  fetchLanguages
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
  const [selectedSingers, setSelectedSingers] = useState([]);

  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [movies, setMovies] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [heroines, setHeroines] = useState([]);
  const [singers, setSingers] = useState([]);
  const [languages, setLanguages] = useState([]);

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
    setSelectedSingers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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
      language
    };
    onUpload(file, meta);
  };

  return (
    <form onSubmit={submit} style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <input type="file" accept="audio/*" onChange={(e) => { setFile(e.target.files[0] || null); if (!title && e.target.files[0]) setTitle(e.target.files[0].name); }} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: 6 }} />

        <select value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="">Select Genre</option>
          {genres.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>

        <select value={artist} onChange={e => setArtist(e.target.value)}>
          <option value="">Select Artist</option>
          {artists.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
        </select>

        <select value={album} onChange={e => setAlbum(e.target.value)}>
          <option value="">Select Album</option>
          {albums.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
        </select>

        <select value={movie} onChange={e => setMovie(e.target.value)}>
          <option value="">Select Movie</option>
          {movies.map(m => <option key={m._id} value={m._1d || m._id}>{m.name || m.title}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Singers</strong>
        <div style={{ maxHeight: 120, overflowY: "auto", border: "1px solid #ddd", padding: 8 }}>
          {singers.map(s => (
            <label key={s._id} style={{ display: "block", marginBottom: 4 }}>
              <input type="checkbox" checked={selectedSingers.includes(s._id)} onChange={() => toggleSinger(s._id)} />
              <span style={{ marginLeft: 8 }}>{s.name || s._id}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <select value={hero} onChange={e => setHero(e.target.value)}>
          <option value="">Select Hero</option>
          {heroes.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>

        <select value={heroine} onChange={e => setHeroine(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">Select Heroine</option>
          {heroines.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">Select Language</option>
          {languages.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>

      <button type="submit">Upload Song</button>
    </form>
  );
}
