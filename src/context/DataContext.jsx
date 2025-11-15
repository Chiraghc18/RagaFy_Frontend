import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import fetchSongs from "../services/songService/fetchSongs";
import { fetchPlaylists } from "../services/playlistService";
import { fetchAllFilters } from "../services/songService/songFilterService";

// 1. Create the context
const DataContext = createContext(null);

// 2. Create the provider component
export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [photos, setPhotos] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        // Fetch all primary data in parallel
        const [songRes, plRes, filterRes] = await Promise.allSettled([
          fetchSongs(),
          fetchPlaylists(),
          fetchAllFilters(),
        ]);

        // Process songs and photos (The "N+1" fix)
        let allSongs = [];
        if (songRes.status === "fulfilled") {
          allSongs = songRes.value.data || [];
          setSongs(allSongs);

          // Now fetch all photos ONCE and store them
          const photoMap = {};
          await Promise.all(
            allSongs.map(async (song) => {
              try {
                const res = await axios.get(
                  `https://ragafy-backend.onrender.com/songs/${song._id}/photo`
                );
                photoMap[song._id] = res.data.url;
              } catch {
                photoMap[song._id] = null;
              }
            })
          );
          setPhotos(photoMap);
        } else {
          console.error("Failed to fetch songs:", songRes.reason);
        }

        // Process playlists
        if (plRes.status === "fulfilled") {
          setPlaylists(plRes.value.data || []);
        } else {
          console.error("Failed to fetch playlists:", plRes.reason);
        }

        // Process filters
        if (filterRes.status === "fulfilled") {
          setFilterOptions(filterRes.value);
        } else {
          console.error("Failed to fetch filters:", filterRes.reason);
        }

      } catch (e) {
        console.error("Failed to load global data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []); // Empty array means this runs ONCE on app load

  const value = {
    loading,
    error,
    songs,
    photos,
    playlists,
    filterOptions,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// 3. Create a custom hook to easily use the context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};