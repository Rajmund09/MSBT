"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInteraction } from "@/contexts/InteractionContext";
import { useLongPress } from "@/hooks/useInteractionGestures";

/**
 * AdaptiveTooltip — smart tooltip that adapts to input type:
 *
 * Desktop (hover):   Shows floating tooltip on hover
 * Mobile (touch):    Shows bottom sheet on long press
 * Hybrid:           Shows tooltip on hover, long press for mobile
 *
 * Usage:
 *   <AdaptiveTooltip content="Edit customer">
 *     <button>...</button>
 *   </AdaptiveTooltip>
 */
export default function AdaptiveTooltip({ content, children, placement = "top" }) {
  const { hasHover, isTouch } = useInteraction();
  const [visible, setVisible] = useState(false);

  // Desktop hover tooltip
  const hoverProps = hasHover ? {
    onMouseEnter: () => setVisible(true),
    onMouseLeave: () => setVisible(false),
  } : {};

  // Mobile long press bottom sheet
  const longPress = useLongPress(
    isTouch ? () => setVisible(true) : undefined,
    { delay: 600 }
  );

  const placementStyles = {
    top:    { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)",    left: "50%", transform: "translateX(-50%)" },
    left:   { right: "calc(100% + 8px)",  top: "50%",  transform: "translateY(-50%)" },
    right:  { left: "calc(100% + 8px)",   top: "50%",  transform: "translateY(-50%)" },
  };

  return (
    <>
      <div
        className="relative inline-flex"
        {...hoverProps}
        {...(isTouch ? longPress : {})}
      >
        {children}

        {/* Desktop: hover tooltip */}
        {hasHover && (
          <AnimatePresence>
            {visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: placement === "top" ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: placement === "top" ? 4 : -4 }}
                transition={{ duration: 0.12 }}
                className="absolute z-50 pointer-events-none"
                style={placementStyles[placement]}
              >
                <div className="bg-[#1a1a1a] border border-white/10 text-white/80 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap px-2.5 py-1.5 rounded-lg shadow-xl">
                  {content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Mobile: long press bottom sheet */}
      {isTouch && (
        <AnimatePresence>
          {visible && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
                onClick={() => setVisible(false)}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="fixed bottom-0 left-0 right-0 z-[201] bg-[#111] border-t border-white/10 rounded-t-3xl px-6 py-8"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
              >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                <p className="font-mono text-sm text-white/80 text-center">{content}</p>
                <button
                  onClick={() => setVisible(false)}
                  className="mt-6 w-full h-12 rounded-2xl border border-white/10 font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white/70 transition-all"
                >
                  Dismiss
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
