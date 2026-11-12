// src/components/SearchSongs.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "../context/DataContext";
import BrowseSongLists from "./BrowseSongLists";

export default function SearchSongs() {
  const { songs, loading } = useData();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the query so we don't re-filter on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  // Filter the already-loaded songs client-side
  const filteredSongs = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    if (!q) return songs;

    return songs.filter((song) => {
      // Title
      if ((song.title ?? "").toLowerCase().includes(q)) return true;

      // Artist
      if ((song.artist ?? "").toLowerCase().includes(q)) return true;

      // Singers — handles both [{ name }] and ["id"] shapes
      if (Array.isArray(song.singers)) {
        const singerMatch = song.singers.some((s) => {
          if (!s) return false;
          if (typeof s === "string") return s.toLowerCase().includes(q);
          return (s.name ?? "").toLowerCase().includes(q);
        });
        if (singerMatch) return true;
      }

      // Genre
      if ((song.genre?.name ?? "").toLowerCase().includes(q)) return true;

      // Language
      if ((song.language?.name ?? "").toLowerCase().includes(q)) return true;

      return false;
    });
  }, [songs, debouncedQuery]);

  const clearSearch = () => setQuery("");

  return (
    <div className="p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          placeholder="Search by song title, artist, genre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Clear
          </button>
        )}
      </form>

      {loading && <p className="mt-4">Loading songs...</p>}

      {!loading && debouncedQuery.trim() && (
        <p className="mt-4 text-sm">
          Found <strong>{filteredSongs.length}</strong> song
          {filteredSongs.length !== 1 ? "s" : ""} matching "
          {debouncedQuery}"
        </p>
      )}

      <div className="mt-6 space-y-4">
        {!loading && filteredSongs.length > 0 && (
          <BrowseSongLists songs={filteredSongs} />
        )}

        {!loading && debouncedQuery.trim() && filteredSongs.length === 0 && (
          <p className="text-center text-gray-500 mt-6">
            No songs found for "{debouncedQuery}"
          </p>
        )}
      </div>
    </div>
  );
}