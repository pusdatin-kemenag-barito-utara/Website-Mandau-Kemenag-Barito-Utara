"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

export function FramerProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
