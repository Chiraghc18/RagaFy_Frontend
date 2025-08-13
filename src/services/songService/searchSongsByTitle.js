// src/services/songService.js

import axios from "axios";
const API = "https://ragafy-backend.onrender.com";

export const searchSongsByTitle = async (title) => {
  try {
    const response = await axios.get(`${API}/songs/search/title`, {
      params: { title },
    });
    return response.data;
  } catch (err) {
    console.error("Error searching songs:", err);
    throw err;
  }
};
