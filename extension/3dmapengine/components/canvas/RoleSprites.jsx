import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useMapStore } from '../../store/mapStore';

const ICONS = {
  'off': '⚔️',
  'def': '🛡️',
  'scout': '👁️',
  'veteran': '⭐',
  'leader': '🧩'
};

export default function RoleSprites() {
  const mapData = useMapStore(state => state.mapData);

  // Extract tiles that have roles
  const taggedTiles = useMemo(() => {
    if (!mapData) return [];
    return Object.values(mapData).filter(tile => tile.roles && tile.roles.length > 0);
  }, [mapData]);

  if (taggedTiles.length === 0) return null;

  return (
    <group>
      {taggedTiles.map((tile, idx) => {
        // Build the string of icons
        const iconString = tile.roles.map(r => ICONS[r.toLowerCase()] || '').join(' ');
        
        return (
          <Html
            key={`role-${tile.villageId || idx}`}
            position={[tile.x, 0.8, -tile.y]}
            center
            zIndexRange={[100, 0]}
            style={{
              pointerEvents: 'none',
              fontSize: '20px', // Fixed readable size regardless of zoom
              textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px -1px 2px rgba(0,0,0,0.9), 2px 0px 4px rgba(0,0,0,0.9), -2px 0px 4px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {iconString}
          </Html>
        );
      })}
    </group>
  );
}
