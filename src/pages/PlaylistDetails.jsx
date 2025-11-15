import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
  clearPlaylist,
} from "../services/playlistService";
// import { fetchSongById } from "../services/songService/songService"; // <-- Removed
// import { fetchAllFilters, fetchFilteredSongs } from "../services/songService/songFilterService"; // <-- fetchAllFilters removed
import { fetchFilteredSongs } from "../services/songService/songFilterService";
import SongFilterSearch from "../components/SongFilterSearch";
import { useData } from "../context/DataContext"; // <-- IMPORT THE HOOK

export default function PlaylistDetails() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [songsDetails, setSongsDetails] = useState([]);

  // <-- Get global data from our context
  const {
    songs: allSongs,
    loading: dataLoading,
    filterOptions,
  } = useData();

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

  // const [options, setOptions] = useState({}); // <-- Removed, use filterOptions
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const res = await fetchPlaylistById(id);
      setPlaylist(res.data);

      // --- PERFORMANCE FIX ---
      // Instead of fetching N songs, filter the global 'allSongs' list.
      const songIdsInPlaylist = res.data.songs.map((s) => s._id);
      const details = allSongs.filter((song) =>
        songIdsInPlaylist.includes(song._id)
      );
      setSongsDetails(details);
      // -------------------------
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // <-- Wait for global data to be ready before loading playlist
    if (dataLoading) return;
    
    loadPlaylist();
    
    // <-- Removed 'fetchAllFilters' call. It's already in our context.
  }, [id, dataLoading]); // <-- Run when global data is ready

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleFilterSearch = async () => {
    const data = await fetchFilteredSongs(filters);
    // Filter out songs already in the playlist
    const songIdsInPlaylist = songsDetails.map(s => s._id);
    const filtered = data.filter((s) => !songIdsInPlaylist.includes(s._id));
    setFilteredSongs(filtered);
    setSelectedSongs([]);
    setSelectAll(false);
  };

  const handleSelectSong = (songId) =>
    setSelectedSongs((prev) =>
      prev.includes(songId) ? prev.filter((x) => x !== songId) : [...prev, songId]
    );

  const handleSelectAll = () => {
    if (selectAll) setSelectedSongs([]);
    else setSelectedSongs(filteredSongs.map((s) => s._id));
    setSelectAll(!selectAll);
  };

  const handleAddSelectedSongs = async () => {
    for (let songId of selectedSongs) await addSongToPlaylist(id, songId);
    setSelectedSongs([]);
    setSelectAll(false);
    setFilteredSongs([]); // Clear search results after adding
    loadPlaylist(); // Reload playlist to show new songs
  };

  const handleRemoveSong = async (songId) => {
    await removeSongFromPlaylist(id, songId);
    loadPlaylist(); // Reload playlist
  };

  const handleClearPlaylist = async () => {
    if (
      !window.confirm("Are you sure? This will remove ALL songs from this playlist.")
    )
      return;
    await clearPlaylist(id);
    loadPlaylist(); // Reload playlist
  };

  // <-- Check global loading state as well
  if (loading || dataLoading) return <div style={{ padding: 20 }}>Loading playlist...</div>;
  if (err) return <div style={{ padding: 20, color: "red" }}>Error: {err}</div>;
  if (!playlist) return <div style={{ padding: 20 }}>Playlist not found.</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/playlists">&larr; Back to Playlists</Link>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
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
                background: "#eee",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              No cover
            </div>
          )}
        </div>

        <div>
          <h2>{playlist.name}</h2>
          <div style={{ color: "#666" }}>
            {songsDetails.length || 0} songs
          </div>

          {songsDetails.length > 0 && (
            <button
              onClick={handleClearPlaylist}
              style={{
                marginTop: 10,
                padding: "6px 10px",
                background: "#d9534f",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              Clear Playlist
            </button>
          )}
        </div>
      </div>

      <h3>Filter Songs</h3>
      {/* // <-- Pass global filterOptions from our context */ }
      <SongFilterSearch
        filters={filters}
        options={filterOptions}
        handleChange={handleFilterChange}
      />
      <button onClick={handleFilterSearch} style={{ marginTop: 10 }}>
        Search
      </button>

      {filteredSongs.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <label>
            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />{" "}
            Select All
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

      <h3 style={{ marginTop: 30 }}>Playlist Songs</h3>
      {songsDetails.length === 0 ? (
        <p>No songs in this playlist.</p>
      ) : (
        <ol>
          {songsDetails.map((s) => (
            <li key={s._id} style={{ marginBottom: 12 }}>
              <strong>{s.title || s.filename}</strong>
              <audio controls src={s.audioUrl} style={{ marginLeft: 12 }} />
              <button
                onClick={() => handleRemoveSong(s._id)}
                style={{ marginLeft: 12 }}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}