import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { useThree, useFrame } from '@react-three/fiber';
import { safeLoadGeometry } from '../../utils/AssetManager';

const MAX_INSTANCES = 15000;

export default function BiomeScatter() {
  const mapData = useMapStore(state => state.mapData);
  const graphicsQuality = useMapStore(state => state.graphicsQuality);

  const woodRef = useRef();
  const cropRef = useRef();
  const ironRef = useRef();
  const clayRef = useRef();

  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Phase 13: Local state to hold safely loaded GLTF geometries (if they exist)
  const [loadedGeoms, setLoadedGeoms] = useState({
    wood: null,
    crop: null,
    iron: null,
    clay: null
  });

  // Fetch GLB models on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadAssets = async () => {
       // NOTE: This will trigger a 404 in the Chrome network tab if the files are missing.
       // The AssetManager captures it and falls back to primitives safely.
       const [wood, crop, iron, clay] = await Promise.all([
          safeLoadGeometry('/3dmapengine/assets/models/wood.glb'),
          safeLoadGeometry('/3dmapengine/assets/models/crop.glb'),
          safeLoadGeometry('/3dmapengine/assets/models/iron.glb'),
          safeLoadGeometry('/3dmapengine/assets/models/clay.glb')
       ]);

       if (isMounted) {
         setLoadedGeoms({ wood, crop, iron, clay });
       }
    };
    
    loadAssets();
    
    return () => { isMounted = false; };
  }, []);


  const { controls } = useThree();
  const lastCenter = useRef({ x: null, y: null });

  const renderBiomes = React.useCallback((cx, cy) => {
    if (!mapData || !woodRef.current || !cropRef.current || !ironRef.current || !clayRef.current) return;

    let woodCount = 0;
    let cropCount = 0;
    let ironCount = 0;
    let clayCount = 0;

    const tiles = Object.values(mapData);
    
    // SLIDING WINDOW: 30x30 grid (Radius 15)
    const WINDOW_RADIUS = 15;

    tiles.forEach(tile => {
      // Frustum Culling (CPU Side): Only process tiles within the window
      if (Math.abs(tile.x - cx) > WINDOW_RADIUS || Math.abs(tile.y - cy) > WINDOW_RADIUS) {
        return;
      }

      // We only scatter biomes on special tiles (e.g., Oases) for now
      if (tile.isOasis && tile.oasisType) {
        
        let instancesToPlace = 1;
        if (graphicsQuality === 'mid') instancesToPlace = 2;
        if (graphicsQuality === 'high') instancesToPlace = 4;

        for (let i = 0; i < instancesToPlace; i++) {
          let offsetX = 0;
          let offsetZ = 0;
          let scale = 0.6 + Math.random() * 0.8; // Wide variance between 0.6 and 1.4
          
          if (graphicsQuality !== 'low' && i > 0) {
            // Phase 17: Organic Scatter Offset (Biome Overlap)
            let scatterRadius = graphicsQuality === 'high' ? 1.3 : 0.7; // 1.3 gives an offset between -0.65 and 0.65
            offsetX = (Math.random() - 0.5) * scatterRadius;
            offsetZ = (Math.random() - 0.5) * scatterRadius;
          }

          // Position slightly above the grass based on scale
          tempObj.position.set(tile.x + offsetX, 0.4 * scale, -tile.y + offsetZ);
          tempObj.scale.set(scale, scale, scale);
          
          // Phase 17: Random Y-axis rotation and tilt
          tempObj.rotation.y = Math.random() * Math.PI * 2;
          tempObj.rotation.x = (Math.random() - 0.5) * 0.2;
          tempObj.rotation.z = (Math.random() - 0.5) * 0.2;
          
          tempObj.updateMatrix();

          // Dispatch to the correct biome instanced mesh
          const type = tile.oasisType.toLowerCase();
          if (type.includes('wood') && woodCount < MAX_INSTANCES) {
            woodRef.current.setMatrixAt(woodCount, tempObj.matrix);
            woodCount++;
          } else if (type.includes('crop') && cropCount < MAX_INSTANCES) {
            cropRef.current.setMatrixAt(cropCount, tempObj.matrix);
            cropCount++;
          } else if (type.includes('iron') && ironCount < MAX_INSTANCES) {
            ironRef.current.setMatrixAt(ironCount, tempObj.matrix);
            ironCount++;
          } else if (type.includes('clay') && clayCount < MAX_INSTANCES) {
            clayRef.current.setMatrixAt(clayCount, tempObj.matrix);
            clayCount++;
          }
        }
      }
    });

    woodRef.current.count = woodCount;
    woodRef.current.instanceMatrix.needsUpdate = true;
    
    cropRef.current.count = cropCount;
    cropRef.current.instanceMatrix.needsUpdate = true;
    
    ironRef.current.count = ironCount;
    ironRef.current.instanceMatrix.needsUpdate = true;
    
    clayRef.current.count = clayCount;
    clayRef.current.instanceMatrix.needsUpdate = true;

  }, [mapData, graphicsQuality, tempObj]);

  // Initial render when data loads
  useEffect(() => {
    if (controls && controls.target) {
      const cx = Math.round(controls.target.x);
      const cy = Math.round(-controls.target.z);
      lastCenter.current = { x: cx, y: cy };
      renderBiomes(cx, cy);
    }
  }, [mapData, controls, graphicsQuality, renderBiomes]);

  // Dynamic window rendering on panning
  useFrame(() => {
    if (!controls) return;
    const cx = Math.round(controls.target.x);
    const cy = Math.round(-controls.target.z);

    // Update instances if camera center moved by at least 2 tiles to avoid micro-stutters
    if (Math.abs(cx - lastCenter.current.x) >= 2 || Math.abs(cy - lastCenter.current.y) >= 2) {
      lastCenter.current = { x: cx, y: cy };
      renderBiomes(cx, cy);
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* Wood */}
      <instancedMesh ref={woodRef} args={[loadedGeoms.wood, null, MAX_INSTANCES]} frustumCulled={false} castShadow receiveShadow>
        {!loadedGeoms.wood && <coneGeometry args={[0.3, 0.8, 4]} />}
        <meshStandardMaterial color="#2e7d32" roughness={0.9} />
      </instancedMesh>

      {/* Crop */}
      <instancedMesh ref={cropRef} args={[loadedGeoms.crop, null, MAX_INSTANCES]} frustumCulled={false} castShadow receiveShadow>
        {!loadedGeoms.crop && <cylinderGeometry args={[0.2, 0.2, 0.6, 6]} />}
        <meshStandardMaterial color="#fbc02d" roughness={0.7} />
      </instancedMesh>

      {/* Iron */}
      <instancedMesh ref={ironRef} args={[loadedGeoms.iron, null, MAX_INSTANCES]} frustumCulled={false} castShadow receiveShadow>
        {!loadedGeoms.iron && <tetrahedronGeometry args={[0.5]} />}
        <meshStandardMaterial color="#9e9e9e" roughness={0.4} metalness={0.6} />
      </instancedMesh>

      {/* Clay */}
      <instancedMesh ref={clayRef} args={[loadedGeoms.clay, null, MAX_INSTANCES]} frustumCulled={false} castShadow receiveShadow>
        {!loadedGeoms.clay && <boxGeometry args={[0.4, 0.4, 0.4]} />}
        <meshStandardMaterial color="#d84315" roughness={1.0} />
      </instancedMesh>
    </group>
  );
}
