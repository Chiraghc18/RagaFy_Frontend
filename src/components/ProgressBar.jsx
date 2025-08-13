// src/components/ProgressBar.jsx
import React from "react";

export default function ProgressBar({ progress = 0 }) {
  if (!progress || progress <= 0) return null;
  return (
    <div style={{ marginTop: 10, width: 320, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, progress)}%`, height: 20, lineHeight: "20px", textAlign: "center", background: "#4caf50", color: "#fff", fontWeight: 600 }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}
