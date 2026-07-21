import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { GlobalPlayerProvider } from "./context/GlobalPlayerContext";
import "./assets/style/App.css";

import UserHome from "./pages/User/UserHome";
import HeadSearch from "./components/UserComponents/HeadSearch";
import UserPlaylists from "./components/UserComponents/UserPlayLists.jsx";
import UserPlaylistDetails from "./components/UserComponents/UserPlaylistDetails.jsx";
import AllSongs from "./components/UserComponents/AllSong.jsx";
import QueuePage from './pages/QueuePage';
import SongFilterSearch from "./pages/SongFilterSearch";
import BrowseByCategoryPage from "./pages/BrowseByCategoryPage";
import SongPlayerPage from "./pages/SongPlayerPage";
import GlobalPlayer from "./components/GlobalPlayer";
import GlobalBackground from "./components/GlobalBackground";

// Wrapper to prevent GlobalBackground from remounting on route change
function AppContent() {
  return (
    <GlobalBackground>
      <Routes>
        <Route path="/" element={<UserHome />} />
        <Route path="/user" element={<HeadSearch />} />
        <Route path="/user/playlists" element={<UserPlaylists />} />
        <Route path="/user-playlists/:id" element={<UserPlaylistDetails />} />
        <Route path="/all" element={<AllSongs />} />
        <Route path="/browse" element={<BrowseByCategoryPage />} />
        
        <Route path="/player" element={<SongPlayerPage />} />

        <Route path="/search-filter" element={<SongFilterSearch />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalPlayer />
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