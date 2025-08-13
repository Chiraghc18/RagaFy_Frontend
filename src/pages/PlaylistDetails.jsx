import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "../services/playlistService";
import { fetchSongById } from "../services/songService/songService";
import fetchSongs  from "../services/songService/fetchSongs.js";


export default function PlaylistDetails() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [selectedSongId, setSelectedSongId] = useState("");
  const [songsDetails, setSongsDetails] = useState([]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const res = await fetchPlaylistById(id);
      setPlaylist(res.data);

      const songDetails = await Promise.all(
        res.data.songs.map((s) => fetchSongById(s._id).then((res) => res.data))
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
    const loadAllSongs = async () => {
      try {
        const res = await fetchSongs();
        setAllSongs(res.data);
      } catch (e) {
        console.error("fetch all songs error:", e);
      }
    };
    loadAllSongs();
  }, [id]);

  const handleAddSong = async () => {
    if (!selectedSongId) return;
    try {
      await addSongToPlaylist(id, selectedSongId);
      setSelectedSongId("");
      await loadPlaylist(); // refresh
    } catch (e) {
      console.error("add song error:", e.response?.data || e.message);
      alert("Error adding song: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      await removeSongFromPlaylist(id, songId);
      await loadPlaylist(); // refresh
    } catch (e) {
      console.error("remove song error:", e.response?.data || e.message);
      alert("Error removing song: " + (e.response?.data?.error || e.message));
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading playlist...</div>;
  if (err) return <div style={{ padding: 20, color: "red" }}>Error: {err}</div>;
  if (!playlist) return <div style={{ padding: 20 }}>Playlist not found.</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/playlists">&larr; Back to Playlists</Link>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
        <div style={{ width: 160, height: 160 }}>
          {playlist.coverImage ? (
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
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
              }}
            >
              No cover
            </div>
          )}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{playlist.name}</h2>
          <div style={{ color: "#666", marginTop: 6 }}>
            {playlist.songs?.length || 0} song{playlist.songs?.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Add Song Section */}
      <div style={{ marginBottom: 24 }}>
        <select
          value={selectedSongId}
          onChange={(e) => setSelectedSongId(e.target.value)}
        >
          <option value="">-- Select song to add --</option>
          {allSongs
            .filter((s) => !playlist.songs.some((ps) => ps._id === s._id))
            .map((song) => (
              <option key={song._id} value={song._id}>
                {song.title || song.filename || "Untitled"}
              </option>
            ))}
        </select>
        <button onClick={handleAddSong} style={{ marginLeft: 12 }}>
          Add to Playlist
        </button>
      </div>

      {/* Playlist Songs */}
      <div>
        {!songsDetails || songsDetails.length === 0 ? (
          <p>No songs in this playlist.</p>
        ) : (
          <ol style={{ paddingLeft: 18 }}>
            {songsDetails.map((s) => (
              <li key={s._id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {s.title || s.filename || "Untitled"}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      {s.artist?.name || ""}
                    </div>
                  </div>
                  <div style={{ minWidth: 260 }}>
                    <audio controls src={s.audioUrl} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <button
                      onClick={() => handleRemoveSong(s._id)}
                      style={{ marginLeft: 8 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
