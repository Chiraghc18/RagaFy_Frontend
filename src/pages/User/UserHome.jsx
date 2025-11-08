import { useState, useEffect } from "react";
import "../../assets/style/UserPage/UserHome.css";
import { useNavigate } from "react-router-dom";

import Head from "../../components/UserComponents/Head";
import Selector from "../../components/UserComponents/Selector";
import AllSongs from "../../components/UserComponents/AllSong";
import SplashScreen from "../../components/UserComponents/SplashScreen";

const UserHome = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

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
