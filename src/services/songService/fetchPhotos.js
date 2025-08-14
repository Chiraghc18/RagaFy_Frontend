// src/services/songService/fetchPhotos.js
import axios from "axios";

const fetchPhotos = async () => {
  return axios.get("https://ragafy-backend.onrender.com/songs/photos");
};

export default fetchPhotos;
