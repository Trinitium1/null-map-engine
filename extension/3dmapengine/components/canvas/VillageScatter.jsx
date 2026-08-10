import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { useGLTF, useTexture } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { getExtensionUrl } from '../../utils/AssetManager';

const MAX_VILLAGES = 10000;

export default function VillageScatter() {
  const mapData = useMapStore(state => state.mapData);
  const graphicsQuality = useMapStore(state => state.graphicsQuality);

  const romanSRef = useRef();
  const romanMRef = useRef();
  const romanLRef = useRef();
  const fallbackRef = useRef();

  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const dracoPath = getExtensionUrl('/3dmapengine/assets/draco/gltf/');

  // Use Drei's useGLTF to load the full scene (preserves materials & textures!)
  const { nodes: nodesS, materials: matS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Village_Romans_S.glb'), dracoPath);
  const { nodes: nodesM, materials: matM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Village_Romans_M.glb'), dracoPath);
  const { nodes: nodesL, materials: matL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Village_Romans_L.glb'), dracoPath);

  // Load PNG fallbacks for Low Graphics Mode
  const texS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Village_Romans_S.png'));
  const texM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Village_Romans_M.png'));
  const texL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Village_Romans_L.png'));
  // Ensure transparent PNGs render correctly
  if (texS) texS.colorSpace = THREE.SRGBColorSpace;
  if (texM) texM.colorSpace = THREE.SRGBColorSpace;
  if (texL) texL.colorSpace = THREE.SRGBColorSpace;

  // Extract the main mesh from the loaded GLTFs
  const meshS = useMemo(() => Object.values(nodesS).find(n => n.isMesh), [nodesS]);
  const meshM = useMemo(() => Object.values(nodesM).find(n => n.isMesh), [nodesM]);
  const meshL = useMemo(() => Object.values(nodesL).find(n => n.isMesh), [nodesL]);

  // Fix materials to be brighter (some AI/Blender exports have weird metalness/roughness)
  useEffect(() => {
    const fixMaterial = (mesh) => {
      if (mesh && mesh.material) {
        mesh.material.metalness = 0.1;
        mesh.material.roughness = 0.9;
        mesh.material.needsUpdate = true;
        
        // Massive bounding sphere so we can enable frustumCulling without instances disappearing
        mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2000);
      }
    };
    fixMaterial(meshS);
    fixMaterial(meshM);
    fixMaterial(meshL);
  }, [meshS, meshM, meshL]);

  // Dynamically compute bounding box and EXACT scale so models cover a specific percentage of the tile
  const calculatedMetrics = useMemo(() => {
    const calc = (mesh, targetCoverage) => {
      if (!mesh || !mesh.geometry) return { scale: 0.2, offset: 0.1 };
      
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
      }
      
      const box = mesh.geometry.boundingBox;
      if (!box || isNaN(box.min.y)) return { scale: 0.2, offset: 0.1 };

      // Calculate the physical size of the original model
      const width = box.max.x - box.min.x;
      const depth = box.max.z - box.min.z;
      const maxDim = Math.max(width, depth);
      
      // Tile size is 1.0. To cover X%, the scaled max dimension should equal targetCoverage
      const scale = targetCoverage / maxDim;
      
      // Calculate how much we need to lift the model so its lowest point rests at Y = 0.1
      const offset = -(box.min.y * scale) + 0.1; 
      
      return { scale, offset };
    };
    
    return {
      s: calc(meshS, 0.85), // 85% coverage
      m: calc(meshM, 0.90), // 90% coverage
      l: calc(meshL, 0.95)  // 95% coverage
    };
  }, [meshS, meshM, meshL]);

  const { controls, camera } = useThree();
  const lastCenter = useRef({ x: null, y: null });

  const renderVillages = React.useCallback((cx, cy) => {
    if (!mapData || !romanSRef.current || !romanMRef.current || !romanLRef.current || !fallbackRef.current) return;

    let romanSCount = 0;
    let romanMCount = 0;
    let romanLCount = 0;
    let fallbackCount = 0;

    const tiles = Object.values(mapData);
    
    // SLIDING WINDOW: 30x30 grid (Radius 15)
    const WINDOW_RADIUS = 15;

    tiles.forEach(tile => {
      // Frustum Culling (CPU Side): Only process tiles within the window
      if (Math.abs(tile.x - cx) > WINDOW_RADIUS || Math.abs(tile.y - cy) > WINDOW_RADIUS) {
        return;
      }

      // Check if it is an active settlement
      if (tile.villageId && !tile.isOasis) {
        const tribe = (tile.tribe || '').toLowerCase();
        const pop = parseInt(tile.population) || 0;

        if (tribe.includes('roman') || tribe === '') { // default to roman if missing
           let isS = pop < 250;
           let isM = pop >= 250 && pop < 500;
           let isL = pop >= 500;

           if (graphicsQuality === 'low') {
               // 2D PNG Billboard Logic: Perfect Isometric Decal
               // 1. Lay flat on ground (-90deg X)
               // 2. Rotate 45deg Z to face the isometric camera's yaw
               tempObj.rotation.set(-Math.PI / 2, 0, Math.PI / 4); 
               // Elevate slightly so it sits on top of the grass tile (0.1)
               tempObj.position.set(tile.x, 0.11, -tile.y);
               
               // We want the final size to be 0.85, 0.90, 0.95 of the tile
               let targetSize = isS ? 0.85 : isM ? 0.90 : 0.95;
               let planeScale = targetSize / 1.5; // base geometry is 1.5
               
               // The camera looks down at ~35.264 degrees, which squashes the depth by sin(35.264) = 0.57735
               // We stretch the local Y axis by 1/0.57735 = 1.73205 to perfectly cancel the squash!
               tempObj.scale.set(planeScale, planeScale * 1.73205, planeScale);
               tempObj.updateMatrix();

               if (isS && romanSCount < MAX_VILLAGES) {
                   romanSRef.current.setMatrixAt(romanSCount++, tempObj.matrix);
               } else if (isM && romanMCount < MAX_VILLAGES) {
                   romanMRef.current.setMatrixAt(romanMCount++, tempObj.matrix);
               } else if (isL && romanLCount < MAX_VILLAGES) {
                   romanLRef.current.setMatrixAt(romanLCount++, tempObj.matrix);
               }
           } else {
               // Full 3D Model Logic
               tempObj.rotation.set(0, 0, 0); 

               if (isS && romanSCount < MAX_VILLAGES) {
                   tempObj.position.set(tile.x, calculatedMetrics.s.offset, -tile.y);
                   tempObj.scale.set(calculatedMetrics.s.scale, calculatedMetrics.s.scale, calculatedMetrics.s.scale);
                   tempObj.updateMatrix();
                   romanSRef.current.setMatrixAt(romanSCount++, tempObj.matrix);
               } else if (isM && romanMCount < MAX_VILLAGES) {
                   tempObj.position.set(tile.x, calculatedMetrics.m.offset, -tile.y);
                   tempObj.scale.set(calculatedMetrics.m.scale, calculatedMetrics.m.scale, calculatedMetrics.m.scale);
                   tempObj.updateMatrix();
                   romanMRef.current.setMatrixAt(romanMCount++, tempObj.matrix);
               } else if (isL && romanLCount < MAX_VILLAGES) {
                   tempObj.position.set(tile.x, calculatedMetrics.l.offset, -tile.y);
                   tempObj.scale.set(calculatedMetrics.l.scale, calculatedMetrics.l.scale, calculatedMetrics.l.scale);
                   tempObj.updateMatrix();
                   romanLRef.current.setMatrixAt(romanLCount++, tempObj.matrix);
               }
           }
        } else {
           // Fallback for non-Roman tribes
           if (fallbackCount < MAX_VILLAGES) {
               tempObj.rotation.set(0, 0, 0);
               tempObj.position.set(tile.x, 0.3, -tile.y);
               tempObj.scale.set(0.6, 0.6, 0.6); 
               tempObj.updateMatrix();
               fallbackRef.current.setMatrixAt(fallbackCount++, tempObj.matrix);
           }
        }
      }
    });

    romanSRef.current.count = romanSCount;
    romanSRef.current.instanceMatrix.needsUpdate = true;
    
    romanMRef.current.count = romanMCount;
    romanMRef.current.instanceMatrix.needsUpdate = true;
    
    romanLRef.current.count = romanLCount;
    romanLRef.current.instanceMatrix.needsUpdate = true;
    
    fallbackRef.current.count = fallbackCount;
    fallbackRef.current.instanceMatrix.needsUpdate = true;

  }, [mapData, tempObj, graphicsQuality, calculatedMetrics, camera]);

  // Initial render when data loads
  useEffect(() => {
    if (controls && controls.target) {
      const cx = Math.round(controls.target.x);
      const cy = Math.round(-controls.target.z);
      lastCenter.current = { x: cx, y: cy };
      renderVillages(cx, cy);
    }
  }, [mapData, controls, renderVillages, meshS, meshM, meshL, graphicsQuality]);

  // Dynamic window rendering on panning
  useFrame(() => {
    if (!controls) return;
    const cx = Math.round(controls.target.x);
    const cy = Math.round(-controls.target.z);

    if (Math.abs(cx - lastCenter.current.x) >= 2 || Math.abs(cy - lastCenter.current.y) >= 2) {
      lastCenter.current = { x: cx, y: cy };
      renderVillages(cx, cy);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Romans Small */}
      {graphicsQuality === 'low' ? (
        <instancedMesh ref={romanSRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={texS} transparent alphaTest={0.5} side={THREE.DoubleSide} />
        </instancedMesh>
      ) : (
        meshS && (
          <instancedMesh ref={romanSRef} args={[meshS.geometry, meshS.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />
        )
      )}

      {/* Romans Medium */}
      {graphicsQuality === 'low' ? (
        <instancedMesh ref={romanMRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={texM} transparent alphaTest={0.5} side={THREE.DoubleSide} />
        </instancedMesh>
      ) : (
        meshM && (
          <instancedMesh ref={romanMRef} args={[meshM.geometry, meshM.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />
        )
      )}

      {/* Romans Large */}
      {graphicsQuality === 'low' ? (
        <instancedMesh ref={romanLRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={texL} transparent alphaTest={0.5} side={THREE.DoubleSide} />
        </instancedMesh>
      ) : (
        meshL && (
          <instancedMesh ref={romanLRef} args={[meshL.geometry, meshL.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />
        )
      )}

      {/* Fallback Gray Cube for Non-Roman tribes */}
      <instancedMesh ref={fallbackRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7f8fa6" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
