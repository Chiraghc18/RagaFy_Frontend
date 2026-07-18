import React from "react";
import "../../assets/style/UserPage/UserHome.css";
import { useNavigate } from "react-router-dom";

import Head from "../../components/UserComponents/Head";
import Selector from "../../components/UserComponents/Selector";
import HomeSections from "../../components/UserComponents/HomeSections"; // NEW
import AllSongs from "../../components/UserComponents/AllSong";
import SplashScreen from "../../components/UserComponents/SplashScreen";
import { useData } from "../../context/DataContext";

const UserHome = () => {
  const { loading } = useData();
  const navigate = useNavigate();

  if (loading) return <SplashScreen />;

  return (
    <div className="user-home">
      <Head onSearchClick={() => navigate("/user")} />
      <Selector />
      <HomeSections /> {/* NEW - contains greeting, recently played, made for you, playlists, categories */}
      <AllSongs />   {/* Only the full songs grid */}
    </div>
  );
};

export default UserHome;