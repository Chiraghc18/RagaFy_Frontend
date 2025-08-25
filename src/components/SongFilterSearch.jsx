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

      {/* Genre dropdown + search */}
      <div className="filter-field">
        <label>Genre</label>
        <select name="genre" value={filters.genre} onChange={handleChange}>
          <option value="">-- Select Genre --</option>
          {options.genres.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="genreName"
          placeholder="Search genre by name..."
          value={filters.genreName}
          onChange={handleChange}
        />
      </div>

      {/* Subgenre dropdown + search */}
      <div className="filter-field">
        <label>Subgenre</label>
        <select name="subgenre" value={filters.subgenre} onChange={handleChange}>
          <option value="">-- Select Subgenre --</option>
          {options.subgenres?.map((sg) => (
            <option key={sg._id} value={sg._id}>
              {sg.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="subgenreName"
          placeholder="Search subgenre by name..."
          value={filters.subgenreName}
          onChange={handleChange}
        />
      </div>

      {/* Language dropdown + search */}
      <div className="filter-field">
        <label>Language</label>
        <select name="language" value={filters.language} onChange={handleChange}>
          <option value="">-- Select Language --</option>
          {options.languages.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="languageName"
          placeholder="Search language by name..."
          value={filters.languageName}
          onChange={handleChange}
        />
      </div>

      {/* Artist */}
      <div className="filter-item">
        <label className="filter-label">Artist</label>
        <select
          name="artist"
          value={filters.artist}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Select Artist --</option>
          {options.artists.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="artistName"
          value={filters.artistName}
          onChange={handleChange}
          className="filter-input"
          placeholder="Search artist by name..."
        />
      </div>

      {/* Album */}
      <div className="filter-item">
        <label className="filter-label">Album</label>
        <select
          name="album"
          value={filters.album}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Select Album --</option>
          {options.albums.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="albumName"
          value={filters.albumName}
          onChange={handleChange}
          className="filter-input"
          placeholder="Search album by name..."
        />
      </div>

      {/* Movie */}
      <div className="filter-item">
        <label className="filter-label">Movie</label>
        <select
          name="movie"
          value={filters.movie}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Select Movie --</option>
          {options.movies.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="movieName"
          value={filters.movieName}
          onChange={handleChange}
          className="filter-input"
          placeholder="Search movie by name..."
        />
      </div>

      {/* Hero */}
      <div className="filter-item">
        <label className="filter-label">Hero</label>
        <select
          name="hero"
          value={filters.hero}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Select Hero --</option>
          {options.heroes.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="heroName"
          value={filters.heroName}
          onChange={handleChange}
          className="filter-input"
          placeholder="Search hero by name..."
        />
      </div>

      {/* Heroine */}
      <div className="filter-item">
        <label className="filter-label">Heroine</label>
        <select
          name="heroine"
          value={filters.heroine}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Select Heroine --</option>
          {options.heroines.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="heroineName"
          value={filters.heroineName}
          onChange={handleChange}
          className="filter-input"
          placeholder="Search heroine by name..."
        />
      </div>

      {/* Singer */}
      <div className="filter-item">
        <label className="filter-label">Singer</label>
        <select
          name="singer"
          value={filters.singer}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Select Singer --</option>
          {options.singers.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="singerName"
          value={filters.singerName}
          onChange={handleChange}
          className="filter-input"
          placeholder="Search singer by name..."
        />
      </div>

      {/* Release Year */}
      <div className="filter-item">
        <label className="filter-label">Release Year</label>
        <select
          name="releaseYear"
          value={filters.releaseYear}
          onChange={handleChange}
          className="filter-select"
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
