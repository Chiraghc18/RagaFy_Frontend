import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../assets/style/SongPlayerPage.css";

export default function SongPlayerPage() {
  const location = useLocation();
  const { songs = [], startIndex = 0 } = location.state || {};
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [photos, setPhotos] = useState({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const currentSong = songs[currentIndex];

  // Fetch song photos
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

  // Update progress as song plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => setProgress(audio.currentTime);
    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Handle play/pause when state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => console.log("Autoplay blocked"));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Song ended -> go to next
  const handleSongEnd = () => {
    setCurrentIndex((prev) => (prev < songs.length - 1 ? prev + 1 : 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < songs.length - 1 ? prev + 1 : 0));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : songs.length - 1));
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

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
        <p className="song-detail">
          <strong>Hero:</strong> {currentSong.hero.name}
        </p>
      )}
      {currentSong.heroine?.name && (
        <p className="song-detail">
          <strong>Heroine:</strong> {currentSong.heroine.name}
        </p>
      )}
      {currentSong.artist?.name && (
        <p className="song-detail">
          <strong>Artist:</strong> {currentSong.artist.name}
        </p>
      )}
      {currentSong.album?.name && (
        <p className="song-detail">
          <strong>Album:</strong> {currentSong.album.name}
        </p>
      )}
      {currentSong.movie?.name && (
        <p className="song-detail">
          <strong>Movie:</strong> {currentSong.movie.name}
        </p>
      )}
      {currentSong.language?.name && (
        <p className="song-detail">
          <strong>Language:</strong> {currentSong.language.name}
        </p>
      )}
      {currentSong.genre?.name && (
        <p className="song-detail">
          <strong>Genre:</strong> {currentSong.genre.name}
        </p>
      )}
      {currentSong.singers?.length > 0 && (
        <p className="song-detail">
          <strong>Singers:</strong>{" "}
          {currentSong.singers.map((s) => s.name).join(", ")}
        </p>
      )}

      {/* Audio Player */}
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        autoPlay
        onEnded={handleSongEnd}
        onLoadedMetadata={() => {
          setDuration(audioRef.current.duration);
          setProgress(0);
        }}
        className="audio-player"
      />

      {/* Progress Bar */}
      <input
        type="range"
        id="progress"
        value={progress}
        onChange={handleSeek}
        max={duration || 0}
      />

      {/* Controls */}
      <div className="controls">
        <div onClick={handlePrevious}>
          <i className="fa-solid fa-backward"></i>
        </div>
        <div onClick={togglePlayPause}>
          <i
            className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}
            id="ctrlIcon"
          ></i>
        </div>
        <div onClick={handleNext}>
          <i className="fa-solid fa-forward"></i>
        </div>
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
