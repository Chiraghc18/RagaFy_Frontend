import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  fetchPlaylists,
  createPlaylist,
  clearPlaylist,
} from "../services/playlistService";
import ProgressBar from "../components/ProgressBar";

export default function UploadPlaylistPage() {
  const [name, setName] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [songs, setSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_SONGS = "https://ragafy-backend.onrender.com/songs";

  useEffect(() => {
    fetchSongs();
    loadPlaylists();
  }, []);

  async function fetchSongs() {
    try {
      const res = await axios.get(API_SONGS);
      setSongs(res.data || []);
    } catch {
      setSongs([]);
    }
  }

  async function loadPlaylists() {
    try {
      setLoading(true);
      const res = await fetchPlaylists();
      setPlaylists(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleSongToggle = (songId) => {
    setSelectedSongs((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name) return alert("Playlist name is required");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("isBuiltIn", false);
    selectedSongs.forEach((id) => formData.append("songs", id));
    if (coverImage) formData.append("coverImage", coverImage);

    try {
      setIsUploading(true);
      setProgress(0);

      await createPlaylist(formData, (event) => {
        if (!event.total) return;
        setProgress(Math.round((event.loaded * 100) / event.total));
      });

      setName("");
      setCoverImage(null);
      setSelectedSongs([]);
      setProgress(0);
      setIsUploading(false);
      loadPlaylists();
    } catch {
      setIsUploading(false);
      setProgress(0);
      alert("Error creating playlist");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>Create Playlist</h2>

      <form onSubmit={handleCreatePlaylist} style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Playlist Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, width: 320 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0] || null)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>Select Songs</strong>
          <div
            style={{
              maxHeight: 200,
              overflowY: "auto",
              border: "1px solid #ddd",
              padding: 10,
              marginTop: 8,
            }}
          >
            {songs.length === 0 && <div>No songs available</div>}
            {songs.map((s) => (
              <label key={s._id} style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedSongs.includes(s._id)}
                  onChange={() => handleSongToggle(s._id)}
                />
                <span style={{ marginLeft: 8 }}>{s.title || s.filename}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" disabled={isUploading} style={{ padding: "8px 12px" }}>
            {isUploading ? "Creating..." : "Create Playlist"}
          </button>
          <ProgressBar progress={progress} />
        </div>
      </form>

      <h3>Playlists</h3>

      {loading ? (
        <p>Loading playlists...</p>
      ) : playlists.length === 0 ? (
        <p>No playlists yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {playlists.map((pl) => (
            <div
              key={pl._id}
              style={{
                border: "1px solid #ddd",
                padding: 12,
                borderRadius: 8,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                minHeight: 300,
              }}
            >
              <Link
                to={`/playlists/${pl._id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div>
                  <div style={{ height: 140, marginBottom: 8 }}>
                    {pl.coverImage ? (
                      <img
                        src={pl.coverImage}
                        alt={pl.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#f2f2f2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#888",
                          borderRadius: 6,
                        }}
                      >
                        No cover
                      </div>
                    )}
                  </div>
                  <strong>{pl.name}</strong>
                </div>
              </Link>

              <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                {pl.songs?.length === 0 && <li style={{ color: "#666" }}>No songs</li>}
                {pl.songs?.slice(0, 3).map((s) => (
                  <li key={s._id}>{s.title || s.filename}</li>
                ))}
                {pl.songs?.length > 3 && (
                  <li style={{ color: "#666" }}>+{pl.songs.length - 3} more</li>
                )}
              </ul>

              <button
                onClick={async () => {
                  if (!window.confirm("Clear all songs from this playlist?")) return;
                  await clearPlaylist(pl._id);
                  loadPlaylists();
                }}
                style={{
                  padding: "6px 10px",
                  background: "red",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  marginTop: "auto",
                }}
              >
                Clear Playlist
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
