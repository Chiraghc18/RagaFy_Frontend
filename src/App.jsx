// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

import UploadResourcePage from "./pages/UploadResourcePage";

import UploadAlbumPage from "./pages/UploadAlbumPage";

import UploadSubgenrePage from "./components/UploadSubgenrePage";

import UploadPlaylistPage from "./pages/UploadPlaylistPage";

import PlaylistDetails from "./pages/PlaylistDetails";

import SearchPage from "./pages/SearchPage";

import SongFilterSearch from "./pages/SongFilterSearch";

import BrowseByCategoryPage from "./pages/BrowseByCategoryPage";

import SongPlayerPage from "./pages/SongPlayerPage";

import UploadPhotoPage from "./pages/UploadPhotoPage";
 
import Header from "./pages/Header";



// User Page imports
import Head from "./components/UserComponents/Head";
import UserHome from "./pages/User/UserHome";
import HeadSearch from "./components/UserComponents/HeadSearch";
import UserPlaylists from "./components/UserComponents/UserPlayLists.jsx";
import UserPlaylistDetails from "./components/UserComponents/UserPlaylistDetails.jsx";
import AllSongs from "./components/UserComponents/AllSong.jsx";
export default function App() {
  return (
    <Router>
       <Header />
      <Routes>
        {/* Main music upload/player page */}
        <Route path="/upload" element={<HomePage />} />
        <Route path="/upload-photo/:songId" element={<UploadPhotoPage />} />

        <Route path="/artists" element={<UploadResourcePage resource="artists" title="Artists" />} />
        <Route path="/heroes" element={<UploadResourcePage resource="heroes" title="Heroes" />} />
        <Route path="/heroines" element={<UploadResourcePage resource="heroines" title="Heroines" />} />
        <Route path="/movies" element={<UploadResourcePage resource="movies" title="Movies" />} />
        <Route path="/genres" element={<UploadResourcePage resource="genres" title="genres" />} />
        <Route path="/singers" element={<UploadResourcePage resource="singers" title="singers" />} />
        <Route path="/languages" element={<UploadResourcePage resource="languages" title="languages" />} />

        <Route path="/albums" element={<UploadAlbumPage/>} />
        <Route path="/subgenre" element={<UploadSubgenrePage/>} />
        {/* <Route path="/playlist" element={<UploadPlaylistPage/>} /> */}
        <Route path="/playlists" element={<UploadPlaylistPage />} />
        <Route path="/playlists/:id" element={<PlaylistDetails />} />

        <Route path="/search" element={<SearchPage />} />

        <Route path="/search-filter" element={<SongFilterSearch />} />

        <Route path="/browse" element={<BrowseByCategoryPage />} />

        <Route path="/player" element={<SongPlayerPage />} />
        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />

        {/* user page  */}
        <Route path="/user" element={<HeadSearch />} />
        <Route path="/" element={<UserHome />} />
        <Route path="/user/playlists" element={<UserPlaylists />} />
        <Route path="/user-playlists/:id" element={<UserPlaylistDetails />} />
        <Route path="/all" element={<AllSongs />} />
      </Routes>
    </Router>
  );
}
