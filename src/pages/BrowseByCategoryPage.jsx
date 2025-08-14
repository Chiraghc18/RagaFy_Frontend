import React, { useState, useEffect } from "react";
import { categoryApiMap, fetchCategoryItems, fetchSongsByCategory } from "../services/songService/browseService";
import CategorySelector from "../components/CategorySelector";
import CategoryItems from "../components/CategoryItems";
import BrowseSongLists from "../components/BrowseSongLists";
import "../assets/style/BrowseByCategoryPage.css";

export default function BrowseByCategoryPage() {
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");

  // Fetch all items for the selected category
  useEffect(() => {
    if (!category) return;
    setSongs([]);
    setSelectedItemName("");
    fetchCategoryItems(category)
      .then(setItems)
      .catch((err) => console.error(err));
  }, [category]);

  // Handle category selection
  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setSelectedCategoryName(cat);
  };

  // Fetch songs under selected item
  const handleItemClick = async (item) => {
    setLoading(true);
    try {
      const data = await fetchSongsByCategory(category, item._id);
      setSongs(data);
      setSelectedItemName(item.name || item.title || "Selected Item");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Back button functionality
  const handleBack = () => {
    if (songs.length > 0) {
      // From songs → go back to category items
      setSongs([]);
      setSelectedItemName("");
    } else {
      // From category items → go back to category selector
      setCategory("");
      setSelectedCategoryName("");
    }
  };

  return (
  <div className="browse-page">
    <div className="browse-title-container">
      {/* Show main title only if no category is selected */}
      {!category && (
        <h1 className="title">Category</h1>
      )}

      {/* Back button if not at the top level */}
    {(category || songs.length > 0) && (
      <button className="back-btn" onClick={handleBack}>
        ⬅ Back
      </button>
    )}

    {/* Selected category name (when category chosen, no song list yet) */}
    {category && !songs.length && (
      <h2 className="title">{selectedCategoryName.charAt(0).toUpperCase() + selectedCategoryName.slice(1)}</h2>
    )}

    {songs.length > 0 && (
      <h2 className="title">
        {selectedItemName.charAt(0).toUpperCase() + selectedItemName.slice(1)}
      </h2>
    )}

    </div>

    {/* Category selector */}
    {!category && (
      <CategorySelector
        category={category}
        setCategory={handleCategorySelect}
        categories={categoryApiMap}
      />
    )}

    {/* Show category items */}
    {category && !songs.length && items.length > 0 && (
      <CategoryItems items={items} onSelect={handleItemClick} />
    )}

    {/* Song list */}
    {songs.length > 0 && (
      <>
        {loading ? (
          <p className="loading-text">Loading songs...</p>
        ) : ( 
          <BrowseSongLists songs={songs} />

        )}
      </>
    )}
  </div>
);

}
