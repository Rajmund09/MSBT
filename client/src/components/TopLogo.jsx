"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function TopLogo() {
  const letters = ["M", "S", "B", "T"];
  const dotColors = ["text-[#FF3B30]", "text-[#007AFF]", "text-[#FFCC00]", "text-[#34C759]"]; 
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % letters.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-6 left-6 md:top-10 md:left-10 z-[9000] flex items-center gap-6 pointer-events-none">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex items-center justify-center w-[60px] h-[60px] bg-[#111] rounded-[20px] shadow-2xl overflow-hidden pointer-events-auto cursor-pointer"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            <motion.div
              key={index}
              initial={{ x: -20, y: 20, scaleY: 0.3, scaleX: 1.2, opacity: 0, filter: "blur(4px)" }}
              animate={{ x: 0, y: 0, scaleY: 1, scaleX: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ x: 20, y: 20, scaleY: 0.3, scaleX: 1.2, opacity: 0, filter: "blur(4px)", position: "absolute" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center font-display font-bold text-[28px] tracking-tighter text-white"
            >
              {letters[index]}<span className={`${dotColors[index]} text-[32px] leading-none transition-colors duration-1000 -ml-0.5`}>.</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
