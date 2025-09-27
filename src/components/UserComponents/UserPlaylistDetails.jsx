import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPlaylistById } from "../../services/playlistService";
import { fetchSongById } from "../../services/songService/songService";
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

      // Fetch detailed song information
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

  const handlePlayPlaylist = () => {
    if (songsDetails.length > 0) {
      navigate("/player", {
        state: { songs: songsDetails, startIndex: 0 }
      });
    }
  };

  const handleEditPlaylist = () => {
    navigate(`/edit-playlist/${id}`);
  };

  if (loading) return (
    <div className="upd">
      <div className="upd__loading">Loading playlist...</div>
    </div>
  );
  
  if (err) return (
    <div className="upd">
      <div className="upd__error">
        <div className="upd__error-icon">⚠️</div>
        <div className="upd__error-text">Failed to load playlist</div>
        <div className="upd__error-details">{err}</div>
        <button onClick={() => navigate(-1)} className="upd__action-btn upd__action-btn--play">
          Go Back
        </button>
      </div>
    </div>
  );
  
  if (!playlist) return (
    <div className="upd">
      <div className="upd__not-found">
        <div className="upd__not-found-icon">🎵</div>
        <div className="upd__not-found-text">Playlist not found</div>
        <button onClick={() => navigate(-1)} className="upd__action-btn upd__action-btn--play">
          Go Back to Playlists
        </button>
      </div>
    </div>
  );

  return (
    <div className="upd">
      {/* Back Button */}
      <div className="upd__back" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left"></i>
      </div>

      {/* Playlist Header */}
      <div className="upd__header">
        <div className="upd__cover">
          {playlist.coverImage ? (
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="upd__cover-image"
            />
          ) : (
            <div className="upd__cover-placeholder">
              <i className="fa-solid fa-music" style={{fontSize: '3rem', marginBottom: '10px'}}></i>
              <div>No cover</div>
            </div>
          )}
        </div>
        
        <div className="upd__info">
          <h2 className="upd__title">{playlist.name}</h2>
          
          <div className="upd__meta">
            <div className="upd__meta-item">
              <i className="upd__meta-icon fa-solid fa-music"></i>
              <span>{songsDetails.length} songs</span>
            </div>
            <div className="upd__meta-item">
              <i className="upd__meta-icon fa-solid fa-clock"></i>
              <span>{(songsDetails.length * 3.5).toFixed(0)} min approx</span>
            </div>
          </div>

          {playlist.description && (
            <p className="upd__description">{playlist.description}</p>
          )}

          <div className="upd__actions">
            <button 
              className="upd__action-btn upd__action-btn--play"
              onClick={handlePlayPlaylist}
              disabled={songsDetails.length === 0}
            >
              <i className="fa-solid fa-play"></i>
              Play All
            </button>
            
  
          </div>
        </div>
      </div>

      {/* Playlist Songs */}
      <div className="upd__songs">
        <h3 className="upd__songs-title">
          Songs {songsDetails.length > 0 && `(${songsDetails.length})`}
        </h3>
        
        {songsDetails.length === 0 ? (
          <div className="upd__empty-songs">
            <div className="upd__empty-icon">🎵</div>
            <div className="upd__empty-text">No songs in this playlist yet</div>
            <div className="upd__empty-subtext">Add some songs to get started!</div>
          </div>
        ) : (
          <BrowseSongLists songs={songsDetails} />
        )}
      </div>
    </div>
  );
}