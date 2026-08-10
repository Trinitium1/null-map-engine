import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';

export function AnimatedTile({ tile, isExiting }) {
  const meshRef = useRef();
  const finishAnimationOut = useMapStore(state => state.finishAnimationOut);
  const mapData = useMapStore(state => state.mapData);
  const activeUI = useMapStore(state => state.activeUI);
  const tileData = mapData[`${tile.x},${tile.y}`];

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smooth lerp on Y axis (Extraction Effect)
    if (isExiting) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, delta * 12);
      
      // Cleanup when it hits the ground
      if (meshRef.current.position.y < 0.05) {
        finishAnimationOut();
      }
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 2, delta * 12);
    }
  });

  // Intel Parser
  let intelStatus = { text: "Unexplored Sector - No Intel", color: "#a4b0be" };
  let intelDetails = null;

  if (tileData) {
    // A tile is occupied if it has a villageId, playerId, playerName, or allianceName
    const isOccupied = tileData.villageId || tileData.playerId || tileData.playerName || tileData.allianceName;
    const isOasis = tileData.isOasis || (tileData.type && tileData.type.includes('oasis')) || (tileData.villageName && tileData.villageName.toLowerCase().includes('oasis'));

    if (isOasis) {
       if (isOccupied) {
           intelStatus = { text: `Occupied Oasis - ${tileData.oasisType || "wood"}`, color: "#ff4757" };
       } else {
           intelStatus = { text: `Free Oasis - ${tileData.oasisType || "wood"}`, color: "#2ed573" };
       }
       if (isOccupied) {
          intelDetails = (
            <div style={{ marginTop: '8px', fontSize: '11px', textAlign: 'left', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
              <div style={{ color: '#dfe4ea', marginBottom: '2px' }}>👤 {tileData.playerName || 'Nature'}</div>
              <div style={{ color: '#00f2fe', marginBottom: '2px' }}>🛡️ {tileData.allianceName || 'No Alliance'}</div>
            </div>
          );
       } else {
           intelDetails = (
            <div style={{ marginTop: '8px', fontSize: '11px', textAlign: 'left', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
              <div style={{ color: '#2ed573', marginBottom: '2px' }}>🌿 {tileData.bonus || 'Unknown Bonus'}</div>
            </div>
          );
       }
    } else if (isOccupied) {
      intelStatus = { text: "Active Settlement", color: "#ff4757" };
      intelDetails = (
        <div style={{ marginTop: '8px', fontSize: '11px', textAlign: 'left', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
          <div style={{ color: '#dfe4ea', marginBottom: '2px' }}>👤 {tileData.playerName || 'Unknown'}</div>
          <div style={{ color: '#00f2fe', marginBottom: '2px' }}>🛡️ {tileData.allianceName || 'No Alliance'}</div>
          <div style={{ color: '#eccc68' }}>👥 Pop: {tileData.population || tileData.pop || '?'}</div>
        </div>
      );
    } else {
      intelStatus = { text: "Empty Terrain", color: "#747d8c" };
      if (tileData.terrain) {
         intelDetails = (
           <div style={{ marginTop: '8px', fontSize: '11px', textAlign: 'left', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
             <div style={{ color: '#747d8c', marginBottom: '2px' }}>⛰️ Terrain: {tileData.terrain}</div>
           </div>
         );
      }
    }
  }

  return (
    <mesh 
      ref={meshRef} 
      position={[tile.x, isExiting ? 2 : 0, tile.z]}
    >
      <boxGeometry args={[1, 0.2, 1]} />
      <meshBasicMaterial color={new THREE.Color(...tile.color)} />
      
      {/* Sci-Fi wireframe border to emphasize the extracted tile */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 0.2, 1)]} />
        <lineBasicMaterial color={new THREE.Color('#00f2fe')} opacity={0.6} transparent />
      </lineSegments>

      {/* HTML Overlay anchored to this 3D position */}
      {!isExiting && (
        <Html position={[0, 0.5, 0]} center zIndexRange={activeUI === 'extractedTile' ? [9999, 0] : [1000, 0]}>
          <div 
            onPointerDownCapture={() => useMapStore.getState().bringToFront('extractedTile')}
            style={{
            background: 'rgba(15, 20, 30, 0.95)',
            border: '1px solid #00f2fe',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            width: '200px',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            pointerEvents: 'auto',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
              SECTOR COORDS
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              [{tile.x}, {tile.y}]
            </div>
            <div style={{ fontSize: '12px', color: intelStatus.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: intelStatus.color, borderRadius: '50%', boxShadow: `0 0 8px ${intelStatus.color}` }}></span>
              {intelStatus.text}
            </div>
            {intelDetails}
          </div>
        </Html>
      )}
    </mesh>
  );
}

export default function ExtractedTile() {
  const selectedTile = useMapStore(state => state.selectedTile);
  const animatingOutTile = useMapStore(state => state.animatingOutTile);

  return (
    <>
      {selectedTile && <AnimatedTile key={`sel-${selectedTile.instanceId}`} tile={selectedTile} isExiting={false} />}
      {animatingOutTile && <AnimatedTile key={`out-${animatingOutTile.instanceId}`} tile={animatingOutTile} isExiting={true} />}
    </>
  );
}
