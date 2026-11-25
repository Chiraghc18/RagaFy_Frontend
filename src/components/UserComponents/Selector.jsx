// src/components/UserComponents/Selector.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/style/UserPage/Selector.css";

const Selector = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="selector">
      <div className="selector__options">
        <div
          className="selector__option"
          onClick={() => navigate("/search-filter")}
          style={{ opacity: isOnline ? 1 : 0.45 }}
        >
          <i className="fa-solid fa-filter selector__icon"></i>
          <span>Filter</span>
        </div>

        <div
          className="selector__option"
          onClick={() => navigate("/browse")}
          style={{ opacity: isOnline ? 1 : 0.45 }}
        >
          <i className="fa-solid fa-layer-group selector__icon"></i>
          <span>Category</span>
        </div>

        <div
          className="selector__option"
          onClick={() => navigate("/user/playlists")}
          style={{ opacity: isOnline ? 1 : 0.45 }}
        >
          <i className="fa-solid fa-list selector__icon"></i>
          <span>Playlist</span>
        </div>

        <div
          className="selector__option"
          onClick={() => navigate("/downloads")}
          style={{
            outline: !isOnline ? "2px solid #ff9800" : "none",
            borderRadius: "8px",
          }}
        >
          <i className="fa-solid fa-cloud-arrow-down selector__icon"></i>
          <span>Downloads</span>
        </div>
      </div>
    </div>
  );
};

export default Selector;