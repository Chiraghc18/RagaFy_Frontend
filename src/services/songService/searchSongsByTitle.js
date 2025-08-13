// src/services/songService.js

import axios from "axios";
const API = "http://localhost:5000";

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
