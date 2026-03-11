import axios from "axios";

const CACHE_KEY = "ragafy_songs_cache";
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

export default async function fetchSongs() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("Loaded songs from cache");
        return { data: parsed.data };
      }
    }

    const response = await axios.get(
      "https://ragafy-backend.onrender.com/songs"
    );

    console.log("Fetched songs from API:", response.data);

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      })
    );

    return response;
  } catch (err) {
    console.error("Failed to fetch songs:", err);
    throw err;
  }
}