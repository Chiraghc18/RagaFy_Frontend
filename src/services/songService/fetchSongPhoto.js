// services/songService/fetchSongPhoto.js
import axios from "axios";

export const fetchSongPhoto = (songId) => {
  return axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/songs/${songId}/photo`);
};
