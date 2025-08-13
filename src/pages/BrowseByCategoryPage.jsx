// src/pages/BrowseByCategoryPage.jsx
import React, { useState, useEffect } from "react";
import { categoryApiMap, fetchCategoryItems, fetchSongsByCategory } from "../services/songService/browseService";
import CategorySelector from "../components/CategorySelector";
import CategoryItems from "../components/CategoryItems";
import BrowseSongLists from "../components/BrowseSongLists";

import "../assets/style/BrowseByCategoryPage.css"; // Import the CSS for styling
export default function BrowseByCategoryPage() {
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all items for the selected category
  useEffect(() => {
    if (!category) return;
    setSongs([]); // clear songs
    fetchCategoryItems(category)
      .then(setItems)
      .catch((err) => console.error(err));
  }, [category]);

  // Fetch songs under selected item
  const handleItemClick = async (itemId) => {
    setLoading(true);
    try {
      const data = await fetchSongsByCategory(category, itemId);
      setSongs(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="browse-page">
      <h1 className="browse-title">Browse Songs by Category</h1>

      <CategorySelector
        category={category}
        setCategory={setCategory}
        categories={categoryApiMap}
      />

      {category && items.length > 0 && (
        <CategoryItems items={items} onSelect={handleItemClick} />
      )}

      {loading && <p className="loading-text">Loading songs...</p>}
      {songs.length > 0 && <BrowseSongLists songs={songs} />}
    </div>
  );
}
