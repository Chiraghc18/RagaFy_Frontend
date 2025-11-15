import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext"; // <-- IMPORT

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

export default function App() {
  return (
    // <-- WRAP with DataProvider -->
    <DataProvider>
      <Router>
        <Routes>
          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />

          {/* user page  */}
          <Route path="/user" element={<HeadSearch />} />
          <Route path="/" element={<UserHome />} />
          <Route path="/user/playlists" element={<UserPlaylists />} />
          <Route path="/user-playlists/:id" element={<UserPlaylistDetails />} />
          <Route path="/all" element={<AllSongs />} />

          {/*Both user and developer Requirements */}
          <Route path="/browse" element={<BrowseByCategoryPage />} />
          <Route path="/player" element={<SongPlayerPage />} />
          <Route path="/search-filter" element={<SongFilterSearch />} />
        </Routes>
      </Router>
    </DataProvider>
  );
}