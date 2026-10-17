import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import BrowseSongLists from "../BrowseSongLists";
import "../../assets/style/UserPage/UserPlayList.css";

export default function UserPlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs: allSongs, playlists, loading: dataLoading } = useData();

  // ✅ Derive everything from context — no network, no spinner.
  // The moment this component mounts, the data is already in memory.
  const playlist = useMemo(
    () => playlists.find((pl) => pl._id === id) || null,
    [playlists, id]
  );

  const songsDetails = useMemo(() => {
    if (!playlist || !allSongs.length) return [];
    const ids = new Set(
      (playlist.songs || []).map((s) => s._id)
    );
    return allSongs.filter((song) => ids.has(song._id));
  }, [playlist, allSongs]);

  const handlePlayPlaylist = () => {
    if (songsDetails.length > 0) {
      navigate("/player", {
        state: { songs: songsDetails, startIndex: 0 },
      });
    }
  };

  // Only wait for the global context — and only on a cold navigation
  // where localStorage didn't have cached data.
  if (dataLoading && playlists.length === 0) {
    return (
      <div className="upd">
        <div className="upd-back-btn" onClick={() => navigate(-1)}>
          <div className="upd-back-btn__icon">
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <span className="upd-back-btn__text">Back</span>
        </div>
        <div className="upd__loading">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="upd">
        <div className="upd-back-btn" onClick={() => navigate(-1)}>
          <div className="upd-back-btn__icon">
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <span className="upd-back-btn__text">Back</span>
        </div>
        <div className="upd__not-found">
          <div className="upd__not-found-icon">🎵</div>
          <div className="upd__not-found-text">Playlist not found</div>
          <button
            onClick={() => navigate(-1)}
            className="upd__action-btn upd__action-btn--play"
          >
            Go Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upd">
      <div className="upd-back-btn" onClick={() => navigate(-1)}>
        <div className="upd-back-btn__icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="upd-back-btn__text">Back</span>
      </div>

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
              <i
                className="fa-solid fa-music"
                style={{ fontSize: "3rem", marginBottom: "10px" }}
              ></i>
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
              <span>
                {(songsDetails.length * 3.5).toFixed(0)} min approx
              </span>
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

      <div className="upd__songs">
        <h3 className="upd__songs-title">
          Songs {songsDetails.length > 0 && `(${songsDetails.length})`}
        </h3>

        {songsDetails.length === 0 ? (
          <div className="upd__empty-songs">
            <div className="upd__empty-icon">🎵</div>
            <div className="upd__empty-text">
              No songs in this playlist yet
            </div>
          </div>
        ) : (
          <BrowseSongLists songs={songsDetails} />
        )}
      </div>
    </div>
  );
}