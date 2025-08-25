import React, { useState, useEffect } from "react";
import "../../assets/style/UserPage/SplashScreen.css";
import logo2 from "../../assets/images/logo/blend.png";

const SplashScreen = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        setTimeout(() => onLoadingComplete(), 500);
      }
    }, 5000); // Show for 5 seconds to match background transition
    
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className={`splash-screen ${!isVisible ? 'fade-out' : ''}`}>
  <div className="logo-container">
    <img src={logo2} alt="Blend Logo" className="splash-logo" />
    <div className="loading-indicator">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  </div>
</div>
  );
};

export default SplashScreen;
