// src/pages/SearchPage.jsx

import React from "react";
import SearchSongs from "../components/SearchSongs";

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-4">Search Songs</h1>
      <SearchSongs />
    </div>
  );
}
