// src/services/uploadSong.js

import axios from "axios";
const API = "https://ragafy-backend.onrender.com";
export const uploadSong = (file, meta = {}, onUploadProgress) => {
  const formData = new FormData();
  formData.append("audio", file);
  Object.entries(meta || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach(val => formData.append(k, val));
    } else {
      formData.append(k, v);
    }
  });
  return axios.post(`${API}/songs/upload`, formData, { onUploadProgress });
};