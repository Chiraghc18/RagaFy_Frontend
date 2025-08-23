// src/components/AllSongs.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import fetchSongs from "../../services/songService/fetchSongs";
import { fetchPlaylists } from "../../services/playlistService";
import "../../assets/style/UserPage/AllSongs.css";
import { Link, useNavigate } from "react-router-dom";

export default function AllSongs() {
  const [songs, setSongs] = useState([]);
  const [photos, setPhotos] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  // Inside AllSongs.jsx useEffect
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch songs & playlists in parallel
      const [plRes, songRes] = await Promise.allSettled([
        fetchPlaylists(),
        fetchSongs(),
      ]);

      // ✅ Handle playlists separately
      if (plRes.status === "fulfilled") {
        setPlaylists(plRes.value.data || []);
      } else {
        console.warn("Playlist fetch failed:", plRes.reason);
      }

      // ✅ Handle songs immediately
      if (songRes.status === "fulfilled") {
        const songData = songRes.value.data || [];
        setSongs(songData);

        // Fetch photos in background (non-blocking)
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
    const filteredSameCategory = songs.filter(
      (s) =>
        s.genre?._id === song.genre?._id &&
        s.language?._id === song.language?._id
    );

    const startIndex = filteredSameCategory.findIndex(
      (s) => s._id === song._id
    );

    navigate("/player", {
      state: { songs: filteredSameCategory, startIndex },
    });
  };

  if (loading) return <div>Loading...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div className="all-songs-page">
      {/* --- Show First Two Playlists --- */}
      {playlists.length > 0 && (
        <div className="user-playlists">
          <h2>Top Playlists</h2>
          <div className="playlist-grid">
            {playlists.slice(0, 2).map((pl) => (
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
                    <div className="playlist-cover-placeholder">No cover</div>
                  )}
                </div>
                <div className="playlist-name">{pl.name}</div>
                <div className="playlist-count">
                  {pl.songs?.length || 0} song{pl.songs?.length === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- Show All Songs --- */}
      <div className="all-songs">
        <h2>All Songs</h2>
        <div className="head-search_results">
          {songs.length > 0 ? (
            songs.map((song) => (
              <div
                key={song._id}
                className="song-item"
                onClick={() => handleSongClick(song)}
              >
                {photos[song._id] && (
                  <img
                    src={photos[song._id]}
                    alt={song.title}
                    className="song-item-image"
                  />
                )}
                <span>{song.title}</span>
              </div>
            ))
          ) : (
            <p>No songs available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
