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

  const pendingItemRef = useRef(null);

  // Read incoming navigation state
  useEffect(() => {
    const navState = location.state;
    if (!navState?.category) return;

    pendingItemRef.current = navState.item || null;
    setCategory(navState.category);
    setSelectedCategoryName(navState.category);

    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]);

  // Fetch items for the selected category
  useEffect(() => {
    if (!category) return;

    const pendingItem = pendingItemRef.current;
    pendingItemRef.current = null;

    fetchCategoryItems(category)
      .then(setItems)
      .catch((err) => console.error(err));

    if (pendingItem) {
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

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setSelectedCategoryName(cat);
  };

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
      {/* Back Button */}
      <div
        className="brc__back"
        onClick={() => {
          if (!category) {
            navigate(-1);
          } else {
            handleBack();
          }
        }}
      >
        <div className="brc__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="brc__back-text">Back</span>
      </div>

      <div className="brc">
        <div className="brc__header">
          {!category && <h1 className="brc__title">Categories</h1>}

          {category && !songs.length && (
            <h2 className="brc__subtitle">
              {selectedCategoryName.charAt(0).toUpperCase() + selectedCategoryName.slice(1)}
            </h2>
          )}

          {songs.length > 0 && (
            <h2 className="brc__subtitle">
              {selectedItemName}
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
              <div className="brc__loading">
                <div className="brc__spinner"></div>
                <p>Loading songs...</p>
              </div>
            ) : (
              <BrowseSongLists songs={songs} photo={selectedItemPhoto} />
            )}
          </>
        )}
      </div>
    </>
  );
}