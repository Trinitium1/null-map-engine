import React, { useEffect, useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';

export default function CameraController() {
  const cameraMode = useMapStore(state => state.cameraMode);
  const panTarget = useMapStore(state => state.panTarget);
  const { camera, controls } = useThree();
  const [targetSpherical, setTargetSpherical] = useState(null);
  
  // Ref to hold the animating spherical coordinates
  const currentSpherical = useRef(new THREE.Spherical());

  // Phase 14: Camera Panning for Alarms
  useEffect(() => {
    if (!controls || !panTarget) return;
    
    // Calculate new target position (X, 0, Z)
    // Remember: 3D Z = -Travian Y
    const newTarget = new THREE.Vector3(panTarget.x, 0, -panTarget.y);
    
    // Snap controls target to new position
    controls.target.copy(newTarget);
    
    // We want to trigger the animation from current camera position
    // So we calculate the offset from the new target to the current camera position
    const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
    currentSpherical.current.setFromVector3(offset);
    
    // Temporarily increase distance (zoom out) for a sweeping effect
    currentSpherical.current.radius += 50;
    
    // Ensure we trigger the animation by disabling controls momentarily
    controls.enabled = false;
    
    // The existing useFrame will naturally animate currentSpherical back down to targetSpherical
  }, [panTarget, controls, camera]);

  useEffect(() => {
    if (!controls) return;
    
    // Sync currentSpherical to the EXACT camera position at the moment the user clicks the button
    const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
    currentSpherical.current.setFromVector3(offset);
    
    // Mathematically perfect Spherical targets
    const isoS = new THREE.Spherical(
      Math.sqrt(30000), // radius for [100, 100, 100]
      Math.acos(100 / Math.sqrt(30000)), // phi (approx 54.7 deg)
      Math.PI / 4 // theta (45 deg)
    );
    
    const topS = new THREE.Spherical(
      150, // radius
      0.01, // phi (almost 0 to prevent OrbitControls Gimbal lock)
      0 // theta (perfectly square grid)
    );

    setTargetSpherical(cameraMode === 'isometric' ? isoS : topS);
  }, [cameraMode, controls]);

  useFrame((state, delta) => {
    if (!targetSpherical || !controls) return;
    if (controls.enabled) return; // EARLY RETURN: No animation needed, save GPU cycles

    
    // Calculate deltas to know when we have arrived
    const dr = Math.abs(currentSpherical.current.radius - targetSpherical.radius);
    const dp = Math.abs(currentSpherical.current.phi - targetSpherical.phi);
    const dt = Math.abs(currentSpherical.current.theta - targetSpherical.theta);
    
    // Epsilon threshold to stop animation
    if (dr > 0.5 || dp > 0.01 || dt > 0.01) {
      controls.enabled = false;
      
      // Speed multiplier for snappier, faster transitions
      const speed = delta * 12;
      
      // Interpolate spherical properties for a perfect drone-like arc
      currentSpherical.current.radius = THREE.MathUtils.lerp(currentSpherical.current.radius, targetSpherical.radius, speed);
      currentSpherical.current.phi = THREE.MathUtils.lerp(currentSpherical.current.phi, targetSpherical.phi, speed);
      currentSpherical.current.theta = THREE.MathUtils.lerp(currentSpherical.current.theta, targetSpherical.theta, speed);
      
      // Convert spherical back to cartesian and apply to camera
      const offset = new THREE.Vector3().setFromSpherical(currentSpherical.current);
      camera.position.copy(controls.target).add(offset);
      
      controls.update();
    } else {
      if (!controls.enabled) {
        // Snap exactly to mathematically perfect targets
        currentSpherical.current.copy(targetSpherical);
        const offset = new THREE.Vector3().setFromSpherical(targetSpherical);
        camera.position.copy(controls.target).add(offset);
        
        controls.update();
        controls.enabled = true;
      }
    }
  });

  return null;
}
