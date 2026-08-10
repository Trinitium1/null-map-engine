import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { getBaseColor } from '../../utils/colorUtils';

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
  const animatingOutTiles = useMapStore(state => state.animatingOutTiles);
  const setSelectedTile = useMapStore(state => state.setSelectedTile);
  const openContextMenu = useMapStore(state => state.openContextMenu);
  const mapData = useMapStore(state => state.mapData);
  const filters = useMapStore(state => state.filters); // Phase 8

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
    const c = getBaseColor(worldX, worldZ, tileData, filters);
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
    if (animatingOutTiles && animatingOutTiles.length > 0) {
      animatingOutTiles.forEach(t => currentHiddenIds.add(t.instanceId));
    }
    
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
  }, [selectedTile, animatingOutTiles]);

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
            const { worldX, worldZ } = getCoordsFromId(e.instanceId);
            const tileY = -worldZ;
            
            // Jump Camera to the clicked tile
            useMapStore.setState({ cameraJumpTarget: { x: worldX, y: tileY } });
            
            // Phase 22 UX Updates
            const graphicsQuality = useMapStore.getState().graphicsQuality;
            if (graphicsQuality === 'high' || graphicsQuality === 'low') {
               // The jump will change currentCenterCoords, updating the InfoPanel.
               // We DO NOT set selectedTile here for High/Low because High auto-selects the center tile
               // during the jump, and Low does not raise tiles.
               return;
            }

            if (selectedTile && selectedTile.instanceId === e.instanceId) {
               return; // Do nothing if clicking the already selected tile
            }
            const tileData = mapData[`${worldX},${tileY}`];
            const c = getBaseColor(worldX, worldZ, tileData, filters);
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
          if (useMapStore.getState().isDraggingMap) return;
          
          if (e.instanceId !== undefined) {
            const { worldX, worldZ } = getCoordsFromId(e.instanceId);
            const tileY = -worldZ;
            openContextMenu(e.clientX, e.clientY, [worldX, tileY]);
          }
        }}
      >
        <boxGeometry args={[1, 0.2, 1]} />
        <meshBasicMaterial />
      </instancedMesh>
      
      {/* Phase 15: Tactical Borders Overlay */}
      <TerritoryBorders />
    </group>
  );
}
