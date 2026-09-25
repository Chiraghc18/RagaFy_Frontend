import { useState } from "react";

export default function CategoryItems({ items, onSelect, sortBy = "alpha" }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get display name for any item shape
  const getItemName = (item) => item.name || item.title || "";

  // Strip leading "The", "A", "An" for better alphabetical sorting
  const getSortKey = (item) =>
    getItemName(item)
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, "");

  // Get a date value from various possible fields
  const getDateValue = (item) => {
    const raw =
      item.releaseDate ||
      item.release_year ||
      item.year ||
      item.createdAt ||
      item.updatedAt ||
      item.date;
    const time = raw ? new Date(raw).getTime() : 0;
    return isNaN(time) ? 0 : time;
  };

  // Get popularity value from various possible fields
  const getPopularity = (item) =>
    item.plays ||
    item.playCount ||
    item.views ||
    item.likes ||
    item.popularity ||
    0;

  // Apply the right sort strategy
  const sortedItems =
    sortBy === "none"
      ? items
      : [...items].sort((a, b) => {
          switch (sortBy) {
            case "latest":
              return getDateValue(b) - getDateValue(a); // newest first
            case "popular":
              return getPopularity(b) - getPopularity(a); // most popular first
            case "alpha":
            default:
              return getSortKey(a).localeCompare(getSortKey(b));
          }
        });

  // Filter by search query
  const filteredItems = sortedItems.filter((item) =>
    getItemName(item).toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="ci-wrapper">
      {/* ===== SEARCH BAR ===== */}
      <div className="ci-search">
        <i className="fa-solid fa-magnifying-glass ci-search__icon"></i>
        <input
          type="text"
          className="ci-search__input"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="ci-search__clear"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* ===== ITEMS GRID ===== */}
      {filteredItems.length > 0 ? (
        <div className="ci-grid">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              onClick={() => onSelect(item)}
              className="ci-card"
            >
              <img
                src={item.photo || item.imageUrl}
                alt={getItemName(item)}
                className="ci-card__img"
              />
              <span className="ci-card__name">{getItemName(item)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ci-empty">
          <i className="fa-solid fa-magnifying-glass"></i>
          <p>No results found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}