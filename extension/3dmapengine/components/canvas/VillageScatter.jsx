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
  
  const gaulSRef = useRef();
  const gaulMRef = useRef();
  const gaulLRef = useRef();
  
  const fallbackRef = useRef();

  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const dracoPath = getExtensionUrl('/3dmapengine/assets/draco/gltf/');

  // ROMANS
  const { nodes: rNodesS, materials: rMatS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_S.glb'), dracoPath);
  const { nodes: rNodesM, materials: rMatM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_M.glb'), dracoPath);
  const { nodes: rNodesL, materials: rMatL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_L.glb'), dracoPath);

  const rTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_S.png'));
  const rTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_M.png'));
  const rTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_L.png'));
  if (rTexS) rTexS.colorSpace = THREE.SRGBColorSpace;
  if (rTexM) rTexM.colorSpace = THREE.SRGBColorSpace;
  if (rTexL) rTexL.colorSpace = THREE.SRGBColorSpace;

  // GAULS
  const { nodes: gNodesS, materials: gMatS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_S.glb'), dracoPath);
  const { nodes: gNodesM, materials: gMatM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_M.glb'), dracoPath);
  const { nodes: gNodesL, materials: gMatL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_L.glb'), dracoPath);

  const gTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_S.png'));
  const gTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_M.png'));
  const gTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_L.png'));
  if (gTexS) gTexS.colorSpace = THREE.SRGBColorSpace;
  if (gTexM) gTexM.colorSpace = THREE.SRGBColorSpace;
  if (gTexL) gTexL.colorSpace = THREE.SRGBColorSpace;

  const rMeshS = useMemo(() => Object.values(rNodesS).find(n => n.isMesh), [rNodesS]);
  const rMeshM = useMemo(() => Object.values(rNodesM).find(n => n.isMesh), [rNodesM]);
  const rMeshL = useMemo(() => Object.values(rNodesL).find(n => n.isMesh), [rNodesL]);

  const gMeshS = useMemo(() => Object.values(gNodesS).find(n => n.isMesh), [gNodesS]);
  const gMeshM = useMemo(() => Object.values(gNodesM).find(n => n.isMesh), [gNodesM]);
  const gMeshL = useMemo(() => Object.values(gNodesL).find(n => n.isMesh), [gNodesL]);

  useEffect(() => {
    const fixMaterial = (mesh) => {
      if (mesh && mesh.material) {
        mesh.material.metalness = 0.1;
        mesh.material.roughness = 0.9;
        mesh.material.needsUpdate = true;
        mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2000);
      }
    };
    [rMeshS, rMeshM, rMeshL, gMeshS, gMeshM, gMeshL].forEach(fixMaterial);
  }, [rMeshS, rMeshM, rMeshL, gMeshS, gMeshM, gMeshL]);

  const calcMetrics = (mesh, targetCoverage) => {
    if (!mesh || !mesh.geometry) return { scale: 0.2, offset: 0.1 };
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (!box || isNaN(box.min.y)) return { scale: 0.2, offset: 0.1 };

    const width = box.max.x - box.min.x;
    const depth = box.max.z - box.min.z;
    const maxDim = Math.max(width, depth);
    const scale = targetCoverage / maxDim;
    const offset = -(box.min.y * scale) + 0.1; 
    return { scale, offset };
  };

  const metrics = useMemo(() => ({
    rS: calcMetrics(rMeshS, 0.85),
    rM: calcMetrics(rMeshM, 0.90),
    rL: calcMetrics(rMeshL, 0.95),
    gS: calcMetrics(gMeshS, 0.85),
    gM: calcMetrics(gMeshM, 0.90),
    gL: calcMetrics(gMeshL, 0.95)
  }), [rMeshS, rMeshM, rMeshL, gMeshS, gMeshM, gMeshL]);

  const { controls, camera } = useThree();
  const lastCenter = useRef({ x: null, y: null });

  const renderVillages = React.useCallback((cx, cy) => {
    if (!mapData || !romanSRef.current || !gaulSRef.current || !fallbackRef.current) return;

    let rSCount = 0, rMCount = 0, rLCount = 0;
    let gSCount = 0, gMCount = 0, gLCount = 0;
    let fCount = 0;

    const WINDOW_RADIUS = 15;

    Object.values(mapData).forEach(tile => {
      if (Math.abs(tile.x - cx) > WINDOW_RADIUS || Math.abs(tile.y - cy) > WINDOW_RADIUS) return;

      if (tile.villageId && !tile.isOasis) {
        const tribe = (tile.tribe || '').toLowerCase();
        const pop = parseInt(tile.population) || 0;
        
        let isS = pop < 250;
        let isM = pop >= 250 && pop < 500;
        let isL = pop >= 500;
        
        let isRoman = tribe.includes('roman') || tribe === '';
        let isGaul = tribe.includes('gaul');

        if (graphicsQuality === 'low') {
           tempObj.rotation.set(-Math.PI / 2, 0, Math.PI / 4); 
           tempObj.position.set(tile.x, 0.11, -tile.y);
           let targetSize = isS ? 0.85 : isM ? 0.90 : 0.95;
           let planeScale = targetSize / 1.5;
           tempObj.scale.set(planeScale, planeScale * 1.73205, planeScale);
           tempObj.updateMatrix();

           if (isRoman) {
             if (isS && rSCount < MAX_VILLAGES) romanSRef.current.setMatrixAt(rSCount++, tempObj.matrix);
             else if (isM && rMCount < MAX_VILLAGES) romanMRef.current.setMatrixAt(rMCount++, tempObj.matrix);
             else if (isL && rLCount < MAX_VILLAGES) romanLRef.current.setMatrixAt(rLCount++, tempObj.matrix);
           } else if (isGaul) {
             if (isS && gSCount < MAX_VILLAGES) gaulSRef.current.setMatrixAt(gSCount++, tempObj.matrix);
             else if (isM && gMCount < MAX_VILLAGES) gaulMRef.current.setMatrixAt(gMCount++, tempObj.matrix);
             else if (isL && gLCount < MAX_VILLAGES) gaulLRef.current.setMatrixAt(gLCount++, tempObj.matrix);
           }
        } else {
           tempObj.rotation.set(0, 0, 0); 
           if (isRoman) {
             const m = isS ? metrics.rS : isM ? metrics.rM : metrics.rL;
             tempObj.position.set(tile.x, m.offset, -tile.y);
             tempObj.scale.set(m.scale, m.scale, m.scale);
             tempObj.updateMatrix();
             if (isS && rSCount < MAX_VILLAGES) romanSRef.current.setMatrixAt(rSCount++, tempObj.matrix);
             else if (isM && rMCount < MAX_VILLAGES) romanMRef.current.setMatrixAt(rMCount++, tempObj.matrix);
             else if (isL && rLCount < MAX_VILLAGES) romanLRef.current.setMatrixAt(rLCount++, tempObj.matrix);
           } else if (isGaul) {
             const m = isS ? metrics.gS : isM ? metrics.gM : metrics.gL;
             tempObj.position.set(tile.x, m.offset, -tile.y);
             tempObj.scale.set(m.scale, m.scale, m.scale);
             tempObj.updateMatrix();
             if (isS && gSCount < MAX_VILLAGES) gaulSRef.current.setMatrixAt(gSCount++, tempObj.matrix);
             else if (isM && gMCount < MAX_VILLAGES) gaulMRef.current.setMatrixAt(gMCount++, tempObj.matrix);
             else if (isL && gLCount < MAX_VILLAGES) gaulLRef.current.setMatrixAt(gLCount++, tempObj.matrix);
           } else {
             if (fCount < MAX_VILLAGES) {
                tempObj.rotation.set(0, 0, 0);
                tempObj.position.set(tile.x, 0.3, -tile.y);
                tempObj.scale.set(0.6, 0.6, 0.6); 
                tempObj.updateMatrix();
                fallbackRef.current.setMatrixAt(fCount++, tempObj.matrix);
             }
           }
        }
      }
    });

    romanSRef.current.count = rSCount; romanSRef.current.instanceMatrix.needsUpdate = true;
    romanMRef.current.count = rMCount; romanMRef.current.instanceMatrix.needsUpdate = true;
    romanLRef.current.count = rLCount; romanLRef.current.instanceMatrix.needsUpdate = true;
    
    gaulSRef.current.count = gSCount; gaulSRef.current.instanceMatrix.needsUpdate = true;
    gaulMRef.current.count = gMCount; gaulMRef.current.instanceMatrix.needsUpdate = true;
    gaulLRef.current.count = gLCount; gaulLRef.current.instanceMatrix.needsUpdate = true;

    fallbackRef.current.count = fCount; fallbackRef.current.instanceMatrix.needsUpdate = true;
  }, [mapData, tempObj, graphicsQuality, metrics, camera]);

  useEffect(() => {
    if (controls && controls.target) {
      const cx = Math.round(controls.target.x);
      const cy = Math.round(-controls.target.z);
      lastCenter.current = { x: cx, y: cy };
      renderVillages(cx, cy);
    }
  }, [mapData, controls, renderVillages, graphicsQuality]);

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
      {/* ROMANS */}
      {graphicsQuality === 'low' ? (
        <>
          <instancedMesh ref={romanSRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={rTexS} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={romanMRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={rTexM} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={romanLRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={rTexL} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
        </>
      ) : (
        <>
          {rMeshS && <instancedMesh ref={romanSRef} args={[rMeshS.geometry, rMeshS.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {rMeshM && <instancedMesh ref={romanMRef} args={[rMeshM.geometry, rMeshM.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {rMeshL && <instancedMesh ref={romanLRef} args={[rMeshL.geometry, rMeshL.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
        </>
      )}

      {/* GAULS */}
      {graphicsQuality === 'low' ? (
        <>
          <instancedMesh ref={gaulSRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={gTexS} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={gaulMRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={gTexM} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={gaulLRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={gTexL} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
        </>
      ) : (
        <>
          {gMeshS && <instancedMesh ref={gaulSRef} args={[gMeshS.geometry, gMeshS.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {gMeshM && <instancedMesh ref={gaulMRef} args={[gMeshM.geometry, gMeshM.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {gMeshL && <instancedMesh ref={gaulLRef} args={[gMeshL.geometry, gMeshL.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
        </>
      )}

      <instancedMesh ref={fallbackRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7f8fa6" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
