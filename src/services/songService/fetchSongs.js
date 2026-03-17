import axios from "axios";

const CACHE_KEY = "ragafy_songs_cache";

export default async function fetchSongs() {
  let cachedData = null;

  try {
    // 1️⃣ Try reading cache first (for fast UI)
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);
      cachedData = parsed.data;
      console.log("Loaded songs from cache");
    }

    // 2️⃣ Always fetch latest data from API
    const response = await axios.get(
      "https://ragafy-backend.onrender.com/songs"
    );

    console.log("Fetched fresh songs from API");

    // 3️⃣ Update cache with fresh data
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      })
    );

    // 4️⃣ Return fresh data
    return response;

  } catch (err) {
    console.error("Failed to fetch songs:", err);

    // 5️⃣ Fallback to cache if API fails
    if (cachedData) {
      console.log("Using cached songs (fallback)");
      return { data: cachedData };
    }

    // 6️⃣ No cache + API failed → throw error
    throw err;
  }
}