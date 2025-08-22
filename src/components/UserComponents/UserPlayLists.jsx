import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlaylists } from "../../services/playlistService";

import "../../assets/style/UserPage/UserPlayList.css"

export default function UserPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const res = await fetchPlaylists();
      setPlaylists(res.data);
    } catch (e) {
      console.error("fetch playlists error:", e.response?.data || e.message);
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  if (loading) return <div>Loading playlists...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div className="user-playlists">
      <h2>Playlists</h2>
      {playlists.length === 0 ? (
        <p>No playlists found.</p>
      ) : (
        <div className="playlist-grid">
          {playlists.map((pl) => (
            <Link key={pl._id} to={`/user-playlists/${pl._id}`} className="playlist-card">
              <div className="playlist-cover">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="playlist-image" />
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
      )}
    </div>
  );
}
