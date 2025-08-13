// src/services/songService/browseService.js
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export const categoryApiMap = {
  genre: "/genres",
  subgenre: "/subgenres",
  artist: "/artists",
  album: "/albums",
  movie: "/movies",
  hero: "/heroes",
  heroine: "/heroines",
  language: "/languages",
  singer: "/singers",
};

export const fetchCategoryItems = async (category) => {
  const res = await axios.get(`${BASE_URL}${categoryApiMap[category]}`);
  return res.data;
};

export const fetchSongsByCategory = async (category, id) => {
  const res = await axios.get(`${BASE_URL}/songs/browse/${category}/${id}`);
  return res.data;
};
