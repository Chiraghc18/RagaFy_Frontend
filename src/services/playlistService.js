// src/services/playlistService.js
import axios from "axios";

const API_BASE ="http://localhost:5000";
const BASE = `${API_BASE}/playlists`;

export const fetchPlaylists = () => axios.get(BASE);

export const fetchPlaylistById = (id) => axios.get(`${BASE}/${id}`);

export const createPlaylist = (formData, onUploadProgress) =>
  axios.post(`${BASE}/create`, formData, {
    onUploadProgress,
  });

export const addSongToPlaylist = (playlistId, songId) =>
  axios.post(`${BASE}/add-song`, { playlistId, songId });

export const removeSongFromPlaylist = (playlistId, songId) =>
  axios.post(`${BASE}/remove-song`, { playlistId, songId });
