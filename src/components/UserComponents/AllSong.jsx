import React from "react"; // Removed useState, useEffect
import { useData } from "../../context/DataContext"; // <-- IMPORT
import "../../assets/style/UserPage/AllSongs.css";
import { useNavigate, Link } from "react-router-dom";
// Removed axios, fetchSongs, fetchPlaylists

export default function AllSongs() {
  // Get all data from the global context
  const { songs, photos, playlists, loading, err } = useData();
  const navigate = useNavigate();

  // ALL of the useEffect and loadData functions are GONE.

  const handleSongClick = (song) => {
    const filteredSameCategory = songs.filter(
      (s) =>
        s.genre?._id === song.genre?._id &&
        s.language?._id === song.language?._id
    );

    const startIndex = filteredSameCategory.findIndex((s) => s._id === song._id);

    navigate("/player", {
      state: { songs: filteredSameCategory, startIndex },
    });
  };

  if (loading)
    return (
      <div className="all-songs-page">
        <div className="all-songs__loading">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="all-songs__skeleton-card">
              <div className="all-songs__skeleton-content">
                <div className="all-songs__skeleton-image"></div>
                <div className="all-songs__skeleton-text">
                  <div className="all-songs__skeleton-line"></div>
                  <div className="all-songs__skeleton-line all-songs__skeleton-line--short"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (err)
    return (
      <div className="all-songs-page">
        <div className="all-songs__error">
          <div className="all-songs__error-icon">⚠️</div>
          <h3 className="all-songs__error-title">Something went wrong</h3>
          <p className="all-songs__error-message">{err}</p>
        </div>
      </div>
    );

  return (
    <div className="all-songs-page">
      {/* Playlists Section */}
      {playlists.length > 0 && (
        <div className="all-songs__playlists">
          <h2 className="all-songs__section-title">Featured Playlists</h2>
          <div className="all-songs__playlist-container">
            {playlists.map((pl) => (
              <Link
                key={pl._id}
                to={`/user-playlists/${pl._id}`}
                className="all-songs__playlist-card"
              >
                <div className="all-songs__playlist-cover">
                  {pl.coverImage ? (
                    <img
                      src={pl.coverImage}
                      alt={pl.name}
                      className="all-songs__playlist-image"
                    />
                  ) : (
                    <div className="all-songs__playlist-placeholder">🎵</div>
                  )}
                </div>
                <div className="all-songs__playlist-name">{pl.name}</div>
                <div className="all-songs__playlist-count">
                  {pl.songs?.length || 0} songs
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Songs Section */}
      <div className="all-songs__songs">
        <h2 className="all-songs__section-title">All Songs</h2>
        <div className="all-songs__grid">
          {songs.length > 0 ? (
            songs.map((song) => (
              <div
                key={song._id}
                className="all-songs__card"
                onClick={() => handleSongClick(song)}
              >
                <div className="all-songs__card-content">
                  {/* This now reads from the global photo map */}
                  {photos[song._id] ? (
                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="all-songs__image"
                    />
                  ) : (
                    <div className="all-songs__image all-songs__image--placeholder">
                      🎵
                    </div>
                  )}
                  <div className="all-songs__info">
                    <div className="all-songs__title">{song.title}</div>
                    <div className="all-songs__meta">
                      {song.singers?.map((s) => s.name).join(", ") ||
                        "Unknown Artist"}
                    </div>
                  </div>
                  <div className="all-songs__play-icon">▶</div>
                </div>
              </div>
            ))
          ) : (
            <div className="all-songs__empty">
              <div className="all-songs__empty-icon">🎵</div>
              <p className="all-songs__empty-text">No songs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}