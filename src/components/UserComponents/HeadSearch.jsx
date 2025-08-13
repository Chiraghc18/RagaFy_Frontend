import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import fetchSongs from "../../services/songService/fetchSongs";
import "../../assets/style/UserPage/HeadSearch.css"; // Assuming you have a CSS file for styling
const HeadSearch = () => {
  const [songs, setSongs] = useState([]);      // All songs from backend
  const [filtered, setFiltered] = useState([]); // Songs after filtering
  const [query, setQuery] = useState("");       // Search input

  // Load songs when component mounts
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const res = await fetchSongs();
        const data = res.data || [];
        setSongs(data);
        setFiltered(data); // Show all initially
      } catch (err) {
        console.error("Error fetching songs:", err);
      }
    };

    loadSongs();
  }, []);

  // Filter songs every time query changes
  useEffect(() => {
    const lowerQuery = query.toLowerCase();
    const filteredSongs = songs.filter((song) =>
      song.title.toLowerCase().includes(lowerQuery)
    );
    setFiltered(filteredSongs);
  }, [query, songs]);

  const navigate = useNavigate();
   const handleSongClick = (song) => {
  // Compare by IDs (safer than names in case of spelling differences)
  const filteredSameCategory = songs.filter(
    (s) =>
      s.genre?._id === song.genre?._id &&
      s.language?._id === song.language?._id
  );

  const startIndex = filteredSameCategory.findIndex(
    (s) => s._id === song._id
  );

  navigate("/player", {
    state: { songs: filteredSameCategory, startIndex },
  });
};



  return (
    <div className="head-search">
     <header className="head-search_search-bar">
        <input
        type="text"
        placeholder="Search songs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <i className="fa-solid fa-magnifying-glass"></i>

     </header>
     
      <div className="head-search_search-results">
        {filtered.length > 0 ? (
          filtered.map((song) => (
            <div key={song._id} className="song-item" onClick={() => handleSongClick(song)}>
              <strong>{song.title}</strong>
            </div>
          ))
        ) : (
          <p>No songs found</p>
        )}
      </div>
    </div>
  );
};


export default HeadSearch;
