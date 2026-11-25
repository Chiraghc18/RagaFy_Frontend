import React, { useState, useEffect } from "react";
import "../../assets/style/UserPage/UserHome.css";
import { useNavigate } from "react-router-dom";
import Head from "../../components/UserComponents/Head";
import Selector from "../../components/UserComponents/Selector";
import HomeSections from "../../components/UserComponents/HomeSections";
import AllSongs from "../../components/UserComponents/AllSong";
import SplashScreen from "../../components/UserComponents/SplashScreen";
import { useData } from "../../context/DataContext";

const UserHome = () => {
  const { loading, error } = useData();
  const navigate = useNavigate();
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

  if (loading && !isOnline) return <SplashScreen />;
  if (loading && isOnline) return <SplashScreen />;

  // 🔥 FIX: If offline, ignore the error and show the cached layout
  if (error && isOnline) {
    return (
      <div className="user-home">
        <Head onSearchClick={() => navigate("/user")} />
        <Selector />
        <div style={{ textAlign: "center", padding: "50px", color: "#ff9800" }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "48px", marginBottom: "20px" }}></i>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: "20px", padding: "10px 20px", background: "#ff9800", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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