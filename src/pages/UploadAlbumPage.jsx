import React, { useState, useEffect } from "react";
import axios from "axios";

export default function UploadAlbumPage() {
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetchArtists();
    fetchAlbums();
  }, []);

  const fetchArtists = async () => {
    const res = await axios.get("http://localhost:5000/artists");
    setArtists(res.data);
  };

  const fetchAlbums = async () => {
    const res = await axios.get("http://localhost:5000/albums");
    setAlbums(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !artist) return alert("Please select artist and enter album name");

    await axios.post("http://localhost:5000/albums/upload", { name, artist });

    setName("");
    setArtist("");
    fetchAlbums();
  };

  return (
    <div>
      <h2>Upload Album</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Album Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={artist} onChange={(e) => setArtist(e.target.value)}>
          <option value="">Select Artist</option>
          {artists.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <button type="submit">Upload</button>
      </form>

      <h3>Albums</h3>
      <ul>
        {albums.map((album) => (
          <li key={album._id}>
            {album.name} — {album.artist?.name || "No Artist"}
          </li>
        ))}
      </ul>
    </div>
  );
}
