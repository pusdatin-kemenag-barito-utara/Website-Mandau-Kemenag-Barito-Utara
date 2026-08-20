import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
  pulseAngle: number;
  isBubble?: boolean;
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let isVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const colors = [
      "rgba(16, 185, 129, ",  // emerald-500
      "rgba(52, 211, 153, ",  // emerald-400
      "rgba(20, 184, 166, ",   // teal-500
      "rgba(110, 231, 183, ",  // emerald-300
      "rgba(245, 158, 11, ",   // amber/gold accent
    ];

    const particleCount = 85;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isBubble = i % 3 === 0;
      const z = Math.random() * 0.7 + 0.3;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: isBubble ? (Math.random() * 16 + 8) * z : (Math.random() * 4 + 2) * z,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.45 + 0.35,
        alpha: Math.random() * 0.45 + 0.35,
        vx: (Math.random() - 0.5) * 0.5 * z,
        vy: (Math.random() * -0.5 - 0.2) * z,
        pulseSpeed: Math.random() * 0.035 + 0.015,
        pulseAngle: Math.random() * Math.PI * 2,
        isBubble,
      });
    }

    let time = 0;

    const render = () => {
      if (!isVisible) return;
      time += 0.01;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Bright glowing background aura orbs
      const glow1X = width * 0.25 + Math.sin(time) * 50;
      const glow1Y = height * 0.3 + Math.cos(time * 0.8) * 40;
      const bgGlow1 = ctx.createRadialGradient(glow1X, glow1Y, 15, glow1X, glow1Y, width * 0.4);
      bgGlow1.addColorStop(0, "rgba(52, 211, 153, 0.25)");
      bgGlow1.addColorStop(0.6, "rgba(16, 185, 129, 0.1)");
      bgGlow1.addColorStop(1, "rgba(248, 250, 252, 0)");
      ctx.fillStyle = bgGlow1;
      ctx.fillRect(0, 0, width, height);

      const glow2X = width * 0.75 + Math.cos(time * 0.7) * 60;
      const glow2Y = height * 0.7 + Math.sin(time * 0.9) * 50;
      const bgGlow2 = ctx.createRadialGradient(glow2X, glow2Y, 15, glow2X, glow2Y, width * 0.45);
      bgGlow2.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      bgGlow2.addColorStop(0.6, "rgba(20, 184, 166, 0.08)");
      bgGlow2.addColorStop(1, "rgba(248, 250, 252, 0)");
      ctx.fillStyle = bgGlow2;
      ctx.fillRect(0, 0, width, height);

      // Render Floating particles & bubbles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const parallaxX = ((mouseX - width / 2) / (width / 2)) * 20 * p.z;
        const parallaxY = ((mouseY - height / 2) / (height / 2)) * 20 * p.z;

        p.x += p.vx;
        p.y += p.vy;

        p.pulseAngle += p.pulseSpeed;
        p.alpha = Math.min(0.85, Math.max(0.25, p.baseAlpha + Math.sin(p.pulseAngle) * 0.2));

        if (p.y < -25) {
          p.y = height + 25;
          p.x = Math.random() * width;
        }
        if (p.x < -25) p.x = width + 25;
        if (p.x > width + 25) p.x = -25;

        const drawX = p.x + parallaxX;
        const drawY = p.y + parallaxY;

        ctx.save();
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);

        if (p.isBubble) {
          const gradient = ctx.createRadialGradient(
            drawX - p.radius * 0.3,
            drawY - p.radius * 0.3,
            p.radius * 0.1,
            drawX,
            drawY,
            p.radius
          );
          gradient.addColorStop(0, p.color + (p.alpha * 0.9) + ")");
          gradient.addColorStop(0.6, p.color + (p.alpha * 0.4) + ")");
          gradient.addColorStop(1, p.color + "0.08)");

          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.strokeStyle = p.color + (p.alpha * 0.95) + ")";
          ctx.lineWidth = 1.2 * p.z;
          ctx.stroke();
        } else {
          const glowRadius = p.radius * 2.8;
          const starGlow = ctx.createRadialGradient(
            drawX,
            drawY,
            0,
            drawX,
            drawY,
            glowRadius
          );
          starGlow.addColorStop(0, p.color + p.alpha + ")");
          starGlow.addColorStop(0.5, p.color + (p.alpha * 0.45) + ")");
          starGlow.addColorStop(1, p.color + "0)");

          ctx.fillStyle = starGlow;
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
