import React, { useState, useEffect, useRef } from "react";
import { categoryApiMap, fetchCategoryItems, fetchSongsByCategory } from "../services/songService/browseService";
import CategorySelector from "../components/CategorySelector";
import CategoryItems from "../components/CategoryItems";
import BrowseSongLists from "../components/BrowseSongLists";
import "../assets/style/BrowseByCategoryPage.css";
import { useNavigate, useLocation } from 'react-router-dom';

export default function BrowseByCategoryPage() {
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedItemPhoto, setSelectedItemPhoto] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Holds an item passed in via navigation state, consumed by the
  // category-items effect below so we can jump straight to its songs.
  const pendingItemRef = useRef(null);

  // ── Read incoming navigation state (from AllSongs rails / "See all") ──
  useEffect(() => {
    const navState = location.state;
    if (!navState?.category) return;

    pendingItemRef.current = navState.item || null;
    setCategory(navState.category);
    setSelectedCategoryName(navState.category);

    // Clear the nav state so refresh/back doesn't re-trigger this
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]);

  // ── Fetch items for the selected category ──
  useEffect(() => {
    if (!category) return;

    const pendingItem = pendingItemRef.current;
    pendingItemRef.current = null; // consume once

    // Always fetch the items grid too, so the back button still works
    fetchCategoryItems(category)
      .then(setItems)
      .catch((err) => console.error(err));

    if (pendingItem) {
      // Jump straight to this item's songs instead of resetting to the grid
      setLoading(true);
      fetchSongsByCategory(category, pendingItem._id)
        .then((data) => {
          setSongs(data);
          setSelectedItemName(pendingItem.name || pendingItem.title || "Selected Item");
          setSelectedItemPhoto(pendingItem.photo || pendingItem.imageUrl || "");
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
      return;
    }

    setSongs([]);
    setSelectedItemName("");
    setSelectedItemPhoto("");
  }, [category]);

  // Handle category selection (manual tile click — unchanged)
  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setSelectedCategoryName(cat);
  };

  // Fetch songs under selected item (manual item click — unchanged)
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

  // Back button functionality (unchanged)
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
    <>
      <div
        className="browse__back"
        onClick={() => {
          if (!category) {
            navigate(-1);
          } else {
            handleBack();
          }
        }}
      >
        <i className="browse__back-icon fa-solid fa-arrow-left"></i>
      </div>

      <div className="browse__page">
        <div className="browse__header">
          {!category && <h1 className="browse__title">Category</h1>}

          {category && !songs.length && (
            <h2 className="browse__subtitle">
              {selectedCategoryName.charAt(0).toUpperCase() + selectedCategoryName.slice(1)}
            </h2>
          )}

          {songs.length > 0 && (
            <h2 className="browse__subtitle">
              {selectedItemName.charAt(0).toUpperCase() + selectedItemName.slice(1)}
            </h2>
          )}
        </div>

        {!category && (
          <CategorySelector
            category={category}
            setCategory={handleCategorySelect}
            categories={categoryApiMap}
            className="browse__category-selector"
          />
        )}

        {category && !songs.length && items.length > 0 && (
          <CategoryItems items={items} onSelect={handleItemClick} className="browse__category-items" />
        )}

        {songs.length > 0 && (
          <>
            {loading ? (
              <p className="browse__loading-text">Loading songs...</p>
            ) : (
              <BrowseSongLists songs={songs} photo={selectedItemPhoto} className="browse__song-lists" />
            )}
          </>
        )}
      </div>
    </>
  );
}