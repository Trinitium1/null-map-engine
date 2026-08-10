import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import InstancedGrid from './components/canvas/InstancedGrid';
import ExtractedTile from './components/canvas/ExtractedTile';
import CameraController from './components/canvas/CameraController';
import VectorOverlays from './components/canvas/VectorOverlays';
import RoleSprites from './components/canvas/RoleSprites';
import DynamicSun from './components/canvas/DynamicSun';
import PostProcessingManager from './components/canvas/PostProcessingManager';
import BiomeScatter from './components/canvas/BiomeScatter';
import VillageScatter from './components/canvas/VillageScatter';
import ContextMenu from './components/ui/ContextMenu';
import NotificationBell from './components/ui/NotificationBell';
import TacticalFilters from './components/ui/TacticalFilters';
import SettingsPanel from './components/ui/SettingsPanel';
import OwnerPanel from './components/ui/OwnerPanel';
import ZoomSpeedLines from './components/ui/ZoomSpeedLines';
import TileInfoPanel from './components/ui/TileInfoPanel';
import { useMapStore } from './store/mapStore';

const CAMERA_CONFIG = { position: [100, 100, 100], zoom: 45, near: -1000, far: 1000 };
const SHADOW_CONFIG = { type: THREE.PCFShadowMap };
const GL_CONFIG = { powerPreference: "high-performance", antialias: false };
const DPR_CONFIG = [1, 1.5];

export default function MapEngineApp() {
  const hydrateData = useMapStore(state => state.hydrateData);
  const fetchAlarms = useMapStore(state => state.fetchAlarms);
  const isLoading = useMapStore(state => state.isLoading);
  const cameraMode = useMapStore(state => state.cameraMode);
  const toggleCameraMode = useMapStore(state => state.toggleCameraMode);
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const shadowsEnabled = useMapStore(state => state.shadowsEnabled);
  const environmentEnabled = useMapStore(state => state.environmentEnabled);
  const currentCenterCoords = useMapStore(state => state.currentCenterCoords);
  const zoomLabel = useMapStore(state => state.zoomLabel);

  useEffect(() => {
    // Phase 13: One-time Initial Load from DB_World & DB_MAP
    hydrateData();
    
    // Phase 14: Smart Polling Initial Fetch & Interval
    fetchAlarms();
    const interval = setInterval(() => {
      fetchAlarms();
    }, 45000); // 45 seconds
    
    return () => clearInterval(interval);
  }, [hydrateData, fetchAlarms]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#282936', overflow: 'hidden', position: 'relative' }}>
      
      {/* Loading Overlay */}
      <div 
        id="loading-overlay" 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(13,15,20,0.95)', 
          backdropFilter: 'blur(10px)', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 2000, 
          transition: 'opacity 0.4s ease-out',
          opacity: isLoading ? 1 : 0,
          pointerEvents: isLoading ? 'all' : 'none'
        }}
      >
         <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid rgba(255,255,255,0.05)', 
            borderTopColor: '#e74c3c', 
            borderRadius: '50%', 
            animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite', 
            marginBottom: '15px', 
            boxShadow: '0 0 20px rgba(231, 76, 60, 0.2)' 
         }} />
         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
         <div style={{ color: '#ff4757', fontWeight: 600, letterSpacing: '1px' }}>Loading Map Intel...</div>
      </div>
      {/* Tactical Context Menu Overlay */}
      <ContextMenu />
      
      {/* Phase 22: Zoom Speed Lines Overlay */}
      <ZoomSpeedLines />
      <TileInfoPanel />
      
      {/* Configuration Panels */}
      <div className="absolute top-4 right-4 flex flex-col gap-4 items-end z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <SettingsPanel />
        </div>
      </div>
      
      {/* Render OwnerPanel directly since it handles its own positioning and collapse logic */}
      <OwnerPanel />
      
      {/* Notifications */}
      <NotificationBell />
      
      {/* Phase 8: Tactical Filters UI */}
      <TacticalFilters />

      {/* UI Footer Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'rgba(21, 24, 30, 0.95)',
        borderTop: '1px solid #2a2d36',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0 24px',
        gap: '24px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
      }}>
        {/* Coordinate Display */}
        <div style={{
          display: 'flex',
          gap: '16px',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#00f2fe',
          background: 'rgba(0, 242, 254, 0.1)',
          padding: '6px 16px',
          borderRadius: '4px',
          border: '1px solid rgba(0, 242, 254, 0.3)'
        }}>
          <span>🔍 {zoomLabel}</span>
          <span style={{ borderLeft: '1px solid rgba(0, 242, 254, 0.3)', paddingLeft: '16px' }}>X: {currentCenterCoords.x}</span>
          <span>Y: {currentCenterCoords.y}</span>
        </div>

        {/* Phase 7: Camera Mode Toggle UI */}
        <button 
          onClick={toggleCameraMode}
          style={{
            background: 'rgba(40, 41, 54, 0.8)',
            border: '1px solid #00f2fe',
            borderRadius: '4px',
            padding: '8px 16px',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(40, 41, 54, 0.8)'}
        >
          {cameraMode === 'isometric' ? '🗺️ 2D Tactical' : '🌐 3D View'}
        </button>
      </div>
      
      <Canvas 
        orthographic
        camera={CAMERA_CONFIG}
        shadows={SHADOW_CONFIG}
        gl={GL_CONFIG}
        dpr={DPR_CONFIG}
      >
        {/* Phase 7: Dynamic Camera Transitions */}
        <CameraController />
        
        <OrbitControls 
          makeDefault
          enableRotate={false} 
          enableZoom={false} 
          enablePan={true} 
          enableDamping={false}
          screenSpacePanning={false}
        />
        
        <ambientLight intensity={0.15} />
        <hemisphereLight skyColor="#ffffff" groundColor="#222222" intensity={0.25} />
        {/* The DirectionalLight was removed because CSM creates its own lights */}

        <InstancedGrid />
        
        {cameraMode === 'isometric' && (
          <>
            {/* The Shadow Catcher: Invisible plane that receives shadows efficiently */}
            {shadowsEnabled && (
              <mesh receiveShadow position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1000, 1000]} />
                <shadowMaterial transparent opacity={0.4} />
              </mesh>
            )}

            {/* Phase 12: Biome Rendering */}
            <BiomeScatter />
            
            {/* Phase 18: Village Rendering */}
            <VillageScatter />
          </>
        )}
        
        <ExtractedTile />
        
        {/* Phase 9: Troop Movement Vectors */}
        <VectorOverlays />

        {/* Phase 10: Player Role Tags */}
        <RoleSprites />

        {/* Phase 20: Dynamic Sun V3 (Two Cascades) */}
        <DynamicSun />

        {/* Phase 21: Post-Processing Engine */}
        <PostProcessingManager />
      </Canvas>
    </div>
  );
}
