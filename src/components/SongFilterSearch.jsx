// src/components/SongFilterSearch.jsx
import React from "react";

export default function SongFilterSearch({ filters, options, handleChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  return (
    <div className="filter-container">
      {/* Song Title */}
      <div className="filter-field">
        <label>Song Title</label>
        <input
          type="text"
          name="name"
          placeholder="Enter song title..."
          value={filters.name}
          onChange={handleChange}
        />
      </div>

      {/* Genre */}
      <div className="filter-field">
        <label>Genre</label>
        <input
          type="text"
          name="genreName"
          placeholder="Search genre..."
          value={filters.genreName}
          onChange={handleChange}
        />
        <select name="genre" value={filters.genre} onChange={handleChange}>
          <option value="">-- Select Genre --</option>
          {options.genres
            .filter((g) =>
              g.name.toLowerCase().includes(filters.genreName.toLowerCase())
            )
            .map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
        </select>
      </div>

      {/* Subgenre */}
      <div className="filter-field">
        <label>Subgenre</label>
        <input
          type="text"
          name="subgenreName"
          placeholder="Search subgenre..."
          value={filters.subgenreName}
          onChange={handleChange}
        />
        <select name="subgenre" value={filters.subgenre} onChange={handleChange}>
          <option value="">-- Select Subgenre --</option>
          {options.subgenres
            ?.filter((sg) =>
              sg.name.toLowerCase().includes(filters.subgenreName.toLowerCase())
            )
            .map((sg) => (
              <option key={sg._id} value={sg._id}>
                {sg.name}
              </option>
            ))}
        </select>
      </div>

      {/* Language */}
      <div className="filter-field">
        <label>Language</label>
        <input
          type="text"
          name="languageName"
          placeholder="Search language..."
          value={filters.languageName}
          onChange={handleChange}
        />
        <select name="language" value={filters.language} onChange={handleChange}>
          <option value="">-- Select Language --</option>
          {options.languages
            .filter((l) =>
              l.name.toLowerCase().includes(filters.languageName.toLowerCase())
            )
            .map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
        </select>
      </div>

      {/* Artist */}
      <div className="filter-field">
        <label>Artist</label>
        <input
          type="text"
          name="artistName"
          placeholder="Search artist..."
          value={filters.artistName}
          onChange={handleChange}
        />
        <select name="artist" value={filters.artist} onChange={handleChange}>
          <option value="">-- Select Artist --</option>
          {options.artists
            .filter((a) =>
              a.name.toLowerCase().includes(filters.artistName.toLowerCase())
            )
            .map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
        </select>
      </div>

      {/* Album */}
      <div className="filter-field">
        <label>Album</label>
        <input
          type="text"
          name="albumName"
          placeholder="Search album..."
          value={filters.albumName}
          onChange={handleChange}
        />
        <select name="album" value={filters.album} onChange={handleChange}>
          <option value="">-- Select Album --</option>
          {options.albums
            .filter((a) =>
              a.name.toLowerCase().includes(filters.albumName.toLowerCase())
            )
            .map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
        </select>
      </div>

      {/* Movie */}
      <div className="filter-field">
        <label>Movie</label>
        <input
          type="text"
          name="movieName"
          placeholder="Search movie..."
          value={filters.movieName}
          onChange={handleChange}
        />
        <select name="movie" value={filters.movie} onChange={handleChange}>
          <option value="">-- Select Movie --</option>
          {options.movies
            .filter((m) =>
              m.name.toLowerCase().includes(filters.movieName.toLowerCase())
            )
            .map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
        </select>
      </div>

      {/* Hero */}
      <div className="filter-field">
        <label>Hero</label>
        <input
          type="text"
          name="heroName"
          placeholder="Search hero..."
          value={filters.heroName}
          onChange={handleChange}
        />
        <select name="hero" value={filters.hero} onChange={handleChange}>
          <option value="">-- Select Hero --</option>
          {options.heroes
            .filter((h) =>
              h.name.toLowerCase().includes(filters.heroName.toLowerCase())
            )
            .map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
        </select>
      </div>

      {/* Heroine */}
      <div className="filter-field">
        <label>Heroine</label>
        <input
          type="text"
          name="heroineName"
          placeholder="Search heroine..."
          value={filters.heroineName}
          onChange={handleChange}
        />
        <select name="heroine" value={filters.heroine} onChange={handleChange}>
          <option value="">-- Select Heroine --</option>
          {options.heroines
            .filter((h) =>
              h.name.toLowerCase().includes(filters.heroineName.toLowerCase())
            )
            .map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
        </select>
      </div>

      {/* Singer */}
      <div className="filter-field">
        <label>Singer</label>
        <input
          type="text"
          name="singerName"
          placeholder="Search singer..."
          value={filters.singerName}
          onChange={handleChange}
        />
        <select name="singer" value={filters.singer} onChange={handleChange}>
          <option value="">-- Select Singer --</option>
          {options.singers
            .filter((s) =>
              s.name.toLowerCase().includes(filters.singerName.toLowerCase())
            )
            .map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
        </select>
      </div>

      {/* Release Year */}
      <div className="filter-field">
        <label>Release Year</label>
        <select
          name="releaseYear"
          value={filters.releaseYear}
          onChange={handleChange}
        >
          <option value="">-- Select Year --</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
