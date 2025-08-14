import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../assets/style/SongPlayerPage.css";

export default function SongPlayerPage() {
  const location = useLocation();
  const { songs = [], startIndex = 0 } = location.state || {};
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [photos, setPhotos] = useState({});
  const audioRef = useRef(null);

  const currentSong = songs[currentIndex];

  // Fetch all song photos (so bottom list can display them too)
  useEffect(() => {
    if (!songs.length) return;

    const loadPhotos = async () => {
      const photoMap = {};
      await Promise.all(
        songs.map(async (song) => {
          try {
            const res = await axios.get(
              `https://ragafy-backend.onrender.com/songs/${song._id}/photo`
            );
            photoMap[song._id] = res.data.url;
          } catch {
            photoMap[song._id] = null;
          }
        })
      );
      setPhotos(photoMap);
    };

    loadPhotos();
  }, [songs]);

  const handleSongEnd = () => {
    setCurrentIndex((prev) => (prev < songs.length - 1 ? prev + 1 : 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < songs.length - 1 ? prev + 1 : 0));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : songs.length - 1));
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        console.log("Autoplay blocked");
      });
    }
  }, [currentIndex]);

  if (!songs.length) return <p>No songs provided</p>;

  return (
    <div className="song-player-page">
      {/* Song Photo */}
      {photos[currentSong._id] ? (
        <img
          src={photos[currentSong._id]}
          alt={currentSong.title}
          className="song-photo"
        />
      ) : (
        <div className="song-photo-placeholder">
          <span>No Image</span>
        </div>
      )}

      {/* Song Details */}
      <h2 className="song-title">{currentSong.title}</h2>

      {currentSong.hero?.name && (
        <p className="song-detail"><strong>Hero:</strong> {currentSong.hero.name}</p>
      )}
      {currentSong.heroine?.name && (
        <p className="song-detail"><strong>Heroine:</strong> {currentSong.heroine.name}</p>
      )}
      {currentSong.artist?.name && (
        <p className="song-detail"><strong>Artist:</strong> {currentSong.artist.name}</p>
      )}
      {currentSong.album?.name && (
        <p className="song-detail"><strong>Album:</strong> {currentSong.album.name}</p>
      )}
      {currentSong.movie?.name && (
        <p className="song-detail"><strong>Movie:</strong> {currentSong.movie.name}</p>
      )}
      {currentSong.language?.name && (
        <p className="song-detail"><strong>Language:</strong> {currentSong.language.name}</p>
      )}
      {currentSong.genre?.name && (
        <p className="song-detail"><strong>Genre:</strong> {currentSong.genre.name}</p>
      )}

      {currentSong.singers?.length > 0 && (
        <p className="song-detail">
          <strong>Singers:</strong> {currentSong.singers.map(s => s.name).join(", ")}
        </p>
      )}

      {/* Audio Player */}
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        controls
        autoPlay
        onEnded={handleSongEnd}
        className="audio-player"
      />

      {/* Controls */}
      <div className="controls">
        <button onClick={handlePrevious} className="control-button">
          ◀ Previous
        </button>
        <button onClick={handleNext} className="control-button">
          Next ▶
        </button>
      </div>

      {/* Songs List with Photos */}
      <div className="player-songs-list">
        <h3 className="songs-list-title">Songs</h3>
        {songs.map((song, idx) => (
          <div
            key={song._id}
            onClick={() => setCurrentIndex(idx)}
            className={`song-item ${idx === currentIndex ? "active" : ""}`}
          >
            {photos[song._id] && (
              <img
                src={photos[song._id]}
                alt={song.title}
                className="song-item-image"
              />
            )}
            <span className="song-item-title">{song.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
