import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";

import NotFound from "./pages/NotFound";

{/*Both user and developer Requirements */}
import SongFilterSearch from "./pages/SongFilterSearch";
import BrowseByCategoryPage from "./pages/BrowseByCategoryPage";
import SongPlayerPage from "./pages/SongPlayerPage";

{/* user page  */}
import UserHome from "./pages/User/UserHome";
import HeadSearch from "./components/UserComponents/HeadSearch";
import UserPlaylists from "./components/UserComponents/UserPlayLists.jsx";
import UserPlaylistDetails from "./components/UserComponents/UserPlaylistDetails.jsx";
import AllSongs from "./components/UserComponents/AllSong.jsx";
import QueuePage from './pages/QueuePage';

export default function App() {
  return (
    <DataProvider>
      <Router>
        <Routes>
          {/* Home route */}
          <Route path="/" element={<UserHome />} />
          
          {/* user page routes */}
          <Route path="/user" element={<HeadSearch />} />
          <Route path="/user/playlists" element={<UserPlaylists />} />
          <Route path="/user-playlists/:id" element={<UserPlaylistDetails />} />
          <Route path="/all" element={<AllSongs />} />

          {/*Both user and developer Requirements */}
          <Route path="/browse" element={<BrowseByCategoryPage />} />
          <Route path="/player" element={<SongPlayerPage />} />
          <Route path="/search-filter" element={<SongFilterSearch />} />
          
          {/* Redirect any unmatched route to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
          <Route path="/queue" element={<QueuePage />} />
          {/* Optional: Keep 404 for truly non-existent routes */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Router>
    </DataProvider>
  );
}