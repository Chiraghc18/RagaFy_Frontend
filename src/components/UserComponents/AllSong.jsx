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

  // Handle clicking a song
  const handleSongClick = (song) => {
    // Filter songs by same genre & language
    const filteredSameCategory = songs.filter(
      (s) =>
        s.genre?._id === song.genre?._id &&
        s.language?._id === song.language?._id
    );

    const startIndex = filteredSameCategory.findIndex((s) => s._id === song._id);

    // Navigate normally with state
    navigate("/player", {
      state: { songs: filteredSameCategory, startIndex },
    });
  };

  if (loading)
    return (
      <div className="all-songs-page">
        <div className="loading-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-content">
                <div className="skeleton-image"></div>
                <div className="skeleton-text">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
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
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>{err}</p>
        </div>
      </div>
    );

  return (
    <div className="all-songs-page">
      {/* Playlists Section */}
      {playlists.length > 0 && (
        <div className="user-playlists">
          <h2>Featured Playlists</h2>
          <div className="playlist-scroll-container">
            {playlists.map((pl) => (
              <Link
                key={pl._id}
                to={`/user-playlists/${pl._id}`}
                className="playlist-card"
              >
                <div className="playlist-cover">
                  {pl.coverImage ? (
                    <img
                      src={pl.coverImage}
                      alt={pl.name}
                      className="playlist-image"
                    />
                  ) : (
                    <div className="playlist-cover-placeholder">🎵</div>
                  )}
                </div>
                <div className="playlist-name">{pl.name}</div>
                <div className="playlist-count">{pl.songs?.length || 0} songs</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Songs Section */}
      <div className="all-songs">
        <h2>All Songs</h2>
        <div className="songs-masonry-grid">
          {songs.length > 0 ? (
            songs.map((song) => (
              <div
                key={song._id}
                className="song-card"
                onClick={() => handleSongClick(song)}
              >
                <div className="song-card-content">
                  {photos[song._id] ? (
                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="song-item-image"
                    />
                  ) : (
                    <div
                      className="song-item-image"
                      style={{
                        background: "linear-gradient(135deg, #ffa50033, #1e90ff33)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "24px",
                      }}
                    >
                      🎵
                    </div>
                  )}
                  <div className="song-info">
                    <div className="song-title">{song.title}</div>
                    <div className="song-meta">
                      {song.artist?.name || "Unknown Artist"}
                    </div>
                  </div>
                  <div className="play-icon">▶</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <p>No songs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
