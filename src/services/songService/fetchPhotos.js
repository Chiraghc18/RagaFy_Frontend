import axios from "axios";

const CACHE_KEY = "ragafy_photos_cache";

const fetchPhotos = async () => {
  let cachedData = null;

  try {
    // 1️⃣ Load cache (fast UI)
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);
      cachedData = parsed.data;
      console.log("Loaded photos from cache");
    }

    // 2️⃣ Always fetch latest photos
    const response = await axios.get(
      "https://ragafy-backend.onrender.com/songs/photos"
    );

    console.log("Fetched fresh photos from API");

    // 3️⃣ Update cache
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      })
    );

    // 4️⃣ Return fresh data
    return response;

  } catch (error) {
    console.error("Photo fetch failed:", error);

    // 5️⃣ Fallback to cache
    if (cachedData) {
      console.log("Using cached photos (fallback)");
      return { data: cachedData };
    }

    throw error;
  }
};

export default fetchPhotos;