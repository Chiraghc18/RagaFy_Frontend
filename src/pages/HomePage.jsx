import React, { useEffect, useState } from "react";
import FileUploader from "../components/FileUploader";
import ProgressBar from "../components/ProgressBar";
import fetchSongs from "../services/songService/fetchSongs.js";
import { uploadSong } from "../services/songService/uploadSong.js";
import BrowseSongLists from "../components/BrowseSongLists";

export default function HomePage() {
  const [songs, setSongs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSongs();
  }, []);

 async function loadSongs() {
  try {
    const res = await fetchSongs();
    const data = res.data || [];

    // Explicit sort by releaseDate (newest first)
    const sorted = [...data].sort((a, b) => {
      const dateA = new Date(a.releaseDate || a.createdAt);
      const dateB = new Date(b.releaseDate || b.createdAt);
      return dateB - dateA; // newest first
    });

    setSongs(sorted);
  } catch (err) {
    console.error("loadSongs error:", err);
  }
}
  const handleUpload = async (file, meta = {}) => {
    try {
      setIsUploading(true);
      const res = await uploadSong(file, meta);
      const songId = res.data.songId;

      // 🚀 fetch just the new song details (optional if your API supports it)
      const newSong = { _id: songId, ...meta };

      // prepend the new song to the list (no backend involved)
      setSongs((prev) => [newSong, ...prev]);

      setIsUploading(false);
      window.location.href = `/upload-photo/${songId}`;
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handleLike = async (songId) => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || "https://ragafy-backend.onrender.com"}/songs/${songId}/like`,
        { method: "POST" }
      );
      loadSongs();
    } catch (err) {
      console.error("like error", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload Song</h1>

      <FileUploader onUpload={handleUpload} />

      <ProgressBar progress={progress} />
      {isUploading && progress === 100 && <div>Processing on server...</div>}

      {songs.length > 0 && <BrowseSongLists songs={songs} />}
    </div>
  );
}
