import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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

  // Update progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => setProgress(audio.currentTime);
    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Play/pause control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => console.log("Autoplay blocked"));
      else audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  // Media Session API
  useEffect(() => {
    if ("mediaSession" in navigator && currentSong) {
      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevious);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist?.name || "",
        album: currentSong.album?.name || "",
        artwork: photos[currentSong._id]
          ? [
              { src: photos[currentSong._id], sizes: "96x96", type: "image/png" },
              { src: photos[currentSong._id], sizes: "128x128", type: "image/png" },
              { src: photos[currentSong._id], sizes: "192x192", type: "image/png" },
              { src: photos[currentSong._id], sizes: "256x256", type: "image/png" },
              { src: photos[currentSong._id], sizes: "512x512", type: "image/png" },
            ]
          : [],
      });
    }
  }, [currentIndex, songs, photos, currentSong]);

  const handleSongEnd = () => setCurrentIndex(prev => prev < songs.length - 1 ? prev + 1 : 0);
  const handleNext = () => setCurrentIndex(prev => prev < songs.length - 1 ? prev + 1 : 0);
  const handlePrevious = () => setCurrentIndex(prev => prev > 0 ? prev - 1 : songs.length - 1);
  const togglePlayPause = () => setIsPlaying(prev => !prev);
  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  if (!songs.length) return <p>No songs provided</p>;

  return (
    <>
      <div className="ragafy-player__back" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left"></i>
      </div>

      <div className="ragafy-player">
        <div className="ragafy-player__header">
          {photos[currentSong._id] ? (
            <img
              src={photos[currentSong._id]}
              alt={currentSong.title}
              className="ragafy-player__photo"
            />
          ) : (
            <div className="ragafy-player__photo-placeholder">
              <span>No Image</span>
            </div>
          )}

          <h2 className="ragafy-player__title">{currentSong.title}</h2>

          {currentSong.hero?.name && <p className="ragafy-player__detail"><strong>Hero :</strong> {currentSong.hero.name}</p>}
          {currentSong.heroine?.name && <p className="ragafy-player__detail"><strong>Heroine :</strong> {currentSong.heroine.name}</p>}
          {currentSong.artist?.name && <p className="ragafy-player__detail"><strong>Artist :</strong> {currentSong.artist.name}</p>}
          {currentSong.album?.name && <p className="ragafy-player__detail"><strong>Album :</strong> {currentSong.album.name}</p>}
          {currentSong.movie?.name && <p className="ragafy-player__detail"><strong>Movie :</strong> {currentSong.movie.name}</p>}
          {currentSong.language?.name && <p className="ragafy-player__detail"><strong>Language :</strong> {currentSong.language.name}</p>}
          {currentSong.genre?.name && <p className="ragafy-player__detail"><strong>Genre :</strong> {currentSong.genre.name}</p>}
          {currentSong.singers?.length > 0 && <p className="ragafy-player__detail"><strong>Singers:</strong> {currentSong.singers.map(s => s.name).join(", ")}</p>}
        </div>

        <div className="ragafy-player__audio-container">
          <audio
            ref={audioRef}
            src={currentSong.audioUrl}
            autoPlay
            onEnded={handleSongEnd}
            onLoadedMetadata={() => { setDuration(audioRef.current.duration); setProgress(0); }}
            className="ragafy-player__audio"
          />

          <input
            type="range"
            id="ragafy-player__progress"
            value={progress}
            onChange={handleSeek}
            max={duration || 0}
          />

          <div className="ragafy-player__controls">
            <div onClick={handlePrevious}><i className="fa-solid fa-backward"></i></div>
            <div onClick={togglePlayPause}><i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`} id="ragafy-player__ctrl-icon"></i></div>
            <div onClick={handleNext}><i className="fa-solid fa-forward"></i></div>
          </div>
        </div>

        <div className="ragafy-player__song-list">
          <h3 className="ragafy-player__song-list-title">Songs</h3>
          {songs.map((song, idx) => (
            <div
              key={song._id}
              onClick={() => setCurrentIndex(idx)}
              className={`ragafy-player__song-item ${idx === currentIndex ? "ragafy-player__song-item--active" : ""}`}
            >
              {photos[song._id] && <img src={photos[song._id]} alt={song.title} className="ragafy-player__song-item-image" />}
              <span className="ragafy-player__song-item-title">{song.title}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
