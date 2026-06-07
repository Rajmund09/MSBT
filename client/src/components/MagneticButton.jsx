"use client";

import { useRef, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useInteraction } from "@/contexts/InteractionContext";

/**
 * MagneticButton — wraps any element to give it magnetic mouse attraction on desktop.
 * On touch devices, renders children as-is without any magnetic effect.
 *
 * Usage:
 *   <MagneticButton strength={0.4}>
 *     <button>Click me</button>
 *   </MagneticButton>
 */
export default function MagneticButton({ children, strength = 0.35, className = "" }) {
  const { enableMagneticButtons } = useInteraction();
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 20, stiffness: 300, mass: 0.5 });
  const springY = useSpring(y, { damping: 20, stiffness: 300, mass: 0.5 });

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }, [x, y, strength]);

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (!enableMagneticButtons) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}
