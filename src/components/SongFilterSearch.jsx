import React from "react";
// import "./SongFilterSearch.css";

export default function SongFilterSearch({ filters, options, handleChange }) {
  return (
    <div className="song-filter-grid">
      {Object.entries(filters).map(([key, value]) => (
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
      ))}
    </div>
  );
}