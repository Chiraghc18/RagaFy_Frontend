import React from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import { buildRadioQueue } from "../../services/songService/buildRadio";
import "../../assets/style/UserPage/AllSongs.css";
import { useNavigate } from "react-router-dom";

export default function AllSongs() {
  const { songs, photos, loading, error } = useData();
  const { playPlaylist } = useGlobalPlayer();
  const navigate = useNavigate();

  const handleSongClick = (song) => {
    const filteredSameCategory = songs.filter(
      (s) =>
        s.genre?._id === song.genre?._id &&
        s.language?._id === song.language?._id
    );
    const startIndex = filteredSameCategory.findIndex((s) => s._id === song._id);
    navigate("/player", { state: { songs: filteredSameCategory, startIndex } });
  };

  // Build a scored "radio" queue seeded from the clicked song
  const handleStartRadio = (seedSong, e) => {
    e.stopPropagation();
    const radioQueue = buildRadioQueue(seedSong, songs);
    if (radioQueue.length) playPlaylist(radioQueue, 0);
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

  if (error)
    return (
      <div className="all-songs-page">
        <div className="all-songs__error">
          <div className="all-songs__error-icon">⚠️</div>
          <h3 className="all-songs__error-title">Something went wrong</h3>
          <p className="all-songs__error-message">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="all-songs-page">
      {/* Songs Section - Only the full grid */}
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
                      {song.artist?.name ||
                        song.singers?.map((s) => s.name).join(", ") ||
                        "Unknown Artist"}
                    </div>
                  </div>
                  <div className="all-songs__play-icon">▶</div>
                </div>

                {/* Radio button */}
                <div className="all-songs__card-actions">
                  <button
                    className="all-songs__add-to-queue all-songs__start-radio"
                    onClick={(e) => handleStartRadio(song, e)}
                    title="Start radio from this song"
                  >
                    <i className="fa-solid fa-tower-broadcast"></i>
                  </button>
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