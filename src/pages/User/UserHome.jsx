import React from "react";
import "../../assets/style/UserPage/UserHome.css";
import { useNavigate } from "react-router-dom";
import Head from "../../components/UserComponents/Head";
import Selector from "../../components/UserComponents/Selector";
import HomeSections from "../../components/UserComponents/HomeSections";
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
      <HomeSections />
      <AllSongs />
    </div>
  );
};

export default UserHome;