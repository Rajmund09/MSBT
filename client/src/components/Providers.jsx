"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { ReactLenis } from "lenis/react";
import { ToastProvider } from "./ui/Toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InteractionProvider, useInteraction } from "@/contexts/InteractionContext";
import Loader from "./Loader";
import FloatingNav from "./FloatingNav";
import TopLogo from "./TopLogo";
import GlobalSearch from "./GlobalSearch";
import AccountDropdown from "./AccountDropdown";
import dynamic from "next/dynamic";

// Inner component so it can use useAuth + useInteraction
function AppShell({ children }) {
  const { user, loading } = useAuth();
  const { enableCustomCursor, isTouch } = useInteraction();
  const pathname = usePathname();
  const router = useRouter();
  const [appLoaded, setAppLoaded] = useState(false);

  const isLoginPage = pathname === "/login";

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login");
    }
  }, [user, loading, isLoginPage, router]);

  // Disable smooth scroll on touch — Lenis can conflict with native momentum scroll
  // On touch devices, native scroll is faster and more responsive
  const lenisOptions = isTouch
    ? { lerp: 1, smoothTouch: false }
    : { lerp: 0.08, duration: 1.5, smoothTouch: false };

  // On login page — render children directly (no nav/loader)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While checking auth
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in but not yet redirected
  if (!user) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {!appLoaded && (
          <Loader key="loader" onComplete={() => setAppLoaded(true)} />
        )}
      </AnimatePresence>

      {appLoaded && (
        <>
          <TopLogo />
          <FloatingNav />
          <GlobalSearch />
          <AccountDropdown />
          <AnimatePresence mode="wait" initial={true}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-screen flex flex-col"
              style={{
                paddingTop: 'clamp(5rem, 10vw, 8rem)',
                paddingBottom: 'calc(clamp(5.5rem, 10vw, 8rem) + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </>
  );
}

// Wraps AppShell with Lenis that reacts to interaction type
function LenisWrapper({ children }) {
  const { isTouch } = useInteraction();
  const options = isTouch
    ? { lerp: 1, smoothTouch: false, prevent: () => true }  // native scroll on touch
    : { lerp: 0.08, duration: 1.5, smoothTouch: false };

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <InteractionProvider>
        <LenisWrapper>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </ThemeProvider>
        </LenisWrapper>
      </InteractionProvider>
    </ToastProvider>
  );
}
