import React from "react";
import "../../assets/style/UserPage/SplashScreen.css";
import logo2 from "../../assets/images/logo/blend.png";

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <img src={logo2} alt="Blend Logo" className="splash-logo" />
        </div>
        {/* <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
        <div className="pulse-effect"></div> */}
      </div>
    </div>
  );
};

export default SplashScreen;