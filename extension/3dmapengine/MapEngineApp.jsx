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
import { useMapStore } from './store/mapStore';

export default function MapEngineApp() {
  const hydrateData = useMapStore(state => state.hydrateData);
  const fetchAlarms = useMapStore(state => state.fetchAlarms);
  const isLoading = useMapStore(state => state.isLoading);
  const cameraMode = useMapStore(state => state.cameraMode);
  const toggleCameraMode = useMapStore(state => state.toggleCameraMode);
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const shadowsEnabled = useMapStore(state => state.shadowsEnabled);
  const environmentEnabled = useMapStore(state => state.environmentEnabled);

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

      {/* Phase 7: Camera Mode Toggle UI */}
      <button 
        onClick={toggleCameraMode}
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          background: 'rgba(40, 41, 54, 0.8)',
          border: '1px solid #00f2fe',
          borderRadius: '8px',
          padding: '12px 24px',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'bold',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(40, 41, 54, 0.8)'}
      >
        {cameraMode === 'isometric' ? '🗺️ 2D Tactical' : '🌐 3D View'}
      </button>
      
      <Canvas 
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ powerPreference: "high-performance", antialias: false }}
        dpr={[1, 1.5]}
      >
        {/* Phase 7: Dynamic Camera Transitions */}
        <CameraController />
        
        <OrthographicCamera makeDefault position={[100, 100, 100]} zoom={25} near={-1000} far={1000} />
        <OrbitControls 
          makeDefault
          enableRotate={false} 
          enableZoom={true} 
          enablePan={true} 
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
