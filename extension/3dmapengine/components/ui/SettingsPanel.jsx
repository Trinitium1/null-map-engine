import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const graphicsQuality = useMapStore(state => state.graphicsQuality);
  const setGraphicsQuality = useMapStore(state => state.setGraphicsQuality);
  const shadowsEnabled = useMapStore(state => state.shadowsEnabled);
  const environmentEnabled = useMapStore(state => state.environmentEnabled);
  const setCustomGraphicOption = useMapStore(state => state.setCustomGraphicOption);

  return (
    <>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '80px', // Positioned left of the Notification Bell
          zIndex: 100,
          background: 'rgba(40, 41, 54, 0.9)',
          border: '1px solid #4a4b5d',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '18px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#00f2fe';
          e.currentTarget.style.transform = 'rotate(90deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#4a4b5d';
          e.currentTarget.style.transform = 'rotate(0deg)';
        }}
      >
        ⚙️
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '74px',
          right: '80px',
          zIndex: 101,
          background: 'rgba(40, 41, 54, 0.95)',
          border: '1px solid #00f2fe',
          borderRadius: '8px',
          padding: '16px',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Graphics
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {['low', 'mid', 'high', 'custom'].map(level => (
              <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: level === 'custom' ? 'default' : 'pointer', fontSize: '13px', color: '#e0e0e0', opacity: level === 'custom' && graphicsQuality !== 'custom' ? 0.5 : 1 }}>
                <input 
                  type="radio" 
                  name="graphicsQuality" 
                  value={level}
                  checked={graphicsQuality === level}
                  onChange={() => {
                    if (level !== 'custom') setGraphicsQuality(level);
                  }}
                  disabled={level === 'custom'}
                  style={{ cursor: level === 'custom' ? 'default' : 'pointer' }}
                />
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </label>
            ))}
          </div>

          <div style={{ height: '1px', background: '#4a4b5d', width: '100%', marginBottom: '8px' }} />

          <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#a0a0b0', textTransform: 'uppercase' }}>
            Advanced Options
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#e0e0e0' }}>
              <input 
                type="checkbox" 
                checked={shadowsEnabled}
                onChange={(e) => setCustomGraphicOption('shadowsEnabled', e.target.checked)}
              />
              Dynamic Shadows
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#e0e0e0' }}>
              <input 
                type="checkbox" 
                checked={environmentEnabled}
                onChange={(e) => setCustomGraphicOption('environmentEnabled', e.target.checked)}
              />
              PBR Environment (HDRI)
            </label>
          </div>
        </div>
      )}
    </>
  );
}
