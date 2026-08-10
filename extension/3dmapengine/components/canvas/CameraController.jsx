import React, { useEffect, useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { getBaseColor } from '../../utils/colorUtils';

export default function CameraController() {
  const cameraMode = useMapStore(state => state.cameraMode);
  const panTarget = useMapStore(state => state.panTarget);
  const setCurrentCenterCoords = useMapStore(state => state.setCurrentCenterCoords);
  const setIsDraggingMap = useMapStore(state => state.setIsDraggingMap);
  const setZoomLevel = useMapStore(state => state.setZoomLevel);
  const targetZoom = useMapStore(state => state.targetZoom);
  const setIsZooming = useMapStore(state => state.setIsZooming);
  const { camera, controls } = useThree();
  const [targetSpherical, setTargetSpherical] = useState(null);
  
  // Ref to hold the animating spherical coordinates
  const currentSpherical = useRef(new THREE.Spherical());
  
  // Snap target for when dragging ends
  const snapTarget = useRef(null);

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

  // Handle Dragging, Coordinates, and Snapping
  useEffect(() => {
    if (!controls) return;
    
    // We no longer track coordinates inside handleChange because arrow keys don't trigger it 
    // when we manually lerp controls.target. Instead, we'll track it in useFrame.
    let startPos = new THREE.Vector3();
    let isMouseActive = false;

    const handleChange = () => {
      if (isMouseActive && controls.target.distanceTo(startPos) > 0.1) {
        if (!useMapStore.getState().isDraggingMap) {
          setIsDraggingMap(true);
        }
      }
    };

    const handleStart = (e) => {
      isMouseActive = true;
      snapTarget.current = null;
      startPos.copy(controls.target);
    };

    const handleEnd = () => {
      isMouseActive = false;
      // Small timeout so the contextmenu event fires BEFORE we set isDraggingMap to false
      setTimeout(() => setIsDraggingMap(false), 50);
      
      // Calculate snap target
      snapTarget.current = new THREE.Vector3(
        Math.round(controls.target.x),
        0,
        Math.round(controls.target.z)
      );
    };

    controls.addEventListener('change', handleChange);
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    // Subscribe to Jump Target
    const unsub = useMapStore.subscribe(
      state => state.cameraJumpTarget,
      (jumpT) => {
        if (jumpT) {
          snapTarget.current = new THREE.Vector3(jumpT.x, 0, -jumpT.y);
          useMapStore.setState({ cameraJumpTarget: null }); // clear it so we can jump there again later
        }
      }
    );

    return () => {
      controls.removeEventListener('change', handleChange);
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      unsub();
    };
  }, [controls, setCurrentCenterCoords, setIsDraggingMap]);

  // Handle Arrow Keys
  useEffect(() => {
    if (!controls) return;
    const handleKeyDown = (e) => {
      // Only navigate if the canvas has focus, or just globally if no input is focused
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      
      let moved = false;
      const step = 1;
      const target = snapTarget.current ? snapTarget.current.clone() : controls.target.clone();

      if (e.key === 'ArrowUp') { target.z -= step; moved = true; }
      else if (e.key === 'ArrowDown') { target.z += step; moved = true; }
      else if (e.key === 'ArrowLeft') { target.x -= step; moved = true; }
      else if (e.key === 'ArrowRight') { target.x += step; moved = true; }

      if (moved) {
        snapTarget.current = target;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controls, setCurrentCenterCoords]);

  // Phase 22: Stepped Zoom Logic
  useEffect(() => {
    let wheelTimeout;
    const handleWheel = (e) => {
      // Only capture wheel on the canvas or if no modal is stopping propagation
      if (e.target.closest && e.target.closest('.no-zoom-scroll')) return;
      
      // We don't preventDefault here because it might block normal page scrolling if user is over a UI panel
      // Actually we DO want to prevent default on the canvas itself
      if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
      }

      if (wheelTimeout) return;

      if (e.deltaY > 0) {
        setZoomLevel(1); // Zoom OUT (increase level index -> more tiles)
      } else if (e.deltaY < 0) {
        setZoomLevel(-1); // Zoom IN (decrease level index -> fewer tiles)
      }
      
      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, 100);
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [setZoomLevel]);

  useFrame((state, delta) => {
    if (!controls) return;
    
    // Zoom Interpolation
    const currentZoom = camera.zoom;
    if (Math.abs(currentZoom - targetZoom) > 0.01) {
      if (useMapStore.getState().engineConfig.enableZoomAnimation) {
        // MathUtils.damp is perfectly smooth and framerate-independent
        camera.zoom = THREE.MathUtils.damp(currentZoom, targetZoom, 12, delta);
        camera.updateProjectionMatrix();
        if (!useMapStore.getState().isZooming) {
          setIsZooming(true);
        }
      } else {
        // Direct snap for mid/low graphics
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
      }
    } else {
      if (currentZoom !== targetZoom) {
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
      }
      if (useMapStore.getState().isZooming) {
        setIsZooming(false);
      }
    }

    // 1. Handle Snapping (Smooth fast transition to exact tile)
    if (snapTarget.current && !useMapStore.getState().isDraggingMap) {
      const dist = controls.target.distanceTo(snapTarget.current);
      if (dist > 0.01) {
        // PREVENT OVERSHOOT: Cap lerp factor at 1.0 to stop violent oscillations on lag spikes
        const lerpFactor = Math.min(delta * 15, 1.0);
        controls.target.lerp(snapTarget.current, lerpFactor);
      } else {
        controls.target.copy(snapTarget.current);
        snapTarget.current = null;
      }
      controls.update();
    }

    // Tracking logic moved above early returns to ensure it always fires
    const cx = Math.round(controls.target.x);
    const cy = Math.round(-controls.target.z);
    
    const prevCoords = useMapStore.getState().currentCenterCoords;
    if (!prevCoords || prevCoords.x !== cx || prevCoords.y !== cy) {
      setCurrentCenterCoords({ x: cx, y: cy });
      
      const graphicsQuality = useMapStore.getState().graphicsQuality;
      if (graphicsQuality === 'high' || graphicsQuality === 'custom') {
         const GRID_SIZE = 400;
         const offset = Math.floor(GRID_SIZE / 2);
         const id = (cx + offset) * GRID_SIZE + (-cy + offset);
         
         const currentSelected = useMapStore.getState().selectedTile;
         if (!currentSelected || currentSelected.instanceId !== id) {
            const mapData = useMapStore.getState().mapData;
            const filters = useMapStore.getState().filters;
            const tileData = mapData[`${cx},${cy}`];
            
            const c = getBaseColor(cx, -cy, tileData, filters);
            useMapStore.getState().setSelectedTile({
               instanceId: id, x: cx, y: cy, z: -cy, color: [c.r, c.g, c.b]
            });
         }
      }
    }

    if (!targetSpherical) return;
    
    if (controls.enabled) {
      // NORMAL DRAG / STATIC MODE
      // Force mathematical perfection to prevent ANY OrbitControls angle drift near map corners
      const offset = new THREE.Vector3().setFromSpherical(targetSpherical);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
      return; // EARLY RETURN: No animation needed, save GPU cycles
    }

    // TRANSITION MODE (OrbitControls is disabled)
    // Calculate deltas to know when we have arrived
    const dr = Math.abs(currentSpherical.current.radius - targetSpherical.radius);
    const dp = Math.abs(currentSpherical.current.phi - targetSpherical.phi);
    const dt = Math.abs(currentSpherical.current.theta - targetSpherical.theta);
    
    // Epsilon threshold to stop animation
    if (dr > 0.5 || dp > 0.01 || dt > 0.01) {
      // Speed multiplier for snappier, faster transitions, capped to prevent overshoot
      const speed = Math.min(delta * 12, 1.0);
      
      // Interpolate spherical properties for a perfect drone-like arc
      currentSpherical.current.radius = THREE.MathUtils.lerp(currentSpherical.current.radius, targetSpherical.radius, speed);
      currentSpherical.current.phi = THREE.MathUtils.lerp(currentSpherical.current.phi, targetSpherical.phi, speed);
      currentSpherical.current.theta = THREE.MathUtils.lerp(currentSpherical.current.theta, targetSpherical.theta, speed);
      
      // Convert spherical back to cartesian and apply to camera
      const offset = new THREE.Vector3().setFromSpherical(currentSpherical.current);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
      
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
