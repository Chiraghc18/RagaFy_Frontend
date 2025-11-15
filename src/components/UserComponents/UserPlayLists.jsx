import React from "react"; // Removed useEffect, useState
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
// import { fetchPlaylists } from "../../services/playlistService"; // Removed
import { useData } from "../../context/DataContext"; // <-- IMPORT
import "../../assets/style/UserPage/UserPlayList.css";

export default function UserPlaylists() {
  // Get playlists, loading state, and errors from global context
  const { playlists, loading, err } = useData();
  const navigate = useNavigate(); // For the back button

  // The local loadPlaylists function and useEffect are GONE.

  if (loading) return <div className="upl__loading">Loading playlists...</div>;
  if (err) return <div className="upl__error">Error: {err}</div>;

  return (
    <div className="upl">
      {/* --- ADDED BACK BUTTON --- */}
      <div className="upl__back" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left"></i>
      </div>
      {/* ------------------------- */}
      
      <h2 className="upl__title">Playlists</h2>
      {playlists.length === 0 ? (
        <p className="upl__empty">No playlists found.</p>
      ) : (
        <div className="upl__grid">
          {playlists.map((pl) => (
            <Link
              key={pl._id}
              to={`/user-playlists/${pl._id}`}
              className="upl__card"
            >
              <div className="upl__cover">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="upl__image" />
                ) : (
                  <div className="upl__cover-placeholder">No cover</div>
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
  )
}