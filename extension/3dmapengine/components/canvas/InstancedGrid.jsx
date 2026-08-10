import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { prng } from '../../utils/prng';
import { useMapStore } from '../../store/mapStore';

const GRID_SIZE = 400;
const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE;
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const hoverColor = new THREE.Color('#00f2fe');

const getCoordsFromId = (id) => {
  const offset = Math.floor(GRID_SIZE / 2);
  const x = Math.floor(id / GRID_SIZE);
  const z = id % GRID_SIZE;
  return { worldX: x - offset, worldZ: z - offset };
};

const TerritoryBorders = () => {
  const meshRef = useRef();
  const mapData = useMapStore(state => state.mapData);
  const showTerritories = useMapStore(state => state.showTerritories);
  const confederacyTags = useMapStore(state => state.confederacyTags) || [];
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < INSTANCE_COUNT; i++) {
      let scale = 0;
      let r = 0, g = 0, b = 0;

      if (showTerritories) {
        const { worldX, worldZ } = getCoordsFromId(i);
        const tileY = -worldZ;
        const tileData = mapData[`${worldX},${tileY}`];
        
        if (tileData && tileData.allianceName) {
           const alliance = tileData.allianceName.toUpperCase();
           
           // Check against dynamic confederacy tags from ServerSide Config
           const isAllied = confederacyTags.some(tag => {
              const upperTag = tag.toUpperCase();
              if (upperTag.endsWith('*')) {
                return alliance.startsWith(upperTag.slice(0, -1));
              }
              return alliance === upperTag;
           });
           
           if (isAllied) {
             // Allied Confederacy (Neon Cyan)
             r = 0.0; g = 0.95; b = 1.0;
             scale = 1.02;
           } else {
             // Enemy (Neon Red)
             r = 1.0; g = 0.0; b = 0.33;
             scale = 1.02;
           }
        }
      }
      
      const { worldX, worldZ } = getCoordsFromId(i);
      tempObject.position.set(worldX, 0, worldZ);
      tempObject.scale.set(scale, scale * 1.05, scale); // 1.05 on Y to prevent z-fighting top/bottom
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      
      tempColor.setRGB(r, g, b);
      meshRef.current.setColorAt(i, tempColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [mapData, showTerritories]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, INSTANCE_COUNT]} receiveShadow>
      <boxGeometry args={[1, 0.2, 1]} />
      <meshBasicMaterial wireframe={true} transparent opacity={0.8} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
};

export default function InstancedGrid() {
  const meshRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const prevHoveredId = useRef(null);
  
  const selectedTile = useMapStore(state => state.selectedTile);
  const animatingOutTile = useMapStore(state => state.animatingOutTile);
  const setSelectedTile = useMapStore(state => state.setSelectedTile);
  const openContextMenu = useMapStore(state => state.openContextMenu);
  const mapData = useMapStore(state => state.mapData);
  const filters = useMapStore(state => state.filters); // Phase 8

  const getBaseColor = (worldX, worldZ, tileData) => {
    const tileY = -worldZ;
    // Base Procedural Grass Color
    const rand = prng(worldX, tileY);
    let r = 0.15 + (rand * 0.05);
    let g = 0.65 + (rand * 0.20);
    let b = 0.30 + (rand * 0.15);

    // FOW (Age of Empires Style): Unexplored tiles are the same terrain, just unlit/darkened
    if (!tileData) {
      return { r: r * 0.1, g: g * 0.1, b: b * 0.1 };
    }

    // Phase 8: Dynamic Highlighting (Overrides all other colors)
    if (filters.highlightAlliance && tileData.allianceName) {
      if (tileData.allianceName.toUpperCase() === filters.highlightAlliance.toUpperCase()) {
        return { r: 1.0, g: 0.0, b: 0.33 }; // #ff0055 Neon Red
      }
    }
    if (filters.showOnly15Croppers) {
      // Mock logic for 15-croppers: in this fakeData we will highlight Crop Oasis for now
      // Real logic would check tileData.fieldTypes or similar
      if (tileData.isOasis && tileData.oasisType && tileData.oasisType.toLowerCase().includes('crop')) {
        return { r: 0.98, g: 1.0, b: 0.0 }; // #fbff00 Neon Yellow
      }
    }
    

    // Tactical & Terrain Overrides
    if (tileData.isOasis || tileData.oasisType) {
      // Oasis (Yellowish/Brownish tints depending on type, simplified)
      const type = (tileData.oasisType || "").toLowerCase();
      if (type.includes("wood")) { r += 0.2; g -= 0.1; b -= 0.2; } // Brownish
      else if (type.includes("crop") || type.includes("wheat")) { r += 0.3; g += 0.3; b -= 0.1; } // Yellowish
      else if (type.includes("iron")) { r += 0.1; g -= 0.2; b += 0.1; } // Darker
      else if (type.includes("clay")) { r += 0.3; g += 0.1; b -= 0.1; } // Orangeish
      else { r += 0.1; g += 0.1; b += 0.2; } // Water/Generic Oasis
    } else if (tileData.villageId || tileData.playerId) {
      // Village Tactical Borders (Placeholder implementation)
      const alliance = (tileData.allianceName || "").toUpperCase();
      if (alliance === "NULL" || alliance === "TRINITIUM") { // Assume confederation
        r = 0.1; g = 0.3; b = 0.9; // Blue for allies
      } else if (alliance !== "") {
        r = 0.9; g = 0.2; b = 0.2; // Red for enemies/others
      } else {
        r = 0.5; g = 0.5; b = 0.5; // Grey for no-alliance/abandoned
      }
    }

    // Clamp values
    return {
      r: Math.min(1, Math.max(0, r)),
      g: Math.min(1, Math.max(0, g)),
      b: Math.min(1, Math.max(0, b))
    };
  };

  // Coords logic moved to top level


  const updateInstance = (id, scale, highlight = false) => {
    if (!meshRef.current || id === undefined || id === null) return;
    const { worldX, worldZ } = getCoordsFromId(id);
    const tileY = -worldZ;
    const tileData = mapData[`${worldX},${tileY}`];
    
    // Position & Scale
    tempObject.position.set(worldX, 0, worldZ);
    tempObject.scale.set(scale, scale, scale);
    tempObject.updateMatrix();
    meshRef.current.setMatrixAt(id, tempObject.matrix);
    
    // Color
    const c = getBaseColor(worldX, worldZ, tileData);
    tempColor.setRGB(c.r, c.g, c.b);
    if (highlight) {
       tempColor.lerp(hoverColor, 0.5);
    }
    meshRef.current.setColorAt(id, tempColor);
  };

  // Initial Setup
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < INSTANCE_COUNT; i++) {
      updateInstance(i, 1, false);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
    
    // CRITICAL: Recompute the bounding sphere AFTER setting the matrices
    // so the raycaster knows the mesh extends beyond the 0,0 center!
    meshRef.current.computeBoundingSphere();
  }, []);

  // Update Colors when mapData (FOW) or filters change
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < INSTANCE_COUNT; i++) {
       // Only update colors, keep current scale/hidden state
       const isHidden = prevHiddenIds.current.has(i);
       updateInstance(i, isHidden ? 0 : 1, hoveredId === i);
    }
    meshRef.current.instanceColor.needsUpdate = true;
  }, [mapData, filters]);

  // Handle Selection Visibility (Hide clicked tiles)
  const prevHiddenIds = useRef(new Set());
  useEffect(() => {
    if (!meshRef.current) return;
    
    const currentHiddenIds = new Set();
    if (selectedTile) currentHiddenIds.add(selectedTile.instanceId);
    if (animatingOutTile) currentHiddenIds.add(animatingOutTile.instanceId);
    
    // Restore tiles that are no longer hidden
    prevHiddenIds.current.forEach(id => {
      if (!currentHiddenIds.has(id)) {
        updateInstance(id, 1, hoveredId === id);
      }
    });
    
    // Hide current active tiles
    currentHiddenIds.forEach(id => {
      updateInstance(id, 0, false);
    });
    
    prevHiddenIds.current = currentHiddenIds;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [selectedTile, animatingOutTile]);

  // Handle Hover Tinting
  useEffect(() => {
    if (!meshRef.current) return;
    
    if (prevHoveredId.current !== null && prevHoveredId.current !== hoveredId) {
       const id = prevHoveredId.current;
       const isHidden = prevHiddenIds.current.has(id);
       updateInstance(id, isHidden ? 0 : 1, false);
    }
    
    if (hoveredId !== null) {
       const isHidden = prevHiddenIds.current.has(hoveredId);
       updateInstance(hoveredId, isHidden ? 0 : 1, true);
    }
    
    prevHoveredId.current = hoveredId;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [hoveredId]);

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[null, null, INSTANCE_COUNT]}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && e.instanceId !== hoveredId) {
            setHoveredId(e.instanceId);
          }
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            if (selectedTile && selectedTile.instanceId === e.instanceId) {
               setSelectedTile(null); // Toggle off if clicked again
               return;
            }
            const { worldX, worldZ } = getCoordsFromId(e.instanceId);
            const tileY = -worldZ;
            const tileData = mapData[`${worldX},${tileY}`];
            const c = getBaseColor(worldX, worldZ, tileData);
            setSelectedTile({
              instanceId: e.instanceId,
              x: worldX,
              y: tileY,
              z: worldZ,
              color: [c.r, c.g, c.b]
            });
          }
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          // Prevent default browser context menu
          if (e.nativeEvent && e.nativeEvent.preventDefault) {
            e.nativeEvent.preventDefault();
          }
          if (e.instanceId !== undefined) {
            const { worldX, worldZ } = getCoordsFromId(e.instanceId);
            const tileY = -worldZ;
            openContextMenu(e.clientX, e.clientY, [worldX, tileY]);
          }
        }}
        onPointerMissed={() => setSelectedTile(null)}
      >
        <boxGeometry args={[1, 0.2, 1]} />
        <meshBasicMaterial />
      </instancedMesh>
      
      {/* Phase 15: Tactical Borders Overlay */}
      <TerritoryBorders />
    </group>
  );
}
