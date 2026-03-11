import axios from "axios";

const CACHE_KEY = "ragafy_photos_cache";
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

const fetchPhotos = async () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return { data: parsed.data };
      }
    }

    const response = await axios.get(
      "https://ragafy-backend.onrender.com/songs/photos"
    );

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      })
    );

    return response;
  } catch (error) {
    console.error("Photo fetch failed:", error);
    throw error;
  }
};

export default fetchPhotos;