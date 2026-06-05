"use client";

import { motion, useAnimation, useMotionValue, useSpring, useMotionTemplate, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const PREMIUM_EASE = [0.22, 1, 0.36, 1];

export default function Loader({ onComplete }) {
  const containerCtrl = useAnimation();
  const piecesCtrl = useAnimation();
  const lettersCtrl = useAnimation();
  const wrapperCtrl = useAnimation();

  // Mouse Tracking for Spotlight (Init to 0 for strict SSR Hydration matching)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Speed tracking for dynamic intensity
  const rawSpeed = useMotionValue(0);
  const smoothSpeed = useSpring(rawSpeed, { stiffness: 60, damping: 30, mass: 0.5 }); // Cinematic fluid decay

  // Map speed to visual properties
  // Speed values: 0 (stationary) -> 10 (slow) -> 50+ (fast)
  const maskOpacity = useTransform(smoothSpeed, [0, 5, 40], [0, 0.4, 1]);
  const maskRadius = useTransform(smoothSpeed, [0, 10, 50], [50, 300, 600]);

  useEffect(() => {
    // Initial center position safely after hydration
    mouseX.set(window.innerWidth / 2);
    mouseY.set(window.innerHeight / 2);

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    let lastX = mouseX.get();
    let lastY = mouseY.get();
    let lastTime = performance.now();
    let animationFrame;

    const updateVelocity = () => {
      const time = performance.now();
      const dt = Math.max(1, time - lastTime); // avoid divide by zero
      
      const currentX = mouseX.get();
      const currentY = mouseY.get();
      
      const dx = currentX - lastX;
      const dy = currentY - lastY;
      
      // Calculate raw velocity (pixels per ms) and scale up for easier mapping
      const currentSpeed = (Math.sqrt(dx * dx + dy * dy) / dt) * 10;
      
      // Update motion value
      rawSpeed.set(currentSpeed);

      lastX = currentX;
      lastY = currentY;
      lastTime = time;

      animationFrame = requestAnimationFrame(updateVelocity);
    };

    animationFrame = requestAnimationFrame(updateVelocity);
    return () => cancelAnimationFrame(animationFrame);
  }, [mouseX, mouseY, rawSpeed]);

  // Smooth out the mouse movements using Spring Physics
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  // 3D Parallax Shift specifically for the Hover Layer (Makes it pop off the screen)
  const parallaxX = useTransform(smoothX, [0, typeof window !== "undefined" ? window.innerWidth : 2000], [-30, 30]);
  const parallaxY = useTransform(smoothY, [0, typeof window !== "undefined" ? window.innerHeight : 1000], [-30, 30]);

  useEffect(() => {
    async function sequence() {
      // 1. Squares fly in from corners using Spring physics, starting heavily blurred
      piecesCtrl.start(i => ({
        x: i === 0 || i === 2 ? -18 : 18,
        y: i === 0 || i === 1 ? -18 : 18,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 120, damping: 14, delay: i * 0.1 }
      }));

      // 2. The entire assembled cube rotates to flat (Premium Ease)
      await containerCtrl.start({
        rotate: 0,
        scale: 1.1,
        transition: { duration: 1.2, ease: PREMIUM_EASE, delay: 0.8 }
      });

      // 3. The cube splits horizontally revealing the 4 blocks
      await piecesCtrl.start(i => ({
        x: (i - 1.5) * 80, // Expands to: -120, -40, 40, 120
        y: 0,
        transition: { duration: 1.0, ease: PREMIUM_EASE }
      }));

      // 4. Blocks shrink and blur away
      piecesCtrl.start({
        scale: 0,
        opacity: 0,
        filter: "blur(12px)",
        transition: { duration: 0.8, ease: PREMIUM_EASE }
      });

      // 5. Letters elegantly scale up from a blur exactly where the blocks were
      await lettersCtrl.start(i => ({
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.2, ease: PREMIUM_EASE, delay: i * 0.08 }
      }));

      // 6. Smooth exit transition of the entire loader
      setTimeout(() => {
        wrapperCtrl.start({
          opacity: 0,
          scale: 1.05,
          filter: "blur(10px)",
          transition: { duration: 1.5, ease: PREMIUM_EASE }
        }).then(() => onComplete());
      }, 1200);
    }
    
    sequence();
  }, [containerCtrl, piecesCtrl, lettersCtrl, wrapperCtrl, onComplete]);

  const LETTERS = ["M", "S", "B", "T"];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={wrapperCtrl}
      className="fixed inset-0 z-[10000] bg-[#050505] flex items-center justify-center pointer-events-auto overflow-hidden"
    >
      {/* Film Grain Texture overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Base Layer: Faint tire pattern covering entire background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='translate(12, 12)'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3Cline x1='12' y1='2' x2='12' y2='4'/%3E%3Cline x1='12' y1='20' x2='12' y2='22'/%3E%3Cline x1='2' y1='12' x2='4' y2='12'/%3E%3Cline x1='20' y1='12' x2='22' y2='12'/%3E%3Cline x1='4.93' y1='4.93' x2='6.34' y2='6.34'/%3E%3Cline x1='17.66' y1='17.66' x2='19.07' y2='19.07'/%3E%3Cline x1='4.93' y1='19.07' x2='6.34' y2='17.66'/%3E%3Cline x1='17.66' y1='6.34' x2='19.07' y2='4.93'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '32px 32px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Dynamic Velocity-Driven 3D Parallax Hover Layer */}
      <motion.div
        className="absolute inset-[-100px] z-0 pointer-events-none"
        style={{
          opacity: maskOpacity,
          scale: 1.05,
          x: parallaxX,
          y: parallaxY,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='translate(12, 12)'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3Cline x1='12' y1='2' x2='12' y2='4'/%3E%3Cline x1='12' y1='20' x2='12' y2='22'/%3E%3Cline x1='2' y1='12' x2='4' y2='12'/%3E%3Cline x1='20' y1='12' x2='22' y2='12'/%3E%3Cline x1='4.93' y1='4.93' x2='6.34' y2='6.34'/%3E%3Cline x1='17.66' y1='17.66' x2='19.07' y2='19.07'/%3E%3Cline x1='4.93' y1='19.07' x2='6.34' y2='17.66'/%3E%3Cline x1='17.66' y1='6.34' x2='19.07' y2='4.93'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '32px 32px',
          backgroundRepeat: 'repeat',
          WebkitMaskImage: useMotionTemplate`radial-gradient(${maskRadius}px circle at calc(${smoothX}px + 100px) calc(${smoothY}px + 100px), black 0%, transparent 100%)`,
          maskImage: useMotionTemplate`radial-gradient(${maskRadius}px circle at calc(${smoothX}px + 100px) calc(${smoothY}px + 100px), black 0%, transparent 100%)`,
        }}
      />

      {/* Responsive Scaling Wrapper */}
      <div className="relative z-20 w-full h-48 flex items-center justify-center scale-75 sm:scale-100 md:scale-125 lg:scale-[1.75] xl:scale-[2.5] pointer-events-none">
        
        {/* Rotating Cube Container */}
        <motion.div
          initial={{ rotate: 45, scale: 0.8 }}
          animate={containerCtrl}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* 4 Block Pieces */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`piece-${i}`}
              custom={i}
              initial={{ 
                x: i === 0 || i === 2 ? -100 : 100, 
                y: i === 0 || i === 1 ? -100 : 100, 
                opacity: 0, 
                scale: 0.5,
                filter: "blur(20px)"
              }}
              animate={piecesCtrl}
              className="absolute w-8 h-8 bg-white"
              style={{ marginLeft: -16, marginTop: -16 }}
            />
          ))}
        </motion.div>

        {/* Wordmark Letters */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center" style={{ gap: '1vw' }}>
            {LETTERS.map((char, i) => (
              <motion.div
                key={`letter-${i}`}
                custom={i}
                initial={{ 
                  y: 20, 
                  opacity: 0, 
                  scale: 0.8,
                  filter: "blur(24px)"
                }}
                animate={lettersCtrl}
                className="text-white uppercase flex items-center justify-center"
                style={{ 
                  fontSize: '110px',
                  fontFamily: 'var(--font-anton)',
                  lineHeight: 1
                }} 
              >
                {char}
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
