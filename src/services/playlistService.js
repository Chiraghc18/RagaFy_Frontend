// src/services/playlistService.js
import axios from "axios";

const API_BASE = "https://ragafy-backend.onrender.com";
const BASE = `${API_BASE}/playlists`;

export const fetchPlaylists = () => axios.get(BASE);
export const fetchPlaylistById = (id) => axios.get(`${BASE}/${id}`);

export const createPlaylist = (formData, onUploadProgress) =>
  axios.post(`${BASE}/create`, formData, { onUploadProgress });

export const addSongToPlaylist = (playlistId, songId) =>
  axios.post(`${BASE}/add-song`, { playlistId, songId });

export const removeSongFromPlaylist = (playlistId, songId) =>
  axios.post(`${BASE}/remove-song`, { playlistId, songId });

// ✅ NEW — Clear entire playlist
export const clearPlaylist = (playlistId) =>
  axios.post(`${BASE}/clear`, { playlistId });
