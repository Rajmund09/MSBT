"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { X, LogOut, LayoutDashboard, Users, Calendar, ClipboardList, Wallet, BarChart2, Receipt, UserCircle } from "lucide-react";
import Magnetic from "./Magnetic";
import { useAuth } from "@/contexts/AuthContext";
import { useInteraction } from "@/contexts/InteractionContext";
import { useSwipe } from "@/hooks/useInteractionGestures";

const NAV_LINKS = [
  { name: "Dashboard", href: "/" },
  { name: "Customers", href: "/customers" },
  { name: "Staff", href: "/users" },
  { name: "Seasons", href: "/seasons" },
  { name: "Entries", href: "/entries" },
  { name: "Payments", href: "/payments" },
  { name: "Analytics", href: "/analytics" },
  { name: "Billing", href: "/billing" },
];

const getIconForLink = (name) => {
  switch (name) {
    case "Dashboard": return LayoutDashboard;
    case "Customers": return Users;
    case "Staff": return UserCircle;
    case "Seasons": return Calendar;
    case "Entries": return ClipboardList;
    case "Payments": return Wallet;
    case "Analytics": return BarChart2;
    case "Billing": return Receipt;
    default: return LayoutDashboard;
  }
};

const AnimatedLogo = () => {
  const letters = ["M", "S", "B", "T"];
  const dotColors = ["text-[#FF3B30]", "text-[#007AFF]", "text-[#FFCC00]", "text-[#34C759]"]; 
  const [index, setIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const { hasHover } = useInteraction();

  useEffect(() => {
    let interval;
    if (isHovering && hasHover) {
      interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % letters.length);
      }, 400);
    } else {
      setIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovering, hasHover]);

  const router = useRouter();

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center cursor-pointer"
      onMouseEnter={() => hasHover && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => router.push('/')}
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
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { enableMagneticButtons, hasHover, isMenuStatic } = useInteraction();

  const isOpen = isMenuStatic || isHovered;

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
      className="fixed left-1/2 -translate-x-1/2 z-[9000] flex items-center justify-center h-[60px]"
      style={{ bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            className="bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-2xl px-12 py-3 shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer h-[60px]"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
              className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl flex items-center px-1 lg:px-2 shadow-xl h-full"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const linkContent = (
                  <motion.div initial="initial" whileHover={hasHover ? "hover" : undefined}>
                    <Link
                      href={link.href}
                      onClick={() => setIsHovered(false)}
                      className="relative px-2.5 py-2 lg:px-5 lg:py-2.5 rounded-full transition-colors flex items-center justify-center group"
                    >
                      <div
                        className={`relative z-10 font-sans font-medium text-[11px] lg:text-[14px] tracking-normal transition-colors flex overflow-hidden ${
                          isActive ? "text-white dark:text-[#111]" : "text-[#111] dark:text-white opacity-60 group-hover:opacity-100"
                        }`}
                      >
                        {hasHover ? (
                          // Desktop: animated character-by-character hover
                          <>
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
                          </>
                        ) : (
                          // Hybrid: plain label, no animation overhead
                          <span>{link.name}</span>
                        )}
                      </div>

                      {/* Active Pill Background */}
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-pill"
                          className="absolute inset-0 bg-[#111] dark:bg-white rounded-full"
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );

                return enableMagneticButtons ? (
                  <Magnetic key={link.name}>{linkContent}</Magnetic>
                ) : (
                  <div key={link.name}>{linkContent}</div>
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
  const { isMenuStatic } = useInteraction();

  useEffect(() => setMounted(true), []);

  // Swipe up on the bottom area to open nav
  const swipeHandlers = useSwipe({
    onSwipeUp: () => setIsOpen(true),
    onSwipeDown: () => setIsOpen(false),
    threshold: 40,
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.replace("/login");
  };

  if (isMenuStatic) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[9000] bg-white dark:bg-[#0a0a0a] border-t border-black/10 dark:border-white/10 overflow-x-auto no-scrollbar shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-start min-w-full px-2 py-2">
          {NAV_LINKS.map((link) => {
            const Icon = getIconForLink(link.name);
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center w-[76px] shrink-0 px-1 py-2 gap-1.5 transition-colors ${isActive ? 'text-[#0056b3] dark:text-white' : 'text-[#4b5563] dark:text-white/50'}`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] font-medium tracking-tight">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

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
            className="fixed inset-0 z-[8999] bg-black/70 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Swipe zone — invisible touch target at bottom of screen */}
      {!isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 h-24 z-[8998] pointer-events-auto"
          {...swipeHandlers}
          aria-hidden="true"
        />
      )}

      <div
        className="fixed left-1/2 -translate-x-1/2 z-[9000] w-full px-4 pointer-events-none flex justify-center"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              key="mobile-closed"
              onClick={() => setIsOpen(true)}
              className="bg-[#111] dark:bg-white border border-black/5 dark:border-white/5 text-white dark:text-[#111] rounded-2xl px-12 py-4 shadow-2xl flex items-center justify-center pointer-events-auto"
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="font-mono text-sm uppercase tracking-widest font-semibold">Menu</span>
            </motion.button>
          ) : (
            <motion.div
              key="mobile-open"
              className="bg-[#0a0a0a] border border-white/10 text-white rounded-[32px] p-6 shadow-2xl w-full pointer-events-auto flex flex-col"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="font-display font-bold text-xl tracking-tighter">
                  M<span className="text-[#FF3B30]">.</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="bg-white/5 active:bg-white/10 w-9 h-9 flex items-center justify-center rounded-full transition-colors">
                  <X size={16} className="text-white/70" />
                </button>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-2 mt-2">
                {NAV_LINKS.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between group py-3 px-4 rounded-2xl transition-all ${isActive ? 'bg-white/10' : 'active:bg-white/5'}`}
                      >
                         <span className={`font-mono text-sm uppercase tracking-widest transition-colors ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}>
                          {link.name}
                        </span>
                        {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer / Toggle + Logout */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center px-2"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="h-6 relative flex items-center"
                  >
                    <div className="flex items-center gap-2">
                      {mounted && theme === "dark" ? (
                        <>
                          <motion.div layoutId="mobile-theme-dot-1" className="w-3 h-3 bg-white rounded-full" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                          <motion.div layoutId="mobile-theme-dot-2" className="w-1.5 h-1.5 bg-white/30 rounded-full" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                        </>
                      ) : (
                        <>
                          <motion.div layoutId="mobile-theme-dot-2" className="w-1.5 h-1.5 bg-white/30 rounded-full" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                          <motion.div layoutId="mobile-theme-dot-1" className="w-3 h-3 bg-white rounded-full" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default function FloatingNav() {
  // Use responsive breakpoints to decide which nav to show.
  // This ensures that large touch devices (like iPads) get the desktop nav,
  // preventing the mobile bottom bar from stretching awkwardly across large screens.
  return (
    <>
      <div className="hidden md:block w-full"><DesktopNav /></div>
      <div className="md:hidden w-full"><MobileNav /></div>
    </>
  );
}
