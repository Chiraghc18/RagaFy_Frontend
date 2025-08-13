// src/hooks/useUpload.js
import { useState } from "react";

export default function useUpload(uploadFunction, refreshCallback) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (formData) => {
    try {
      setIsUploading(true);
      setProgress(0);
      await uploadFunction(formData, (event) => {
        const percent = Math.round((event.loaded * 100) / event.total);
        setProgress(percent);
      });
      alert("Upload successful!");
      setProgress(0);
      setIsUploading(false);
      if (refreshCallback) refreshCallback();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed!");
      setIsUploading(false);
      setProgress(0);
    }
  };

  return { progress, isUploading, handleUpload };
}
