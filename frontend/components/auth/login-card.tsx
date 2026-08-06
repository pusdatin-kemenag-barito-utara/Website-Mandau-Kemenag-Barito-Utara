"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

export function LoginCardMotion({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 40, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        type: "spring",
        stiffness: 200,
        damping: 22,
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

const PARTICLES = [
  { size: 4, x: "10%", y: "15%", delay: 0, duration: 6 },
  { size: 6, x: "85%", y: "20%", delay: 1, duration: 8 },
  { size: 3, x: "25%", y: "75%", delay: 2, duration: 7 },
  { size: 5, x: "70%", y: "60%", delay: 0.5, duration: 9 },
  { size: 4, x: "50%", y: "85%", delay: 1.5, duration: 6.5 },
  { size: 3, x: "90%", y: "40%", delay: 3, duration: 7.5 },
  { size: 6, x: "15%", y: "50%", delay: 2.5, duration: 8.5 },
  { size: 4, x: "60%", y: "10%", delay: 0.8, duration: 6 },
];

export function LoginBgMotion() {
  return (
    <>
      <m.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, -8, 4, 0],
          x: [0, -20, 10, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#10b981]/10 blur-[120px]"
      />
      <m.div
        animate={{
          scale: [1, 1.25, 0.95, 1],
          rotate: [0, 6, -4, 0],
          y: [0, 20, -10, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#34d399]/15 blur-[120px]"
      />
      <m.div
        animate={{
          scale: [1, 1.3, 0.9, 1],
          x: [0, -30, 15, 0],
          y: [0, 15, -25, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-emerald-300/10 blur-[100px]"
      />

      {PARTICLES.map((p, i) => (
        <m.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          className="pointer-events-none absolute rounded-full bg-emerald-400"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
          }}
        />
      ))}
    </>
  );
}
