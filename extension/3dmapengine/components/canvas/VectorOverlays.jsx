import React from 'react';
import * as THREE from 'three';
import { QuadraticBezierLine } from '@react-three/drei';
import { useMapStore } from '../../store/mapStore';

export default function VectorOverlays() {
  const tacticalRoutes = useMapStore(state => state.tacticalRoutes);
  const cameraMode = useMapStore(state => state.cameraMode);

  if (!tacticalRoutes || tacticalRoutes.length === 0) return null;

  return (
    <group>
      {tacticalRoutes.map((route, index) => {
        const start = new THREE.Vector3(route.start[0], 0.5, route.start[1]);
        const end = new THREE.Vector3(route.end[0], 0.5, route.end[1]);
        
        const distance = start.distanceTo(end);
        
        // Dynamic midpoint based on camera mode
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        
        if (cameraMode === 'isometric') {
          // Cinematic 3D arc
          mid.y = Math.max(distance * 0.2, 5);
        } else {
          // Flatten for Top-Down tactical precision
          mid.y = 0.5;
        }

        let color = '#ffffff';
        if (route.type === 'attack') color = '#ff0055';
        else if (route.type === 'def') color = '#00f2fe';
        else if (route.type === 'fake') color = '#fbff00';

        return (
          <QuadraticBezierLine
            key={route.id || index}
            start={start}
            end={end}
            mid={mid}
            color={color}
            lineWidth={3}
            dashed={route.type === 'fake'}
            dashScale={5}
            dashSize={2}
            dashOffset={0}
            depthTest={true} // So it doesn't clip through elevated tiles incorrectly
            transparent={true}
            opacity={0.8}
          />
        );
      })}
    </group>
  );
}
