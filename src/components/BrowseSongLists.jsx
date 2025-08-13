import React from "react";
import { useNavigate } from "react-router-dom";

export default function BrowseSongLists({ songs }) {
  const navigate = useNavigate();

  const handleSongClick = (index) => {
    navigate("/player", { state: { songs, startIndex: index } });
  };

  return (
    <div className="browse-song-list space-y-2">
      {songs.map((song, index) => (
        <button
          key={song._id}
          onClick={() => handleSongClick(index)}
          className="block w-full text-left p-2 rounded hover:bg-gray-100 border-b"
        >
          {song.title}
        </button>
      ))}
    </div>
  );
}
