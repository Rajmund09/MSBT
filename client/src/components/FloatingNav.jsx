"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import Magnetic from "./Magnetic";

const NAV_LINKS = [
  { name: "Dashboard", href: "/" },
  { name: "Customers", href: "/customers" },
  { name: "Seasons", href: "/seasons" },
  { name: "Entries", href: "/entries" },
  { name: "Payments", href: "/payments" },
];

const AnimatedLogo = () => {
  const letters = ["M", "S", "B", "T"];
  const dotColors = ["text-[#FF3B30]", "text-[#007AFF]", "text-[#FFCC00]", "text-[#34C759]"]; 
  const [index, setIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let interval;
    if (isHovering) {
      interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % letters.length);
      }, 400);
    } else {
      setIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0, position: "absolute" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-bold text-[28px] tracking-tighter flex items-center text-white"
        >
          {letters[index]}<span className={`${dotColors[index]} text-[32px] leading-none transition-colors duration-300 -ml-0.5`}>.</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const DesktopNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9000] flex items-center justify-center h-[60px]"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* CLOSED STATE */
          <motion.div
            key="closed"
            layoutId="nav-middle"
            className="bg-[#111] text-white rounded-[20px] px-8 py-3 shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer h-[60px]"
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-sans font-medium text-[15px] tracking-normal"
            >
              Menu
            </motion.span>
          </motion.div>
        ) : (
          /* OPEN STATE */
          <motion.div
            key="open"
            className="flex items-center gap-3 h-[60px]"
          >
            {/* LEFT BLOCK: LOGO */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-[60px] h-[60px] bg-[#111] rounded-[20px] shadow-xl overflow-hidden"
            >
              <AnimatedLogo />
            </motion.div>

            {/* MIDDLE BLOCK: LINKS */}
            <motion.div
              layoutId="nav-middle"
              className="bg-[#F2F2F2] border border-black/5 rounded-[20px] flex items-center px-2 shadow-xl h-full"
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Magnetic key={link.name}>
                    <motion.div initial="initial" whileHover="hover">
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="relative px-5 py-2.5 rounded-full transition-colors flex items-center justify-center group"
                      >
                        <div
                          className={`relative z-10 font-sans font-medium text-[14px] tracking-normal transition-colors flex overflow-hidden ${
                            isActive ? "text-white" : "text-[#111] opacity-60 group-hover:opacity-100"
                          }`}
                        >
                          <div className="flex">
                            {link.name.split("").map((char, idx) => (
                              <motion.span
                                key={idx}
                                variants={{
                                  initial: { y: 0 },
                                  hover: { y: "-100%" },
                                }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: idx * 0.015 }}
                                className="inline-block"
                              >
                                {char === " " ? "\u00A0" : char}
                              </motion.span>
                            ))}
                          </div>
                          <div className="absolute inset-0 flex">
                            {link.name.split("").map((char, idx) => (
                              <motion.span
                                key={idx}
                                variants={{
                                  initial: { y: "100%" },
                                  hover: { y: 0 },
                                }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: idx * 0.015 }}
                                className="inline-block"
                              >
                                {char === " " ? "\u00A0" : char}
                              </motion.span>
                            ))}
                          </div>
                        </div>

                        {/* Active Pill Background */}
                        {isActive && (
                          <motion.div
                            layoutId="active-nav-pill"
                            className="absolute inset-0 bg-[#111] rounded-full"
                            transition={{ type: "spring", stiffness: 250, damping: 25 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  </Magnetic>
                );
              })}
            </motion.div>

            {/* RIGHT BLOCK: THEME TOGGLE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-[60px] h-[60px] bg-[#111] rounded-[20px] flex items-center justify-center shadow-xl cursor-pointer"
              onClick={toggleTheme}
            >
              <div className="w-[36px] h-[20px] bg-white/20 rounded-full relative flex items-center px-[2px]">
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{
                    x: mounted && theme === "dark" ? 16 : 0,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[8999] bg-black/40 backdrop-blur-sm pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] w-full px-4 pointer-events-none flex justify-center">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              key="mobile-closed"
              layoutId="mobile-nav"
              onClick={() => setIsOpen(true)}
              className="bg-[#111] text-white rounded-full px-8 py-3.5 shadow-2xl flex items-center justify-center pointer-events-auto"
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <span className="font-sans font-medium text-[15px] tracking-wide">Menu</span>
            </motion.button>
          ) : (
            <motion.div
              key="mobile-open"
              layoutId="mobile-nav"
              className="bg-[#111] text-white rounded-[32px] p-6 shadow-2xl w-full pointer-events-auto flex flex-col"
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="font-display font-bold text-2xl tracking-tighter">
                  M<span className="text-[#FF3B30]">.</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-full active:scale-95 transition-transform">
                  <X size={18} />
                </button>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-5 mt-2">
                {NAV_LINKS.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between group"
                      >
                        <span className={`font-sans font-medium text-3xl tracking-tight transition-colors ${isActive ? 'text-white' : 'text-white/40 group-active:text-white'}`}>
                          {link.name}
                        </span>
                        {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer / Toggle */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center"
              >
                <span className="font-sans text-[15px] font-medium text-white/40">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="w-[48px] h-[26px] bg-white/20 rounded-full relative flex items-center px-[3px] active:scale-95 transition-transform"
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                    animate={{ x: mounted && theme === "dark" ? 22 : 0 }}
                  />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default function FloatingNav() {
  return (
    <>
      <div className="hidden md:block">
        <DesktopNav />
      </div>
      <div className="md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
