// src/components/SongFilterSearch.jsx
import React from "react";

export default function SongFilterSearch({ filters, options, handleChange }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {Object.entries(filters).map(([key, value]) => (
        <div key={key}>
          <label className="block capitalize mb-1">{key}</label>
          <select
            name={key}
            value={value}
            onChange={handleChange}
            className="w-full border p-2 rounded"
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
