"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import PixelTransition from "./PixelTransition";

export default function TransitionProvider({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout">
      <motion.div key={pathname} className="w-full">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
