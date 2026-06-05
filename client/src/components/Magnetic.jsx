"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useEffect } from "react";

export default function Magnetic({ children }) {
  const ref = useRef(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Apply spring physics for the magnetic pull
  const smoothX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const smoothY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    
    // Magnetic pull strength
    x.set(middleX * 0.2);
    y.set(middleY * 0.2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: smoothX, y: smoothY }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
}
