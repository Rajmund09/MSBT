"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

/**
 * CustomCursor — premium desktop-only cursor with:
 * - Smooth spring-based trailing dot
 * - Ghost ring that lags behind
 * - Cursor spotlight (radial glow that follows cursor)
 * - Auto-hides when mouse leaves window
 * - Scales up on interactive elements
 */
export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState("default"); // default | hover | text | click
  const [spotlightPos, setSpotlightPos] = useState({ x: -999, y: -999 });

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  // Dot: very fast
  const dotX = useSpring(rawX, { damping: 50, stiffness: 900, mass: 0.3 });
  const dotY = useSpring(rawY, { damping: 50, stiffness: 900, mass: 0.3 });

  // Ring: lags behind
  const ringX = useSpring(rawX, { damping: 28, stiffness: 200, mass: 0.8 });
  const ringY = useSpring(rawY, { damping: 28, stiffness: 200, mass: 0.8 });

  useEffect(() => {
    const onMouseMove = (e) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setSpotlightPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    const onMouseDown = () => setVariant("click");
    const onMouseUp   = () => setVariant(v => v === "click" ? "default" : v);

    // Detect hoverable interactive elements
    const onElementHover = (e) => {
      const el = e.target;
      const tag = el.tagName?.toLowerCase();
      if (tag === "a" || tag === "button" || el.closest("a") || el.closest("button") ||
          el.dataset.cursor === "hover" || el.getAttribute("role") === "button") {
        setVariant("hover");
      } else if (tag === "input" || tag === "textarea" || el.contentEditable === "true") {
        setVariant("text");
      } else {
        setVariant("default");
      }
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onElementHover, { passive: true });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onElementHover);
    };
  }, [rawX, rawY, visible]);

  const dotVariants = {
    default: { scale: 1,    opacity: 1,    backgroundColor: "rgba(255,255,255,0.9)" },
    hover:   { scale: 0,    opacity: 0,    backgroundColor: "rgba(255,255,255,0.0)" },
    text:    { scale: 1,    opacity: 0.5,  backgroundColor: "rgba(255,255,255,0.6)", scaleY: 2.5, scaleX: 0.3 },
    click:   { scale: 0.6,  opacity: 1,    backgroundColor: "rgba(255,255,255,1)" },
  };

  const ringVariants = {
    default: { scale: 1,    opacity: 0.5,  borderColor: "rgba(255,255,255,0.3)" },
    hover:   { scale: 2.2,  opacity: 0.8,  borderColor: "rgba(255,255,255,0.6)" },
    text:    { scale: 1.2,  opacity: 0.3,  borderColor: "rgba(255,255,255,0.2)" },
    click:   { scale: 0.8,  opacity: 0.9,  borderColor: "rgba(255,255,255,0.8)" },
  };

  return (
    <>
      {/* Cursor Spotlight — subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-[9990] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      >
        <div
          style={{
            position: "absolute",
            left: spotlightPos.x,
            top: spotlightPos.y,
            width: 400,
            height: 400,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Ring — lagging outer circle */}
      <motion.div
        className="pointer-events-none fixed z-[9999]"
        style={{
          left: ringX,
          top: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={ringVariants[variant]}
        transition={{ duration: 0.2, ease: "easeOut" }}
        aria-hidden="true"
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.3)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        />
      </motion.div>

      {/* Dot — fast-following center */}
      <motion.div
        className="pointer-events-none fixed z-[9999]"
        style={{
          left: dotX,
          top: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={dotVariants[variant]}
        transition={{ duration: 0.15, ease: "easeOut" }}
        aria-hidden="true"
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.9)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        />
      </motion.div>
    </>
  );
}
