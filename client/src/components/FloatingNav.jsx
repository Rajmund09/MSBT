"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { X, LogOut } from "lucide-react";
import Magnetic from "./Magnetic";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { name: "Dashboard", href: "/" },
  { name: "Customers", href: "/customers" },
  { name: "Seasons", href: "/seasons" },
  { name: "Entries", href: "/entries" },
  { name: "Payments", href: "/payments" },
  { name: "Analytics", href: "/analytics" },
  { name: "Billing", href: "/billing" },
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
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
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

            {/* RIGHT BLOCK: THEME TOGGLE + LOGOUT */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-[60px] h-[60px] bg-[#111] rounded-[20px] flex items-center justify-center shadow-xl cursor-pointer"
                onClick={toggleTheme}
              >
                <div className="flex items-center gap-2">
                  {mounted && theme === "dark" ? (
                    <>
                      <motion.div layoutId="desktop-theme-dot-1" className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                      <motion.div layoutId="desktop-theme-dot-2" className="w-1.5 h-1.5 bg-white/30 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    </>
                  ) : (
                    <>
                      <motion.div layoutId="desktop-theme-dot-2" className="w-1.5 h-1.5 bg-white/30 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                      <motion.div layoutId="desktop-theme-dot-1" className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    </>
                  )}
                </div>
              </div>
              {user && (
                <motion.button
                  onClick={handleLogout}
                  title={`Logout (${user.fullName || user.username})`}
                  className="w-[60px] h-[60px] bg-[#111] rounded-[20px] flex items-center justify-center shadow-xl cursor-pointer hover:bg-red-900/40 transition-colors group"
                >
                  <LogOut size={18} className="text-white/40 group-hover:text-red-400 transition-colors" />
                </motion.button>
              )}
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
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.replace("/login");
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

              {/* Footer / Toggle + Logout */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center"
              >
                <span className="font-sans text-[15px] font-medium text-white/40">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="h-[26px] relative flex items-center active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-2">
                    {mounted && theme === "dark" ? (
                      <>
                        <motion.div layoutId="mobile-theme-dot-1" className="w-4 h-4 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                        <motion.div layoutId="mobile-theme-dot-2" className="w-2 h-2 bg-white/30 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                      </>
                    ) : (
                      <>
                        <motion.div layoutId="mobile-theme-dot-2" className="w-2 h-2 bg-white/30 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                        <motion.div layoutId="mobile-theme-dot-1" className="w-4 h-4 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                      </>
                    )}
                  </div>
                </button>
              </motion.div>
              {user && (
                <motion.button
                  onClick={handleLogout}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-4 flex items-center gap-3 text-white/40 active:text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="font-sans text-sm">Sign out — {user.fullName || user.username}</span>
                </motion.button>
              )}
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
