// UploadPhotoPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { uploadPhoto } from "../services/songService/uploadPhoto";

export default function UploadPhotoPage() {
  const { songId } = useParams();
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an image");

    try {
      await uploadPhoto(songId, file);
      alert("Photo uploaded successfully");
      window.location.href = "/"; // go back home
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Upload Photo</button>
    </form>
  );
}
