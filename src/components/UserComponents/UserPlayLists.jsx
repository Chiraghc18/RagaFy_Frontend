import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import "../../assets/style/UserPage/UserPlayList.css";

export default function UserPlaylists() {
  const { playlists, loading, error } = useData();
  const navigate = useNavigate();

  // ✅ Only show the loading state when we truly have no data.
  // If DataContext hydrated cached playlists from localStorage,
  // render them immediately and let the background refresh
  // silently replace them when it finishes.
  if (loading && playlists.length === 0) {
    return (
      <div className="upl">
        <div className="upl__loading">Loading playlists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upl">
        <div className="upl__error">
          <div className="upl__error-icon">⚠️</div>
          <div className="upl__error-text">Error loading playlists</div>
          <div className="upl__error-details">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="upl">
      <div className="upl-back-btn" onClick={() => navigate(-1)}>
        <div className="upl-back-btn__icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="upl-back-btn__text">Back</span>
      </div>

      <h2 className="upl__title">Playlists</h2>

      {playlists.length === 0 ? (
        <p className="upl__empty">No playlists found.</p>
      ) : (
        <div className="upl__grid">
          {[...playlists]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((pl) => (
              <Link
                key={pl._id}
                to={`/user-playlists/${pl._id}`}
                className="upl__card"
              >
                <div className="upl__cover">
                  {pl.coverImage ? (
                    <img
                      src={pl.coverImage}
                      alt={pl.name}
                      className="upl__image"
                    />
                  ) : (
                    <div className="upl__cover-placeholder">
                      <i className="fa-solid fa-music"></i>
                      <span>No cover</span>
                    </div>
                  )}
                </div>
                <div className="upl__name">{pl.name}</div>
                <div className="upl__count">
                  {pl.songs?.length || 0} song
                  {pl.songs?.length === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}