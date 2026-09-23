import axios from "axios";

const CACHE_KEY = "ragafy_songs_cache";
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes — adjust as needed

export default async function fetchSongs() {
  let cachedData = null;

  try {
    // 1️⃣ Read cache
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);
      cachedData = parsed.data;

      // 2️⃣ If cache is still fresh, return it — no API call
      const isFresh = Date.now() - parsed.timestamp < CACHE_TTL;
      if (isFresh) {
        console.log("Loaded songs from cache (fresh)");
        return { data: cachedData };
      }

      console.log("Cache is stale — fetching fresh data");
    }

    // 3️⃣ Cache missing or stale → fetch from API
    const response = await axios.get(
      "https://ragafy-backend.onrender.com/songs"
    );

    console.log("Fetched fresh songs from API");

    // 4️⃣ Update cache
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

    // 5️⃣ Fallback to cache if API fails
    if (cachedData) {
      console.log("Using cached songs (fallback)");
      return { data: cachedData };
    }

    throw err;
  }
}