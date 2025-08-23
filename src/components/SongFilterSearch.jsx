import React from "react";

export default function SongFilterSearch({ filters, options, handleChange }) {
  // Generate a list of years (last 30 years)
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="song-filter-grid">
      {/* Loop through filters except releaseYear */}
      {Object.entries(filters).map(([key, value]) =>
        key !== "releaseYear" ? (
          <div key={key} className="filter-item">
            <label className="filter-label">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="filter-select"
            >
              <option value="">-- Select --</option>
              {options[`${key}s`] &&
                options[`${key}s`].map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>
        ) : null
      )}

      {/* ✅ Release Year Dropdown */}
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
