import React from "react";

export default function SongFilterSearch({ filters, options, handleChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  return (
    <div className="sfs-filter">
      {/* Song Title */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">Song Title</label>
        <div className="sfs-filter__search-wrapper">
          <input
            type="text"
            name="name"
            placeholder="Enter song title..."
            value={filters.name || ""}
            onChange={handleChange}
            className="sfs-filter__input"
          />
          <i className="sfs-filter__search-icon fa-solid fa-music"></i>
        </div>
      </div>

      {/* Genre */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">Genre</label>
        <input
          type="text"
          name="genreName"
          placeholder="Search genre..."
          value={filters.genreName || ""}
          onChange={handleChange}
          className="sfs-filter__input"
        />
        <div className="sfs-filter__select-wrapper">
          <select
            name="genre"
            value={filters.genre || ""}
            onChange={handleChange}
            className="sfs-filter__select"
          >
            <option value="">-- Select Genre --</option>
            {(options.genres || [])
              .filter((g) =>
                g.name.toLowerCase().includes((filters.genreName || "").toLowerCase())
              )
              .map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Language */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">Language</label>
        <input
          type="text"
          name="languageName"
          placeholder="Search language..."
          value={filters.languageName || ""}
          onChange={handleChange}
          className="sfs-filter__input"
        />
        <div className="sfs-filter__select-wrapper">
          <select
            name="language"
            value={filters.language || ""}
            onChange={handleChange}
            className="sfs-filter__select"
          >
            <option value="">-- Select Language --</option>
            {(options.languages || [])
              .filter((l) =>
                l.name.toLowerCase().includes((filters.languageName || "").toLowerCase())
              )
              .map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Singer */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">Singer</label>
        <input
          type="text"
          name="singerName"
          placeholder="Search singer..."
          value={filters.singerName || ""}
          onChange={handleChange}
          className="sfs-filter__input"
        />
        <div className="sfs-filter__select-wrapper">
          <select
            name="singer"
            value={filters.singer || ""}
            onChange={handleChange}
            className="sfs-filter__select"
          >
            <option value="">-- Select Singer --</option>
            {(options.singers || [])
              .filter((s) =>
                s.name.toLowerCase().includes((filters.singerName || "").toLowerCase())
              )
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Release Year */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">Release Year</label>
        <div className="sfs-filter__select-wrapper">
          <select
            name="releaseYear"
            value={filters.releaseYear || ""}
            onChange={handleChange}
            className="sfs-filter__select"
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
    </div>
  );
}
