import React from "react"; // Removed useState, useEffect
import "../../assets/style/UserPage/UserHome.css";
import { useNavigate } from "react-router-dom";

import Head from "../../components/UserComponents/Head";
import Selector from "../../components/UserComponents/Selector";
import AllSongs from "../../components/UserComponents/AllSong";
import SplashScreen from "../../components/UserComponents/SplashScreen";
import { useData } from "../../context/DataContext"; // <-- IMPORT

const UserHome = () => {
  const { loading } = useData(); // <-- Get REAL loading state
  const navigate = useNavigate();

  // The 4-second setTimeout is GONE.
  if (loading) return <SplashScreen />;

  return (
    <div className="user-home">
      <Head onSearchClick={() => navigate("/user")} />
      <Selector />
      <AllSongs />
    </div>
  );
};

export default UserHome;