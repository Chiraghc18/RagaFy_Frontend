import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlaylists } from "../../services/playlistService";

import "../../assets/style/UserPage/UserPlayList.css";

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

  if (loading) return <div className="upl__loading">Loading playlists...</div>;
  if (err) return <div className="upl__error">Error: {err}</div>;

  return (
    
    <div className="upl">
      <h2 className="upl__title">Playlists</h2>
      {playlists.length === 0 ? (
        <p className="upl__empty">No playlists found.</p>
      ) : (
        <div className="upl__grid">
          {playlists.map((pl) => (
            <Link key={pl._id} to={`/user-playlists/${pl._id}`} className="upl__card">
              <div className="upl__cover">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="upl__image" />
                ) : (
                  <div className="upl__cover-placeholder">No cover</div>
                )}
              </div>
              <div className="upl__name">{pl.name}</div>
              <div className="upl__count">
                {pl.songs?.length || 0} song{pl.songs?.length === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
