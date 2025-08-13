// src/components/CategoryItems.jsx
import React from "react";

export default function CategoryItems({ items, onSelect }) {
  return (
    <div className="category-items">
      {items.map((item) => (
        <button
          key={item._id}
          onClick={() => onSelect(item._id)}
          className="category-item-button"
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
