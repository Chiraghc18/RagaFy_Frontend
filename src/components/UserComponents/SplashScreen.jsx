import React, { useState, useEffect, useRef } from "react";
import "../../assets/style/UserPage/SplashScreen.css";
import logo2 from "../../assets/images/logo/blend.png";

const SplashScreen = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const notesRef = useRef([]);
  const animationRef = useRef(null);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    let isActive = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle class
    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = -(Math.random() * 0.5 + 0.1);
        this.opacity = Math.random() * 0.4 + 0.1;
        this.color = Math.random() > 0.5 ? "255, 107, 0" : "0, 102, 255";
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y < -20) { this.y = canvas.height + 20; this.x = Math.random() * canvas.width; }
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Music Note class
    class MusicNote {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 40;
        this.size = Math.random() * 12 + 8;
        this.speed = Math.random() * 0.3 + 0.1;
        this.opacity = Math.random() * 0.15 + 0.05;
        this.wobble = Math.random() * 1.5 - 0.75;
        this.angle = Math.random() * Math.PI * 2;
        this.symbols = ["♪", "♫", "♬", "♩"];
        this.symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        this.color = Math.random() > 0.5 ? "255, 107, 0" : "0, 102, 255";
      }
      update() {
        this.y -= this.speed;
        this.angle += 0.008;
        this.x += Math.sin(this.angle) * this.wobble;
        if (this.y < -40) this.reset();
      }
      draw(ctx) {
        ctx.save();
        ctx.font = `${this.size}px serif`;
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.restore();
      }
    }

    // Initialize
    for (let i = 0; i < 40; i++) particlesRef.current.push(new Particle());
    for (let i = 0; i < 10; i++) notesRef.current.push(new MusicNote());

    const animate = () => {
      if (!isActive) return;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(10, 10, 20, 0.95)");
      gradient.addColorStop(0.4, "rgba(255, 107, 0, 0.08)");
      gradient.addColorStop(0.6, "rgba(0, 102, 255, 0.06)");
      gradient.addColorStop(1, "rgba(10, 10, 20, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const vignette = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.width*0.4,
        canvas.width/2, canvas.height/2, canvas.width*0.8
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => { p.update(); p.draw(ctx); });
      notesRef.current.forEach(n => { n.update(); n.draw(ctx); });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Loading progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 400);

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        setTimeout(() => onLoadingComplete(), 500);
      }
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onLoadingComplete]);

  return (
    <div className={`splash ${!isVisible ? 'splash--out' : ''}`}>
      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="splash__canvas" />

      {/* Content */}
      <div className="splash__content">
        <div className="splash__logo-wrap">
          <img src={logo2} alt="RagaFy Beats" className="splash__logo" />
        </div>

        <h1 className="splash__title">RagaFy Beats</h1>
        
        <div className="splash__loader">
          <div className="splash__dots">
            <span className="splash__dot"></span>
            <span className="splash__dot"></span>
            <span className="splash__dot"></span>
          </div>
        </div>

        <p className="splash__text">Loading your music experience...</p>

        <div className="splash__progress">
          <div className="splash__progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="splash__percent">{progress}%</p>
      </div>
    </div>
  );
};

export default SplashScreen;