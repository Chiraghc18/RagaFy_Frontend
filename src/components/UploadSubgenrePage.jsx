import React, { useState, useEffect } from "react";
import axios from "axios";

export default function UploadSubgenrePage() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [genres, setGenres] = useState([]);
  const [subgenres, setSubgenres] = useState([]);

  useEffect(() => {
    fetchGenres();
    fetchSubgenres();
  }, []);

  const fetchGenres = async () => {
    const res = await axios.get("http://localhost:5000/genres");
    setGenres(res.data);
  };

  const fetchSubgenres = async () => {
    const res = await axios.get("http://localhost:5000/subgenres");
    setSubgenres(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !genre) return alert("Please provide name and select genre");

    await axios.post("http://localhost:5000/subgenres/upload", { name, genre });

    setName("");
    setGenre("");
    fetchSubgenres();
  };

  return (
    <div>
      <h2>Upload Subgenre</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Subgenre Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Select Genre</option>
          {genres.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <button type="submit">Upload</button>
      </form>

      <h3>Subgenres</h3>
      <ul>
        {subgenres.map((sub) => (
          <li key={sub._id}>
            {sub.name} — {sub.genre?.name || "No Genre"}
          </li>
        ))}
      </ul>
    </div>
  );
}
