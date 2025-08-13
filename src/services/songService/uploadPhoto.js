// services/songService/uploadPhoto.js
import axios from "axios";

export const uploadPhoto = (songId, file) => {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("songId", songId);

  return axios.post(`https://ragafy-backend.onrender.com/songs/upload-photo`, formData);
};
