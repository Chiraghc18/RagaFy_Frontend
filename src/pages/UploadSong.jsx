import React, { useState } from "react";
import axios from "axios";

export default function UploadSong() {
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState(null);
  const [audio, setAudio] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !photo || !audio) {
      return setMessage("All fields are required");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("photo", photo);
    formData.append("audio", audio);

    try {
      const res = await axios.post("https://ragafy-backend.onrender.com/songs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message);
      setTitle("");
      setPhoto(null);
      setAudio(null);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Upload New Song</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Song Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Photo:</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} required />
        </div>

        <div>
          <label>Audio:</label>
          <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files[0])} required />
        </div>

        <button type="submit">Upload Song</button>
      </form>
    </div>
  );
}
