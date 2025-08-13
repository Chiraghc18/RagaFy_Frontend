// services/songService/fetchSongPhoto.js
import axios from "axios";

export const fetchSongPhoto = (songId) => {
  return axios.get(`${process.env.REACT_APP_API_URL || "https://ragafy-backend.onrender.com"}/songs/${songId}/photo`);
};
