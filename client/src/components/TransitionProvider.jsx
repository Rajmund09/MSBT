"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import PixelTransition from "./PixelTransition";

export default function TransitionProvider({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} className="w-full">
        {/* The exit animation logic is driven entirely by the PixelTransition component overlaying the screen. */}
        <PixelTransition />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
