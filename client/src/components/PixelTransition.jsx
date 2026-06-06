"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePresence } from "framer-motion";

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function PixelTransition() {
  const canvasRef = useRef(null);
  const startTimeRef = useRef(null);
  const prevIsPresent = useRef(true);
  const [isPresent, safeToRemove] = usePresence();

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    
    let animationFrameId;
    
    // If the presence state changes (e.g. entering -> exiting), reset the animation timer!
    if (prevIsPresent.current !== isPresent) {
      startTimeRef.current = performance.now();
      prevIsPresent.current = isPresent;
    } 
    // Preserve startTime across React StrictMode double-mounts
    else if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }
    
    const startTime = startTimeRef.current;
    
    const duration = 1200; // 1.2 seconds for a smoother, more cinematic wipe
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const blockSize = 14; // Tiny pixels like artefakt.mov
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    
    const grid = [];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Create an organic datamosh wave from left to right
        const waveOffset = (c / cols) * 0.7; 
        const noise = Math.random() * 0.3; // noise for the jagged edge
        const threshold = waveOffset + noise;
        
        const isSolid = Math.random() > 0.7;  // 30% solid glass, 70% text blocks
        
        grid.push({
          x: c * blockSize,
          y: r * blockSize,
          threshold,
          char: "MSBT"[c % 4], // Spells out MSBT across the columns
          isSolid,
          // Pre-calculate glass properties for speed
          fill: `rgba(255, 255, 255, ${Math.random() * 0.1 + 0.05})`, // subtle white tint
          highlight: `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.2})`, // top/left highlight
          shadow: `rgba(0, 0, 0, ${Math.random() * 0.3 + 0.1})`, // bottom/right shadow
        });
      }
    }

    const render = (time) => {
      let elapsed = time - startTime;
      let progress = Math.min(elapsed / duration, 1);
      
      const adjustedProgress = progress * 1.3; // scale up to ensure noise clears

      ctx.clearRect(0, 0, width, height);
      
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];
        
        let shouldDraw = false;
        
        if (!isPresent) {
          // Exiting page: blocks appear
          shouldDraw = adjustedProgress > cell.threshold;
        } else {
          // Entering new page: blocks disappear
          shouldDraw = adjustedProgress < cell.threshold;
        }

        if (shouldDraw) {
          // Glass base fill
          ctx.fillStyle = cell.fill;
          ctx.fillRect(cell.x, cell.y, blockSize, blockSize);
          
          // Top highlight line (simulates 3D bevel)
          ctx.fillStyle = cell.highlight;
          ctx.fillRect(cell.x, cell.y, blockSize, 1);
          
          // Left highlight line
          ctx.fillRect(cell.x, cell.y, 1, blockSize);
          
          // Bottom shadow line (simulates depth)
          ctx.fillStyle = cell.shadow;
          ctx.fillRect(cell.x, cell.y + blockSize - 1, blockSize, 1);
          
          // Right shadow line
          ctx.fillRect(cell.x + blockSize - 1, cell.y, 1, blockSize);
          
          if (!cell.isSolid) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)"; // Frosted white text
            ctx.fillText(cell.char, cell.x + blockSize / 2, cell.y + blockSize / 2 + 1);
          }
        }
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (!isPresent) {
          safeToRemove();
        }
      }
    };

    // Draw the very first frame synchronously before the browser paints
    render(startTime);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPresent, safeToRemove]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[10000] pointer-events-none"
      style={{ display: "block" }}
    />
  );
}
