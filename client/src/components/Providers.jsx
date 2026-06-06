"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { ReactLenis } from "lenis/react";
import { ToastProvider } from "./ui/Toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Loader from "./Loader";
import FloatingNav from "./FloatingNav";
import TopLogo from "./TopLogo";
import CustomCursor from "./CustomCursor";
import GlobalSearch from "./GlobalSearch";

// Inner component so it can use useAuth
function AppShell({ children }) {
  const { user, loading } = useAuth();
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
      <CustomCursor />
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
    </>
  );
}

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothTouch: true }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </ReactLenis>
    </ToastProvider>
  );
}
