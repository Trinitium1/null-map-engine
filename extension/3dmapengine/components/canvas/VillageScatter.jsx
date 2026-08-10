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
  const selectedTile = useMapStore(state => state.selectedTile);
  const animatingOutTile = useMapStore(state => state.animatingOutTile);

  const romanSRef = useRef();
  const romanMRef = useRef();
  const romanLRef = useRef();
  
  const gaulSRef = useRef();
  const gaulMRef = useRef();
  const gaulLRef = useRef();
  
  const teutonSRef = useRef();
  const teutonMRef = useRef();
  const teutonLRef = useRef();

  const hunSRef = useRef();
  const hunMRef = useRef();
  const hunLRef = useRef();
  
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

  // TEUTONS
  const { nodes: tNodesS, materials: tMatS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_S.glb'), dracoPath);
  const { nodes: tNodesM, materials: tMatM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_M.glb'), dracoPath);
  const { nodes: tNodesL, materials: tMatL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_L.glb'), dracoPath);

  const tTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_S.png'));
  const tTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_M.png'));
  const tTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_L.png'));

  const { nodes: hNodesS, materials: hMatS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_S.glb'), dracoPath);
  const { nodes: hNodesM, materials: hMatM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_M.glb'), dracoPath);
  const { nodes: hNodesL, materials: hMatL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_L.glb'), dracoPath);

  const hTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_S.png'));
  const hTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_M.png'));
  const hTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_L.png'));

  if (tTexS) tTexS.colorSpace = THREE.SRGBColorSpace;
  if (tTexM) tTexM.colorSpace = THREE.SRGBColorSpace;
  if (tTexL) tTexL.colorSpace = THREE.SRGBColorSpace;
  if (hTexS) hTexS.colorSpace = THREE.SRGBColorSpace;
  if (hTexM) hTexM.colorSpace = THREE.SRGBColorSpace;
  if (hTexL) hTexL.colorSpace = THREE.SRGBColorSpace;

  const rMeshS = useMemo(() => Object.values(rNodesS).find(n => n.isMesh), [rNodesS]);
  const rMeshM = useMemo(() => Object.values(rNodesM).find(n => n.isMesh), [rNodesM]);
  const rMeshL = useMemo(() => Object.values(rNodesL).find(n => n.isMesh), [rNodesL]);

  const gMeshS = useMemo(() => Object.values(gNodesS).find(n => n.isMesh), [gNodesS]);
  const gMeshM = useMemo(() => Object.values(gNodesM).find(n => n.isMesh), [gNodesM]);
  const gMeshL = useMemo(() => Object.values(gNodesL).find(n => n.isMesh), [gNodesL]);

  const tMeshS = useMemo(() => Object.values(tNodesS).find(n => n.isMesh), [tNodesS]);
  const tMeshM = useMemo(() => Object.values(tNodesM).find(n => n.isMesh), [tNodesM]);
  const tMeshL = useMemo(() => Object.values(tNodesL).find(n => n.isMesh), [tNodesL]);

  const hMeshS = useMemo(() => Object.values(hNodesS).find(n => n.isMesh), [hNodesS]);
  const hMeshM = useMemo(() => Object.values(hNodesM).find(n => n.isMesh), [hNodesM]);
  const hMeshL = useMemo(() => Object.values(hNodesL).find(n => n.isMesh), [hNodesL]);

  useEffect(() => {
    const fixMaterial = (mesh) => {
      if (mesh && mesh.material) {
        mesh.material.metalness = 0.1;
        mesh.material.roughness = 0.9;
        mesh.material.needsUpdate = true;
        mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2000);
      }
    };
    [rMeshS, rMeshM, rMeshL, gMeshS, gMeshM, gMeshL, tMeshS, tMeshM, tMeshL, hMeshS, hMeshM, hMeshL].forEach(fixMaterial);
  }, [rMeshS, rMeshM, rMeshL, gMeshS, gMeshM, gMeshL, tMeshS, tMeshM, tMeshL, hMeshS, hMeshM, hMeshL]);

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
    gL: calcMetrics(gMeshL, 0.95),
    tS: calcMetrics(tMeshS, 0.85),
    tM: calcMetrics(tMeshM, 0.90),
    tL: calcMetrics(tMeshL, 0.95),
    hS: calcMetrics(hMeshS, 0.85),
    hM: calcMetrics(hMeshM, 0.90),
    hL: calcMetrics(hMeshL, 0.95)
  }), [rMeshS, rMeshM, rMeshL, gMeshS, gMeshM, gMeshL, tMeshS, tMeshM, tMeshL, hMeshS, hMeshM, hMeshL]);

  const { controls, camera } = useThree();
  const lastCenter = useRef({ x: null, y: null });

  const renderVillages = React.useCallback((cx, cy) => {
    if (!mapData || !romanSRef.current || !gaulSRef.current || !fallbackRef.current) return;

    let rSCount = 0, rMCount = 0, rLCount = 0;
    let gSCount = 0, gMCount = 0, gLCount = 0;
    let tSCount = 0, tMCount = 0, tLCount = 0;
    let hSCount = 0, hMCount = 0, hLCount = 0;
    let fCount = 0;

    const WINDOW_RADIUS = 15;

    Object.values(mapData).forEach(tile => {
      if (Math.abs(tile.x - cx) > WINDOW_RADIUS || Math.abs(tile.y - cy) > WINDOW_RADIUS) return;

      const isSelected = useMapStore.getState().selectedTile?.x === tile.x && useMapStore.getState().selectedTile?.y === tile.y;
      const isAnimatingOut = useMapStore.getState().animatingOutTile?.x === tile.x && useMapStore.getState().animatingOutTile?.y === tile.y;
      if (isSelected || isAnimatingOut) return;

      if (tile.villageId && !tile.isOasis) {
        const tribe = (tile.tribe || '').toLowerCase();
        const pop = parseInt(tile.population) || 0;
        
        let isS = pop < 250;
        let isM = pop >= 250 && pop < 500;
        let isL = pop >= 500;
        
        let isRoman = tribe.includes('roman') || tribe === '';
        let isGaul = tribe.includes('gaul');
        let isTeuton = tribe.includes('teuton');
        let isHun = tribe.includes('hun');

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
           } else if (isTeuton) {
             if (isS && tSCount < MAX_VILLAGES) teutonSRef.current.setMatrixAt(tSCount++, tempObj.matrix);
             else if (isM && tMCount < MAX_VILLAGES) teutonMRef.current.setMatrixAt(tMCount++, tempObj.matrix);
             else if (isL && tLCount < MAX_VILLAGES) teutonLRef.current.setMatrixAt(tLCount++, tempObj.matrix);
           } else if (isHun) {
              if (isS && hSCount < MAX_VILLAGES) hunSRef.current.setMatrixAt(hSCount++, tempObj.matrix);
              else if (isM && hMCount < MAX_VILLAGES) hunMRef.current.setMatrixAt(hMCount++, tempObj.matrix);
              else if (isL && hLCount < MAX_VILLAGES) hunLRef.current.setMatrixAt(hLCount++, tempObj.matrix);
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
           } else if (isTeuton) {
             const m = isS ? metrics.tS : isM ? metrics.tM : metrics.tL;
             tempObj.position.set(tile.x, m.offset, -tile.y);
             tempObj.scale.set(m.scale, m.scale, m.scale);
             tempObj.updateMatrix();
             if (isS && tSCount < MAX_VILLAGES) teutonSRef.current.setMatrixAt(tSCount++, tempObj.matrix);
             else if (isM && tMCount < MAX_VILLAGES) teutonMRef.current.setMatrixAt(tMCount++, tempObj.matrix);
             else if (isL && tLCount < MAX_VILLAGES) teutonLRef.current.setMatrixAt(tLCount++, tempObj.matrix);
           } else if (isHun) {
             const m = isS ? metrics.hS : isM ? metrics.hM : metrics.hL;
             tempObj.position.set(tile.x, m.offset, -tile.y);
             tempObj.scale.set(m.scale, m.scale, m.scale);
             tempObj.updateMatrix();
             if (isS && hSCount < MAX_VILLAGES) hunSRef.current.setMatrixAt(hSCount++, tempObj.matrix);
             else if (isM && hMCount < MAX_VILLAGES) hunMRef.current.setMatrixAt(hMCount++, tempObj.matrix);
             else if (isL && hLCount < MAX_VILLAGES) hunLRef.current.setMatrixAt(hLCount++, tempObj.matrix);
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

    if (romanSRef.current) { romanSRef.current.count = rSCount; romanSRef.current.instanceMatrix.needsUpdate = true; }
    if (romanMRef.current) { romanMRef.current.count = rMCount; romanMRef.current.instanceMatrix.needsUpdate = true; }
    if (romanLRef.current) { romanLRef.current.count = rLCount; romanLRef.current.instanceMatrix.needsUpdate = true; }
    
    if (gaulSRef.current) { gaulSRef.current.count = gSCount; gaulSRef.current.instanceMatrix.needsUpdate = true; }
    if (gaulMRef.current) { gaulMRef.current.count = gMCount; gaulMRef.current.instanceMatrix.needsUpdate = true; }
    if (gaulLRef.current) { gaulLRef.current.count = gLCount; gaulLRef.current.instanceMatrix.needsUpdate = true; }

    if (teutonSRef.current) { teutonSRef.current.count = tSCount; teutonSRef.current.instanceMatrix.needsUpdate = true; }
    if (teutonMRef.current) { teutonMRef.current.count = tMCount; teutonMRef.current.instanceMatrix.needsUpdate = true; }
    if (teutonLRef.current) { teutonLRef.current.count = tLCount; teutonLRef.current.instanceMatrix.needsUpdate = true; }

    if (hunSRef.current) { hunSRef.current.count = hSCount; hunSRef.current.instanceMatrix.needsUpdate = true; }
    if (hunMRef.current) { hunMRef.current.count = hMCount; hunMRef.current.instanceMatrix.needsUpdate = true; }
    if (hunLRef.current) { hunLRef.current.count = hLCount; hunLRef.current.instanceMatrix.needsUpdate = true; }

    if (fallbackRef.current) { fallbackRef.current.count = fCount; fallbackRef.current.instanceMatrix.needsUpdate = true; }
  }, [mapData, tempObj, graphicsQuality, metrics, camera]);

  useEffect(() => {
    if (controls && controls.target) {
      const cx = Math.round(controls.target.x);
      const cy = Math.round(-controls.target.z);
      lastCenter.current = { x: cx, y: cy };
      renderVillages(cx, cy);
    }
  }, [mapData, controls, renderVillages, graphicsQuality, selectedTile, animatingOutTile]);

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

      {/* TEUTONS */}
      {graphicsQuality === 'low' ? (
        <>
          <instancedMesh ref={teutonSRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={tTexS} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={teutonMRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={tTexM} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={teutonLRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={tTexL} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
        </>
      ) : (
        <>
          {tMeshS && <instancedMesh ref={teutonSRef} args={[tMeshS.geometry, tMeshS.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {tMeshM && <instancedMesh ref={teutonMRef} args={[tMeshM.geometry, tMeshM.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {tMeshL && <instancedMesh ref={teutonLRef} args={[tMeshL.geometry, tMeshL.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
        </>
      )}

      {/* HUNS */}
      {graphicsQuality === 'low' ? (
        <>
          <instancedMesh ref={hunSRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={hTexS} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={hunMRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={hTexM} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
          <instancedMesh ref={hunLRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false}><planeGeometry args={[1.5, 1.5]} /><meshBasicMaterial map={hTexL} transparent alphaTest={0.5} side={THREE.DoubleSide} /></instancedMesh>
        </>
      ) : (
        <>
          {hMeshS && <instancedMesh ref={hunSRef} args={[hMeshS.geometry, hMeshS.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {hMeshM && <instancedMesh ref={hunMRef} args={[hMeshM.geometry, hMeshM.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
          {hMeshL && <instancedMesh ref={hunLRef} args={[hMeshL.geometry, hMeshL.material, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow />}
        </>
      )}

      <instancedMesh ref={fallbackRef} args={[null, null, MAX_VILLAGES]} frustumCulled={false} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7f8fa6" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
