// src/pages/ResourceHeader.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ResourceHeader() {
  const resources = [
    { path: "/upload", label: "AddSongs" },
    { path: "/heroes", label: "Heroes" },
    { path: "/artists", label: "Artists" },
    { path: "/heroines", label: "Heroines" },
    { path: "/movies", label: "Movies" },
    { path: "/genres", label: "Genres" },
    { path: "/singers", label: "Singers" },
    { path: "/browse", label: "Browse" },
    { path: "/search", label: "Search" },
  ];

  return (
    <>
      <style>
        {`
          .resource-header {
            padding: 24px;
            background-color: #1a202c; /* dark gray */
            color: white;
            min-height: 100px;
          }

          .resource-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 24px;
            text-align: center;
          }

          .resource-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
          }

          .resource-link {
            padding: 12px 24px;
            background-color: #2563eb; /* blue */
            border-radius: 8px;
            text-decoration: none;
            color: white;
            font-size: 16px;
            box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
            transition: background-color 0.2s ease;
          }

          .resource-link:hover {
            background-color: #1e40af; /* darker blue */
          }
        `}
      </style>

      <div className="resource-header">
        <h1>Resource Upload Dashboard</h1>
        <div className="resource-links">
          {resources.map((res) => (
            <Link key={res.path} to={res.path} className="resource-link">
              {res.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
