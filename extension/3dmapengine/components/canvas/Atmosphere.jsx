import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';

const GRID_SIZE = 400;

export default function Atmosphere() {
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const mapData = useMapStore(state => state.mapData);
  const pointsRef = useRef();

  // Generate a soft radial gradient texture for the particles
  const fogTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Create particle positions only on unknown tiles
  const positions = useMemo(() => {
    if (!mapData) return new Float32Array(0);

    const offset = Math.floor(GRID_SIZE / 2);
    const pos = [];

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const x = Math.floor(i / GRID_SIZE) - offset;
      const z = (i % GRID_SIZE) - offset;

      // If NO intel, place a fog particle
      if (!mapData[`${x},${z}`]) {
        // Place 1 or 2 particles per tile for density
        pos.push(x, 0.5 + Math.random() * 1.5, z);
        if (Math.random() > 0.5) {
            pos.push(x + (Math.random() - 0.5), 1.0 + Math.random() * 2, z + (Math.random() - 0.5));
        }
      }
    }
    return new Float32Array(pos);
  }, [mapData]);

  useFrame((state, delta) => {
    if (graphicsQuality === 'low') return;
    if (pointsRef.current && graphicsQuality === 'high') {
      // Gentle breathing effect for the entire fog mass
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  if (graphicsQuality === 'low' || positions.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={positions.length / 3} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={3.5} // Large soft particles
        color="#101118" // Very dark fog color
        transparent={true}
        opacity={0.8} // Dense
        depthWrite={false}
        map={fogTexture}
        sizeAttenuation={true}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
