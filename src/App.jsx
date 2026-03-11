// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { GlobalPlayerProvider } from "./context/GlobalPlayerContext";

import NotFound from "./pages/NotFound";
import SongFilterSearch from "./pages/SongFilterSearch";
import BrowseByCategoryPage from "./pages/BrowseByCategoryPage";
import SongPlayerPage from "./pages/SongPlayerPage";
import UserHome from "./pages/User/UserHome";
import HeadSearch from "./components/UserComponents/HeadSearch";
import UserPlaylists from "./components/UserComponents/UserPlayLists.jsx";
import UserPlaylistDetails from "./components/UserComponents/UserPlaylistDetails.jsx";
import AllSongs from "./components/UserComponents/AllSong.jsx";
import QueuePage from './pages/QueuePage';
import GlobalPlayer from "./components/GlobalPlayer";

export default function App() {
  return (
    <DataProvider>
      <GlobalPlayerProvider>
        <Router>
          <Routes>
            <Route path="/" element={<UserHome />} />
            <Route path="/user" element={<HeadSearch />} />
            <Route path="/user/playlists" element={<UserPlaylists />} />
            <Route path="/user-playlists/:id" element={<UserPlaylistDetails />} />
            <Route path="/all" element={<AllSongs />} />
            <Route path="/browse" element={<BrowseByCategoryPage />} />
            <Route path="/player" element={<SongPlayerPage />} />
            <Route path="/search-filter" element={<SongFilterSearch />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/queue" element={<QueuePage />} />
          </Routes>
          <GlobalPlayer />
        </Router>
      </GlobalPlayerProvider>
    </DataProvider>
  );
}