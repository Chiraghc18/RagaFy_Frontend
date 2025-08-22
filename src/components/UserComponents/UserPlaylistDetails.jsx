import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPlaylistById } from "../../services/playlistService";
import { fetchSongById } from "../../services/songService/songService";
// import "../../assets/style/UserPlaylistDetails.css";

import BrowseSongLists from "../BrowseSongLists";

export default function UserPlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [songsDetails, setSongsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const res = await fetchPlaylistById(id);
      setPlaylist(res.data);

      const songDetails = await Promise.all(
        res.data.songs.map((s) =>
          fetchSongById(s._id).then((res) => res.data)
        )
      );
      setSongsDetails(songDetails);
    } catch (e) {
      console.error("fetch playlist error:", e.response?.data || e.message);
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  if (loading) return <div className="loading">Loading playlist...</div>;
  if (err) return <div className="error">Error: {err}</div>;
  if (!playlist) return <div className="not-found">Playlist not found.</div>;

  return (
    <div className="playlist-details">
      {/* Back Button */}
      <div className="back" onClick={() => navigate(-1)}>
         <i className="fa-solid fa-arrow-left"></i>
      </div>

      {/* Playlist Header */}
        <div className="playlist-header">
            <div className="playlist-cover">
            {playlist.coverImage ? (
                <img src={playlist.coverImage} alt={playlist.name} className="playlist-cover-image"/>
            ) : (
                <div className="cover-placeholder">No cover</div>
            )}
            </div>
            <div className="playlist-info">
            <h2>{playlist.name}</h2>
            </div>
        </div>

      {/* Playlist Songs */}
      <div className="songs-list">
        <h3 className="songs-list-title">Songs</h3>
        <BrowseSongLists songs={songsDetails} />
      </div>
    </div>
  );
}
