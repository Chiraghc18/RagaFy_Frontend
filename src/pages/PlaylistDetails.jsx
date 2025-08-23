import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "../services/playlistService";
import { fetchSongById } from "../services/songService/songService";
import { fetchAllFilters, fetchFilteredSongs } from "../services/songService/songFilterService";
import SongFilterSearch from "../components/SongFilterSearch";

export default function PlaylistDetails() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [songsDetails, setSongsDetails] = useState([]);

  // filters state (same structure as SongFilterSearchPage)
  const [filters, setFilters] = useState({
    genre: "",
    artist: "",
    album: "",
    movie: "",
    heroe: "",
    heroine: "",
    subgenre: "",
    language: "",
    singer: "",
    releaseYear: "",
  });

  const [options, setOptions] = useState({
    genres: [],
    artists: [],
    albums: [],
    movies: [],
    heroes: [],
    heroines: [],
    singers: [],
    languages: [],
  });

  // filtered songs state
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // 🔹 Load playlist details
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
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load filters on mount
  useEffect(() => {
    loadPlaylist();
    const loadOptions = async () => {
      const data = await fetchAllFilters();
      setOptions(data);
    };
    loadOptions();
  }, [id]);

  // 🔹 Handle filter change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // 🔹 Search songs by filters
  const handleFilterSearch = async () => {
    try {
      const data = await fetchFilteredSongs(filters);
      // remove songs already in playlist
      const filtered = data.filter((s) => !playlist.songs.some((ps) => ps._id === s._id));
      setFilteredSongs(filtered);
      setSelectedSongs([]);
      setSelectAll(false);
    } catch (e) {
      console.error("filter error:", e);
    }
  };

  // 🔹 Select / Deselect individual songs
  const handleSelectSong = (songId) => {
    setSelectedSongs((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  // 🔹 Select / Deselect all songs
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(filteredSongs.map((s) => s._id));
    }
    setSelectAll(!selectAll);
  };

  // 🔹 Add selected songs to playlist
  const handleAddSelectedSongs = async () => {
    try {
      for (let songId of selectedSongs) {
        await addSongToPlaylist(id, songId);
      }
      setSelectedSongs([]);
      setSelectAll(false);
      await loadPlaylist(); // refresh playlist
    } catch (e) {
      console.error("add multiple songs error:", e);
    }
  };

  // 🔹 Remove song from playlist
  const handleRemoveSong = async (songId) => {
    try {
      await removeSongFromPlaylist(id, songId);
      await loadPlaylist(); // refresh playlist
    } catch (e) {
      console.error("remove song error:", e);
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

      {/* Playlist Header */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
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

      {/* 🔍 Filters Section */}
      <div style={{ marginBottom: 20 }}>
        <h3>Filter Songs</h3>
        <SongFilterSearch filters={filters} options={options} handleChange={handleFilterChange} />
        <button onClick={handleFilterSearch} style={{ marginTop: 10 }}>
          Search
        </button>
      </div>

      {/* 📋 Filtered Songs with Checkboxes */}
      {filteredSongs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label>
            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} /> Select All
          </label>
          <ul style={{ marginTop: 10 }}>
            {filteredSongs.map((s) => (
              <li key={s._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSongs.includes(s._id)}
                    onChange={() => handleSelectSong(s._id)}
                  />
                  {s.title || s.filename}
                </label>
              </li>
            ))}
          </ul>
          <button
            onClick={handleAddSelectedSongs}
            disabled={selectedSongs.length === 0}
            style={{ marginTop: 10 }}
          >
            Add Selected Songs
          </button>
        </div>
      )}

      {/* Playlist Songs */}
      <h3>Playlist Songs</h3>
      {songsDetails.length === 0 ? (
        <p>No songs in this playlist.</p>
      ) : (
        <ol style={{ paddingLeft: 18 }}>
          {songsDetails.map((s) => (
            <li key={s._id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{s.title || s.filename || "Untitled"}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{s.artist?.name || ""}</div>
                </div>
                <div style={{ minWidth: 260 }}>
                  <audio controls src={s.audioUrl} style={{ width: "100%" }} />
                </div>
                <div>
                  <button onClick={() => handleRemoveSong(s._id)} style={{ marginLeft: 8 }}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
