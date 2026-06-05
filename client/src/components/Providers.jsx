"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Loader from "./Loader";
import FloatingNav from "./FloatingNav";
import TopLogo from "./TopLogo";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }) {
  const pathname = usePathname();
  const [appLoaded, setAppLoaded] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {/* Loader Sequence */}
      <AnimatePresence mode="wait">
        {!appLoaded && (
          <Loader key="loader" onComplete={() => setAppLoaded(true)} />
        )}
      </AnimatePresence>

      {/* Main Application with Shared Elements */}
      {appLoaded && (
        <>
          <TopLogo />
          <FloatingNav />
          <AnimatePresence mode="wait" initial={true}>
            <motion.div 
              key={pathname} 
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-screen flex flex-col pt-32 pb-32"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </ThemeProvider>
  );
}
