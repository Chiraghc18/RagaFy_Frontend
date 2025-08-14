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
  const [selectedItemPhoto, setSelectedItemPhoto] = useState("");

  // Fetch all items for the selected category
  useEffect(() => {
    if (!category) return;
    setSongs([]);
    setSelectedItemName("");
    setSelectedItemPhoto("");
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
      setSelectedItemPhoto(item.photo || item.imageUrl || "");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Back button functionality
  const handleBack = () => {
    if (songs.length > 0) {
      setSongs([]);
      setSelectedItemName("");
      setSelectedItemPhoto("");
    } else {
      setCategory("");
      setSelectedCategoryName("");
    }
  };

  return (
    <div className="browse-page">
      <div className="browse-title-container">
        {!category && <h1 className="title">Category</h1>}

        {(category || songs.length > 0) && (
          <button className="back-btn" onClick={handleBack}>
            ⬅ Back
          </button>
        )}

        {category && !songs.length && (
          <h2 className="title">
            {selectedCategoryName.charAt(0).toUpperCase() + selectedCategoryName.slice(1)}
          </h2>
        )}

        {songs.length > 0 && (
          <h2 className="title">
            {selectedItemName.charAt(0).toUpperCase() + selectedItemName.slice(1)}
          </h2>
        )}
      </div>

      {!category && (
        <CategorySelector
          category={category}
          setCategory={handleCategorySelect}
          categories={categoryApiMap}
        />
      )}

      {category && !songs.length && items.length > 0 && (
        <CategoryItems items={items} onSelect={handleItemClick} />
      )}

      {songs.length > 0 && (
        <>
          {loading ? (
            <p className="loading-text">Loading songs...</p>
          ) : (
            <BrowseSongLists songs={songs} photo={selectedItemPhoto} />
          )}
        </>
      )}
    </div>
  );
}
