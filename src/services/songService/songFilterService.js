import axios from "axios";

const BASE_URL = "https://ragafy-backend.onrender.com";

export const fetchAllFilters = async () => {
  const [
    genreRes,
    artistRes,
    albumRes,
    movieRes,
    heroRes,
    heroineRes,
    singerRes,
    languageRes,
  ] = await Promise.all([
    axios.get(`${BASE_URL}/genres`),
    axios.get(`${BASE_URL}/artists`),
    axios.get(`${BASE_URL}/albums`),
    axios.get(`${BASE_URL}/movies`),
    axios.get(`${BASE_URL}/heroes`),
    axios.get(`${BASE_URL}/heroines`),
    axios.get(`${BASE_URL}/singers`),
    axios.get(`${BASE_URL}/languages`),
  ]);

  return {
    genres: genreRes.data,
    artists: artistRes.data,
    albums: albumRes.data,
    movies: movieRes.data,
    heroes: heroRes.data,
    heroines: heroineRes.data,
    singers: singerRes.data,
    languages: languageRes.data,
  };
};

export const fetchFilteredSongs = async (filters) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== "")
  );
  const res = await axios.get(`${BASE_URL}/songs/search/filter`, { params });
  return res.data;
};
