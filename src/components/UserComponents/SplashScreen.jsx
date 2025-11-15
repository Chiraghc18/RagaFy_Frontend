import React, { useState, useEffect } from "react";
import "../../assets/style/UserPage/SplashScreen.css";
import logo2 from "../../assets/images/logo/blend.png";

const SplashScreen = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 20; // Increment by 20% every second
      });
    }, 1000);

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        setTimeout(() => onLoadingComplete(), 500);
      }
    }, 5000); // Show for 5 seconds
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onLoadingComplete]);

  return (
    <div className={`splash-screen ${!isVisible ? 'fade-out' : ''}`}>
      {/* Optional particles */}
      <div className="splash-particle"></div>
      <div className="splash-particle"></div>
      <div className="splash-particle"></div>
      
      <div className="logo-container">
        <img src={logo2} alt="Blend Logo" className="splash-logo" />
        
        {/* Loading dots */}
        <div className="loading-indicator">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
        
        {/* Optional loading text */}
        <div className="splash-text">
          Loading your music experience...
        </div>
        
        {/* Optional progress bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;