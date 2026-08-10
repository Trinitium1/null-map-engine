import React from 'react';
import { useMapStore } from '../../store/mapStore';

export default function TileInfoPanel() {
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const selectedTile = useMapStore(state => state.selectedTile);
  const currentCenterCoords = useMapStore(state => state.currentCenterCoords);
  const mapData = useMapStore(state => state.mapData);

  let targetTileCoords = null;
  if (graphicsQuality === 'mid' && selectedTile) {
    targetTileCoords = { x: selectedTile.x, y: selectedTile.y };
  } else if (graphicsQuality === 'high' || graphicsQuality === 'low') {
    targetTileCoords = currentCenterCoords;
  }

  if (!targetTileCoords) return null;

  const tileData = mapData[`${targetTileCoords.x},${targetTileCoords.y}`];

  // Intel Parser
  let intelStatus = { text: "Unexplored Sector - No Intel", color: "#a4b0be" };
  let intelDetails = null;

  if (tileData) {
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
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '24px',
      zIndex: 50,
      background: 'rgba(15, 20, 30, 0.6)',
      border: '1px solid #00f2fe',
      boxShadow: '0 4px 20px rgba(0, 242, 254, 0.15)',
      borderRadius: '8px',
      padding: '16px',
      width: '220px',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      pointerEvents: 'auto',
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ fontSize: '10px', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
        SECTOR COORDS
      </div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>
        [{targetTileCoords.x}, {targetTileCoords.y}]
      </div>
      <div style={{ fontSize: '12px', color: intelStatus.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: intelStatus.color, borderRadius: '50%', boxShadow: `0 0 8px ${intelStatus.color}` }}></span>
        {intelStatus.text}
      </div>
      {intelDetails}
    </div>
  );
}
