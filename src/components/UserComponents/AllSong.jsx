// src/components/AllSongs.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import fetchSongs from "../../services/songService/fetchSongs";
import { fetchPlaylists } from "../../services/playlistService";
import "../../assets/style/UserPage/AllSongs.css";
import { useNavigate, Link } from "react-router-dom";

export default function AllSongs() {
  const [songs, setSongs] = useState([]);
  const [photos, setPhotos] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [plRes, songRes] = await Promise.allSettled([
          fetchPlaylists(),
          fetchSongs(),
        ]);

        if (plRes.status === "fulfilled") {
          setPlaylists(plRes.value.data || []);
        }

        if (songRes.status === "fulfilled") {
          const songData = songRes.value.data || [];
          setSongs(songData);

          // Fetch photos asynchronously
          songData.forEach(async (song) => {
            try {
              const res = await axios.get(
                `https://ragafy-backend.onrender.com/songs/${song._id}/photo`
              );
              setPhotos((prev) => ({ ...prev, [song._id]: res.data.url }));
            } catch {
              setPhotos((prev) => ({ ...prev, [song._id]: null }));
            }
          });
        } else {
          setErr(songRes.reason.message || "Failed to fetch songs");
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
                      {song.singers?.map((s) => s.name).join(", ") || "Unknown Artist"} 
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
