import React, { useEffect, useRef } from "react";
import { useGlobalPlayer } from "../context/GlobalPlayerContext";
import "../assets/style/UserPage/AnimatedBackground.css";

export default function GlobalBackground({ children }) {
  const canvasRef = useRef(null);
  const { currentSong, isPlaying } = useGlobalPlayer();
  const particlesRef = useRef([]);
  const notesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);

  // Keep isPlaying in a ref so animation loop always has latest value
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

    const handleMouse = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    // ============================================
    // PARTICLE CLASS
    // ============================================
    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
        this.size = Math.random() * 2.5 + 0.8;
        this.baseSize = this.size;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = -(Math.random() * 0.6 + 0.15);
        this.opacity = Math.random() * 0.5 + 0.15;
        this.colorType = Math.random() > 0.5 ? "orange" : "blue";
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.sparkle = Math.random() > 0.85;
      }

      update(time, playing) {
        this.x += this.speedX;
        this.y += this.speedY;

        const speedMult = playing ? 1.6 : 1;
        this.y += (speedMult - 1) * 0.1;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 180 && dist > 0) {
          const force = (180 - dist) / 180 * 0.03;
          this.speedX -= (dx / dist) * force;
          this.speedY -= (dy / dist) * force;
          this.speedX *= 0.98;
          this.speedY *= 0.98;
        }

        if (this.y < -20) {
          this.y = canvas.height + 20;
          this.x = Math.random() * canvas.width;
        }
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;

        const maxSpeed = 1.5;
        this.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, this.speedX));
        this.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, this.speedY));

        this.size = Math.max(0.3, this.baseSize + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.8);
      }

      draw(ctx, time) {
        if (this.size <= 0) return;
        
        const color = this.colorType === "orange" 
          ? `255, ${107 + Math.sin(time) * 20}, 0`
          : `0, ${102 + Math.cos(time) * 20}, 255`;
        
        const alpha = this.sparkle 
          ? this.opacity * (0.7 + Math.sin(time * 5) * 0.3)
          : this.opacity;

        const glowSize = this.size * 3;
        if (glowSize > 0) {
          const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
          gradient.addColorStop(0, `rgba(${color}, ${alpha * 0.4})`);
          gradient.addColorStop(1, `rgba(${color}, 0)`);
          ctx.beginPath();
          ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();
      }
    }

    // ============================================
    // MUSIC NOTE CLASS
    // ============================================
    class MusicNote {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 40;
        this.size = Math.random() * 16 + 10;
        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.3 + 0.08;
        this.wobbleAmp = Math.random() * 2 - 1;
        this.wobbleSpeed = Math.random() * 0.02 + 0.005;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = (Math.random() - 0.5) * 0.3;
        this.symbols = ["♪", "♫", "♬", "♩", "♭", "♮", "♯"];
        this.symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        this.color = Math.random() > 0.5 ? "#FF6B00" : "#0066FF";
        this.fadeIn = true;
        this.fadeProgress = 0;
      }

      update(playing) {
        const speedMult = playing ? 2.2 : 1;
        this.y -= this.speed * speedMult;
        this.angle += this.wobbleSpeed * speedMult;
        this.x += Math.sin(this.angle) * this.wobbleAmp;

        if (this.fadeIn) {
          this.fadeProgress += 0.02;
          if (this.fadeProgress >= 1) this.fadeIn = false;
        }

        if (this.y < -60) {
          this.reset();
        }
      }

      draw(ctx) {
        const alpha = this.fadeIn ? this.opacity * this.fadeProgress : this.opacity;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation + Math.sin(this.angle) * 0.1);
        ctx.font = `${this.size}px "Georgia", serif`;
        
        // Parse hex to rgba
        const hex = this.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.symbol, 0, 0);
        ctx.restore();
      }
    }

    // ============================================
    // SOUND WAVE CLASS
    // ============================================
    class SoundWave {
      constructor() {
        this.points = [];
        this.amplitude = 0;
        this.targetAmplitude = 0;
        this.y = canvas.height * 0.5;
        this.phase = 0;
      }

      update(playing, time) {
        this.targetAmplitude = playing ? 30 : 8;
        this.amplitude += (this.targetAmplitude - this.amplitude) * 0.05;
        this.phase += playing ? 0.03 : 0.008;
        
        const targetY = mouseRef.current.y > 0 ? mouseRef.current.y : canvas.height * 0.5;
        this.y += (targetY - this.y) * 0.02;

        this.points = [];
        const segments = 80;
        for (let i = 0; i <= segments; i++) {
          const x = (canvas.width / segments) * i;
          const wave1 = Math.sin(i * 0.12 + this.phase) * this.amplitude;
          const wave2 = Math.cos(i * 0.08 + this.phase * 1.3) * this.amplitude * 0.6;
          const wave3 = Math.sin(i * 0.05 + this.phase * 0.7) * this.amplitude * 0.3;
          this.points.push({ x, y: this.y + wave1 + wave2 + wave3 });
        }
      }

      draw(ctx) {
        if (this.points.length < 2) return;

        // Orange wave
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = `rgba(255, 107, 0, ${0.08 + this.amplitude * 0.004})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(255, 107, 0, 0.15)";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Blue wave
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y + 15);
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y + 15);
        }
        ctx.strokeStyle = `rgba(0, 102, 255, ${0.06 + this.amplitude * 0.003})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(0, 102, 255, 0.1)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // ============================================
    // INITIALIZE
    // ============================================
    particlesRef.current = [];
    notesRef.current = [];
    const wave = new SoundWave();
    
    for (let i = 0; i < 70; i++) {
      particlesRef.current.push(new Particle());
    }
    for (let i = 0; i < 18; i++) {
      notesRef.current.push(new MusicNote());
    }

    // ============================================
    // ANIMATION LOOP
    // ============================================
    const animate = (timestamp) => {
      if (!isActive) return;
      
      const time = timestamp * 0.001;
      const playing = isPlayingRef.current;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dynamic background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const orangeIntensity = playing ? 0.18 : 0.06;
      const blueIntensity = playing ? 0.15 : 0.05;
      
      gradient.addColorStop(0, "rgba(10, 10, 20, 0.98)");
      gradient.addColorStop(0.3, `rgba(255, 107, 0, ${orangeIntensity})`);
      gradient.addColorStop(0.5, "rgba(18, 18, 34, 0.95)");
      gradient.addColorStop(0.7, `rgba(0, 102, 255, ${blueIntensity})`);
      gradient.addColorStop(1, "rgba(10, 10, 20, 0.98)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vignette
      const vignetteGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.4,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw sound waves
      wave.update(playing, time);
      wave.draw(ctx);

      // Update and draw particles with connections
      particlesRef.current.forEach((p, i) => {
        p.update(time, playing);
        p.draw(ctx, time);

        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const other = particlesRef.current[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100 && dist > 0) {
            const lineAlpha = 0.06 * (1 - dist / 100);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            
            const lineColor = p.colorType === "orange" || other.colorType === "orange"
              ? `rgba(255, 107, 0, ${lineAlpha})`
              : `rgba(0, 102, 255, ${lineAlpha})`;
            
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Update and draw music notes
      notesRef.current.forEach(note => {
        note.update(playing);
        note.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []); // Empty dependency array - runs once

  return (
    <>
      <canvas ref={canvasRef} className="animated-background-canvas" />
      {children}
    </>
  );
}