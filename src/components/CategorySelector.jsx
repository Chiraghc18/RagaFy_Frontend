import React from "react";

export default function CategorySelector({ category, setCategory, categories }) {
  return (
    <div className="category-selector">
      {Object.keys(categories).map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`category-button ${category === cat ? "active" : ""}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
