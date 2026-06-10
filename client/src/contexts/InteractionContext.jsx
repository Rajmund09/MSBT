"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const InteractionContext = createContext({
  // Pointer capabilities
  hasHover: false,
  hasFinePointer: false,    // mouse
  hasCoarsePointer: false,  // touch

  // Input types detected
  isMouse: false,
  isTouch: false,
  isStylus: false,
  isKeyboard: false,

  // Derived experience type
  deviceType: "touch",       // "desktop" | "touch" | "hybrid"

  // Feature flags
  enableCustomCursor: false,
  enableMagneticButtons: false,
  enableHoverEffects: false,
  enableCursorSpotlight: false,
  enableHeavyAnimations: false,

  // User preferences
  isMenuStatic: false,
  setIsMenuStatic: () => {},
});

export function InteractionProvider({ children }) {
  const [state, setState] = useState({
    hasHover: false,
    hasFinePointer: false,
    hasCoarsePointer: true,
    isMouse: false,
    isTouch: true,
    isStylus: false,
    isKeyboard: false,
    deviceType: "touch",
    enableCustomCursor: false,
    enableMagneticButtons: false,
    enableHoverEffects: false,
    enableCursorSpotlight: false,
    enableHeavyAnimations: false,
    isMenuStatic: false,
  });

  const setIsMenuStatic = useCallback((value) => {
    setState(prev => ({ ...prev, isMenuStatic: value }));
    localStorage.setItem("isMenuStatic", value);
  }, []);

  useEffect(() => {
    // Read media queries
    const hoverQuery = window.matchMedia("(hover: hover)");
    const fineQuery = window.matchMedia("(pointer: fine)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");

    function computeState(hoverMQ, fineMQ, coarseMQ) {
      const hasHover = hoverMQ.matches;
      const hasFinePointer = fineMQ.matches;
      const hasCoarsePointer = coarseMQ.matches;

      // Desktop = hover capable + fine pointer (mouse)
      // Touch   = no hover + coarse pointer
      // Hybrid  = both (like Surface, iPad with pencil)
      const isMouse = hasFinePointer && hasHover;
      const isTouch = hasCoarsePointer;

      let deviceType = "touch";
      if (hasFinePointer && hasHover && !hasCoarsePointer) {
        deviceType = "desktop";
      } else if (hasFinePointer && hasCoarsePointer) {
        deviceType = "hybrid";
      }

      return {
        hasHover,
        hasFinePointer,
        hasCoarsePointer,
        isMouse,
        isTouch,
        isStylus: false,
        isKeyboard: false,
        deviceType,
        enableCustomCursor: deviceType === "desktop",
        enableMagneticButtons: deviceType === "desktop",
        enableHoverEffects: deviceType === "desktop" || deviceType === "hybrid",
        enableCursorSpotlight: deviceType === "desktop",
        enableHeavyAnimations: deviceType === "desktop",
        isMenuStatic: false, // will be overridden by prev state
      };
    }

    const update = () => {
      setState(prev => ({ ...computeState(hoverQuery, fineQuery, coarseQuery), isMenuStatic: prev.isMenuStatic }));
    };

    // Initial read
    const initialState = computeState(hoverQuery, fineQuery, coarseQuery);
    const stored = localStorage.getItem("isMenuStatic");
    if (stored !== null) {
      initialState.isMenuStatic = stored === "true";
    }
    setState(initialState);

    // Listen for changes (e.g., user connects mouse to tablet)
    hoverQuery.addEventListener("change", update);
    fineQuery.addEventListener("change", update);
    coarseQuery.addEventListener("change", update);

    // Also detect actual touch/mouse events fired — overrides MQ if user
    // starts using a different input type at runtime
    const onTouchStart = () => {
      setState(prev => {
        if (prev.isTouch) return prev;
        return { ...prev, isTouch: true };
      });
    };
    const onMouseMove = () => {
      setState(prev => {
        if (prev.isMouse) return prev;
        return { ...prev, isMouse: true };
      });
    };
    const onKeyDown = () => {
      setState(prev => ({ ...prev, isKeyboard: true }));
    };
    const onKeyUp = () => {
      setState(prev => ({ ...prev, isKeyboard: false }));
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("keyup", onKeyUp, { passive: true });

    return () => {
      hoverQuery.removeEventListener("change", update);
      fineQuery.removeEventListener("change", update);
      coarseQuery.removeEventListener("change", update);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <InteractionContext.Provider value={{ ...state, setIsMenuStatic }}>
      {children}
    </InteractionContext.Provider>
  );
}

export function useInteraction() {
  return useContext(InteractionContext);
}
