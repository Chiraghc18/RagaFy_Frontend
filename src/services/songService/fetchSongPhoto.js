import axios from "axios";

const CACHE_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days
const BASE_URL =
  process.env.REACT_APP_API_URL || "https://ragafy-backend.onrender.com";

export const fetchSongPhoto = async (songId) => {
  const CACHE_KEY = `ragafy_photo_${songId}`;

  try {
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return { data: { url: parsed.url } };
      }
    }

    const response = await axios.get(`${BASE_URL}/songs/${songId}/photo`);

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        url: response.data.url,
        timestamp: Date.now(),
      })
    );

    return response;
  } catch (error) {
    console.error("Song photo fetch failed:", error);
    throw error;
  }
};