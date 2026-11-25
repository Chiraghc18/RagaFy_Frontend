// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { GlobalPlayerProvider } from "./context/GlobalPlayerContext";
import "./assets/style/App.css";

import UserHome from "./pages/User/UserHome";
import HeadSearch from "./components/UserComponents/HeadSearch";
import UserPlaylists from "./components/UserComponents/UserPlayLists.jsx";
import UserPlaylistDetails from "./components/UserComponents/UserPlaylistDetails.jsx";
import AllSongs from "./components/UserComponents/AllSong.jsx";
import DownloadedSongsPage from "./pages/DownloadedSongsPage";
import SongFilterSearch from "./pages/SongFilterSearch";
import BrowseByCategoryPage from "./pages/BrowseByCategoryPage";
import SongPlayerPage from "./pages/SongPlayerPage";
import GlobalPlayer from "./components/GlobalPlayer";
import GlobalBackground from "./components/GlobalBackground";

function AppContent() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <GlobalBackground>
      {!isOnline && (
        <div
          style={{
            background: "#ff9800",
            color: "#000",
            textAlign: "center",
            padding: "8px 12px",
            fontSize: "14px",
            fontWeight: "bold",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            zIndex: 99999,
          }}
        >
          <i className="fa-solid fa-wifi-slash" style={{ marginRight: "8px" }}></i>
          You're offline — only downloaded songs can play
        </div>
      )}

      <div style={{ paddingTop: !isOnline ? "36px" : "0" }}>
        <Routes>
          <Route path="/" element={<UserHome />} />
          <Route path="/user" element={<HeadSearch />} />
          <Route path="/user/playlists" element={<UserPlaylists />} />
          <Route path="/user-playlists/:id" element={<UserPlaylistDetails />} />
          <Route path="/all" element={<AllSongs />} />
          <Route path="/browse" element={<BrowseByCategoryPage />} />
          <Route path="/player" element={<SongPlayerPage />} />
          <Route path="/search-filter" element={<SongFilterSearch />} />
          <Route path="/downloads" element={<DownloadedSongsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalPlayer />
      </div>
    </GlobalBackground>
  );
}

export default function App() {
  return (
    <DataProvider>
      <GlobalPlayerProvider>
        <Router>
          <AppContent />
        </Router>
      </GlobalPlayerProvider>
    </DataProvider>
  );
}