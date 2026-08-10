import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { getExtensionUrl, safeLoadGeometry } from '../../utils/AssetManager';
import { prng } from '../../utils/prng';

function VillageModel({ tileData }) {
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const dracoPath = getExtensionUrl('/3dmapengine/assets/draco/gltf/');

  // ROMANS
  const { nodes: rNodesS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_S.glb'), dracoPath);
  const { nodes: rNodesM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_M.glb'), dracoPath);
  const { nodes: rNodesL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_L.glb'), dracoPath);
  const rTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_S.png'));
  const rTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_M.png'));
  const rTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Romans/Village_Romans_L.png'));

  // GAULS
  const { nodes: gNodesS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_S.glb'), dracoPath);
  const { nodes: gNodesM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_M.glb'), dracoPath);
  const { nodes: gNodesL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_L.glb'), dracoPath);
  const gTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_S.png'));
  const gTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_M.png'));
  const gTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Gauls/Village_Gauls_L.png'));

  // TEUTONS
  const { nodes: tNodesS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_S.glb'), dracoPath);
  const { nodes: tNodesM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_M.glb'), dracoPath);
  const { nodes: tNodesL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_L.glb'), dracoPath);
  const tTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_S.png'));
  const tTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_M.png'));
  const tTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Teutons/Village_Teutons_L.png'));

  const { nodes: hNodesS } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_S.glb'), dracoPath);
  const { nodes: hNodesM } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_M.glb'), dracoPath);
  const { nodes: hNodesL } = useGLTF(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_L.glb'), dracoPath);
  const hTexS = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_S.png'));
  const hTexM = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_M.png'));
  const hTexL = useTexture(getExtensionUrl('/3dmapengine/assets/Villages/Huns/Village_Huns_L.png'));

  if (!tileData || !tileData.villageId || tileData.isOasis) return null;

  const tribe = (tileData.tribe || '').toLowerCase();
  const pop = parseInt(tileData.population) || 0;
  
  let isS = pop < 250;
  let isM = pop >= 250 && pop < 500;
  let isL = pop >= 500;
  
  let isRoman = tribe.includes('roman') || tribe === '';
  let isGaul = tribe.includes('gaul');
  let isTeuton = tribe.includes('teuton');
  let isHun = tribe.includes('hun');

  if (graphicsQuality === 'low') {
    let tex;
    if (isRoman) tex = isS ? rTexS : isM ? rTexM : rTexL;
    else if (isGaul) tex = isS ? gTexS : isM ? gTexM : gTexL;
    else if (isTeuton) tex = isS ? tTexS : isM ? tTexM : tTexL;
    else if (isHun) tex = isS ? hTexS : isM ? hTexM : hTexL;
    
    if (!tex) return null; 
    
    let targetSize = isS ? 0.85 : isM ? 0.90 : 0.95;
    let planeScale = targetSize / 1.5;
    return (
      <mesh raycast={() => null} rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.11, 0]} scale={[planeScale, planeScale * 1.73205, planeScale]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
    );
  }

  const rMeshS = Object.values(rNodesS).find(n => n.isMesh);
  const rMeshM = Object.values(rNodesM).find(n => n.isMesh);
  const rMeshL = Object.values(rNodesL).find(n => n.isMesh);
  const gMeshS = Object.values(gNodesS).find(n => n.isMesh);
  const gMeshM = Object.values(gNodesM).find(n => n.isMesh);
  const gMeshL = Object.values(gNodesL).find(n => n.isMesh);
  const tMeshS = Object.values(tNodesS).find(n => n.isMesh);
  const tMeshM = Object.values(tNodesM).find(n => n.isMesh);
  const tMeshL = Object.values(tNodesL).find(n => n.isMesh);
  const hMeshS = Object.values(hNodesS).find(n => n.isMesh);
  const hMeshM = Object.values(hNodesM).find(n => n.isMesh);
  const hMeshL = Object.values(hNodesL).find(n => n.isMesh);

  if (!isRoman && !isGaul && !isTeuton && !isHun) {
    return (
      <mesh raycast={() => null} position={[0, 0.3, 0]} scale={[0.6, 0.6, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7f8fa6" roughness={0.8} />
      </mesh>
    );
  }

  let mesh;
  if (isRoman) mesh = isS ? rMeshS : isM ? rMeshM : rMeshL;
  else if (isGaul) mesh = isS ? gMeshS : isM ? gMeshM : gMeshL;
  else if (isTeuton) mesh = isS ? tMeshS : isM ? tMeshM : tMeshL;
  else if (isHun) mesh = isS ? hMeshS : isM ? hMeshM : hMeshL;
  
  let targetCoverage = isS ? 0.85 : isM ? 0.90 : 0.95;
  
  if (!mesh) return null;
  
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  const width = box.max.x - box.min.x;
  const depth = box.max.z - box.min.z;
  const maxDim = Math.max(width, depth);
  const scale = targetCoverage / maxDim;
  const offset = -(box.min.y * scale) + 0.1;

  // Use geometry directly so we ignore its nested transforms in GLTF and center it on our tile
  return (
    <group position={[0, offset, 0]} scale={[scale, scale, scale]}>
      <mesh raycast={() => null} geometry={mesh.geometry} material={mesh.material} castShadow receiveShadow />
    </group>
  );
}

function BiomeModel({ tileData }) {
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const [loadedGeoms, setLoadedGeoms] = React.useState({ wood: null, crop: null, iron: null, clay: null });

  React.useEffect(() => {
    let isMounted = true;
    const loadAssets = async () => {
       const [wood, crop, iron, clay] = await Promise.all([
          safeLoadGeometry('/3dmapengine/assets/models/wood.glb'),
          safeLoadGeometry('/3dmapengine/assets/models/crop.glb'),
          safeLoadGeometry('/3dmapengine/assets/models/iron.glb'),
          safeLoadGeometry('/3dmapengine/assets/models/clay.glb')
       ]);
       if (isMounted) setLoadedGeoms({ wood, crop, iron, clay });
    };
    loadAssets();
    return () => { isMounted = false; };
  }, []);

  if (!tileData || !tileData.isOasis || !tileData.oasisType) return null;

  let instancesToPlace = 1;
  if (graphicsQuality === 'mid') instancesToPlace = 2;
  if (graphicsQuality === 'high') instancesToPlace = 4;

  const type = tileData.oasisType.toLowerCase();
  let geom = null;
  let color = "#fff";
  
  if (type.includes('wood')) { geom = loadedGeoms.wood; color = "#2e7d32"; }
  else if (type.includes('crop')) { geom = loadedGeoms.crop; color = "#fbc02d"; }
  else if (type.includes('iron')) { geom = loadedGeoms.iron; color = "#9e9e9e"; }
  else if (type.includes('clay')) { geom = loadedGeoms.clay; color = "#d84315"; }

  const instances = [];
  for (let i = 0; i < instancesToPlace; i++) {
    let offsetX = 0;
    let offsetZ = 0;
    let scale = 0.6 + (prng(tileData.x + 5, tileData.y + i) * 0.8);
    
    if (graphicsQuality !== 'low' && i > 0) {
      let scatterRadius = graphicsQuality === 'high' ? 1.3 : 0.7;
      offsetX = (prng(tileData.x, tileData.y + i) - 0.5) * scatterRadius;
      offsetZ = (prng(tileData.x + 1, tileData.y + i) - 0.5) * scatterRadius;
    }

    instances.push(
      <mesh 
        key={i} 
        raycast={() => null}
        geometry={geom} 
        position={[offsetX, 0.4 * scale, offsetZ]} 
        rotation={[
          (prng(tileData.x + 3, tileData.y + i) - 0.5) * 0.2,
          prng(tileData.x + 2, tileData.y + i) * Math.PI * 2,
          (prng(tileData.x + 4, tileData.y + i) - 0.5) * 0.2
        ]}
        scale={[scale, scale, scale]} 
        castShadow receiveShadow
      >
        {!geom && type.includes('wood') && <coneGeometry args={[0.3, 0.8, 4]} />}
        {!geom && type.includes('crop') && <cylinderGeometry args={[0.2, 0.2, 0.6, 6]} />}
        {!geom && type.includes('iron') && <tetrahedronGeometry args={[0.5]} />}
        {!geom && type.includes('clay') && <boxGeometry args={[0.4, 0.4, 0.4]} />}
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    );
  }

  return <group position={[0, 0.2, 0]}>{instances}</group>;
}

function TileParticles({ color, isExiting }) {
  const count = 15;
  const meshRef = React.useRef();
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.8,
      z: (Math.random() - 0.5) * 0.8,
      y: -0.1 - Math.random() * 0.4,
      speed: 0.2 + Math.random() * 0.5,
      scale: Math.random() * 0.05 + 0.01,
      rotSpeed: Math.random() * 5
    }));
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || isExiting) return;
    const safeDelta = Math.min(delta, 0.1);
    particles.forEach((p, i) => {
      p.y -= safeDelta * p.speed;
      if (p.y < -4.0) {
        p.y = -0.1 - Math.random() * 0.2;
        p.x = (Math.random() - 0.5) * 0.8;
        p.z = (Math.random() - 0.5) * 0.8;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.x += p.rotSpeed * safeDelta;
      dummy.rotation.y += p.rotSpeed * safeDelta;
      
      // Particles stay larger for longer by scaling against a lower floor point, but capped to avoid giant particles
      const s = Math.min(0.03, Math.max(0.001, p.scale * ((p.y + 4.0) * 0.6)));
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (isExiting) return null;

  return (
    <instancedMesh raycast={() => null} ref={meshRef} args={[null, null, count]} position={[0, -0.1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={new THREE.Color(...color)} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

export function AnimatedTile({ tile, isExiting }) {
  const meshRef = React.useRef();
  const mapData = useMapStore(state => state.mapData);
  const tileData = mapData[`${tile.x},${tile.y}`];

  // Glowing borders
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const glowRef = React.useRef();

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1); // prevent massive jumps on lag

    // Animation Logic
    if (meshRef.current) {
      if (isExiting) {
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, safeDelta * 15);
        if (meshRef.current.position.y <= 0.01) {
          useMapStore.getState().removeAnimatingOutTile(tile.instanceId);
        }
      } else {
        const floatOffset = Math.sin(state.clock.elapsedTime * 2) * 0.03;
        // Raise 1.5x higher than before (0.35 * 1.5 = 0.525)
        const targetY = 0.525 + floatOffset;
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, safeDelta * 10);
      }
    }
    
    // Glow pulse
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.2 + 0.5;
      glowRef.current.opacity = pulse;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={[tile.x, isExiting ? 0.3 : 0, tile.z]}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (e.nativeEvent && e.nativeEvent.preventDefault) {
          e.nativeEvent.preventDefault();
        }
        if (useMapStore.getState().isDraggingMap) return;
        useMapStore.getState().openContextMenu(e.clientX, e.clientY, [tile.x, tile.y]);
      }}
    >
      <boxGeometry args={[1, 0.2, 1]} />
      <meshBasicMaterial color={new THREE.Color(...tile.color)} />
      
      {/* Sci-Fi wireframe border to emphasize the extracted tile */}
      <lineSegments raycast={() => null}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 0.2, 1)]} />
        <lineBasicMaterial ref={glowRef} color={new THREE.Color('#00f2fe')} opacity={0.6} transparent />
      </lineSegments>

      <TileParticles color={tile.color} isExiting={isExiting} />

      {/* Phase 22: Tactical Golden Glow in Mid/High */}
      {(graphicsQuality === 'mid' || graphicsQuality === 'high') && (
        <mesh raycast={() => null} scale={[1.05, 1.2, 1.05]}>
          <boxGeometry args={[1, 0.2, 1]} />
          <meshBasicMaterial color={new THREE.Color('#ffd700')} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {/* Render the contents on top of the tile so they move with it */}
      <React.Suspense fallback={null}>
        <VillageModel tileData={tileData} />
        <BiomeModel tileData={tileData} />
      </React.Suspense>
    </mesh>
  );
}

export default function ExtractedTile() {
  const selectedTile = useMapStore(state => state.selectedTile);
  const animatingOutTiles = useMapStore(state => state.animatingOutTiles);

  return (
    <>
      {selectedTile && <AnimatedTile key={`sel-${selectedTile.instanceId}`} tile={selectedTile} isExiting={false} />}
      {animatingOutTiles && animatingOutTiles.map(t => (
        <AnimatedTile key={`out-${t.instanceId}`} tile={t} isExiting={true} />
      ))}
    </>
  );
}
