import React, { useMemo, useState, useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';

export default function ZoomSpeedLines() {
  const isZooming = useMapStore(state => state.isZooming);
  // We keep rendering the DOM element briefly after zooming stops to allow the CSS opacity transition to fade out smoothly
  const [renderEffect, setRenderEffect] = useState(false);

  useEffect(() => {
    if (isZooming) {
      setRenderEffect(true);
    } else {
      const timer = setTimeout(() => setRenderEffect(false), 200); // Wait for fade out
      return () => clearTimeout(timer);
    }
  }, [isZooming]);

  // Generate an intense, razor-sharp radial manga speed-line pattern mathematically
  const conicBackground = useMemo(() => {
    let stops = [];
    for (let i = 0; i < 360; i += 4) { 
      // Skip some angles to create organic unevenness
      if (Math.random() > 0.4) {
        // Mix between pure white and neon cyan
        const color = Math.random() > 0.6 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 242, 254, 0.7)';
        // Very thin, sharp wedges
        const width = 0.05 + Math.random() * 0.15; 
        
        stops.push(`transparent ${i}deg`);
        stops.push(`${color} ${i}deg`);
        stops.push(`${color} ${i + width}deg`);
        stops.push(`transparent ${i + width}deg`);
      }
    }
    return `conic-gradient(from 0deg, ${stops.join(', ')})`;
  }, []);

  if (!renderEffect) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        opacity: isZooming ? 1 : 0,
        transition: 'opacity 0.15s ease-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        // Dark dramatic vignette that pops in
        boxShadow: isZooming ? 'inset 0 0 250px rgba(0,0,0,0.6)' : 'inset 0 0 0px rgba(0,0,0,0)',
        transitionProperty: 'opacity, box-shadow'
      }}
    >
      {/* Primary line layer scaling rapidly */}
      <div style={{
        position: 'absolute',
        width: '250vw',
        height: '250vh',
        background: conicBackground,
        maskImage: 'radial-gradient(circle, transparent 15%, black 60%)',
        WebkitMaskImage: 'radial-gradient(circle, transparent 15%, black 60%)',
        animation: 'zoomWarp 0.2s linear infinite'
      }} />

      {/* Secondary layer, rotated differently and scaling faster for parallax depth */}
      <div style={{
        position: 'absolute',
        width: '250vw',
        height: '250vh',
        background: conicBackground,
        maskImage: 'radial-gradient(circle, transparent 25%, black 80%)',
        WebkitMaskImage: 'radial-gradient(circle, transparent 25%, black 80%)',
        animation: 'zoomWarpFast 0.12s linear infinite',
        opacity: 0.6
      }} />

      <style>{`
        @keyframes zoomWarp {
          0% { transform: scale(0.5); }
          100% { transform: scale(1.5); }
        }
        @keyframes zoomWarpFast {
          0% { transform: scale(0.8) rotate(15deg); }
          100% { transform: scale(2.0) rotate(15deg); }
        }
      `}</style>
    </div>
  );
}
