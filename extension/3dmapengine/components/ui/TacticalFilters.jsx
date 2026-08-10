import React from 'react';
import { useMapStore } from '../../store/mapStore';

export default function TacticalFilters() {
  const filters = useMapStore(state => state.filters);
  const setFilters = useMapStore(state => state.setFilters);
  const hydrateData = useMapStore(state => state.hydrateData);
  
  // Phase 16: UI Container Layering
  const activeUI = useMapStore(state => state.activeUI);
  const bringToFront = useMapStore(state => state.bringToFront);
  const isFront = activeUI === 'tacticalFilters';

  return (
    <div 
      onPointerDownCapture={() => bringToFront('tacticalFilters')}
      style={{
      position: 'absolute',
      left: '24px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: isFront ? 9999 : 1000,
      background: 'rgba(40, 41, 54, 0.6)',
      border: '1px solid #00f2fe',
      borderRadius: '8px',
      padding: '20px',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      width: '250px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Tactical Filters
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', color: '#a0a0b0' }}>TARGET ALLIANCE</label>
        <input 
          type="text"
          placeholder="e.g. NULL"
          value={filters.highlightAlliance || ''}
          onChange={(e) => setFilters({ highlightAlliance: e.target.value.toUpperCase() })}
          style={{
            background: 'rgba(20, 21, 30, 0.8)',
            border: '1px solid #4a4b5d',
            borderRadius: '4px',
            padding: '8px 12px',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#00f2fe'}
          onBlur={(e) => e.target.style.borderColor = '#4a4b5d'}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
        <input 
          type="checkbox" 
          id="croppers"
          checked={filters.showOnly15Croppers || false}
          onChange={(e) => setFilters({ showOnly15Croppers: e.target.checked })}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="croppers" style={{ fontSize: '13px', color: '#e0e0e0', cursor: 'pointer' }}>
          Highlight 15 Croppers
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
        <input 
          type="checkbox" 
          id="territories"
          checked={useMapStore(state => state.showTerritories)}
          onChange={useMapStore(state => state.toggleTerritories)}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="territories" style={{ fontSize: '13px', color: '#00f2fe', cursor: 'pointer', fontWeight: 600 }}>
          🌐 Show Territory Borders
        </label>
      </div>

      <div style={{ marginTop: '8px', borderTop: '1px solid #4a4b5d', paddingTop: '16px' }}>
        <button
          onClick={hydrateData}
          style={{
            width: '100%',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid #00f2fe',
            borderRadius: '6px',
            padding: '10px',
            color: '#00f2fe',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>🔄</span> Refresh Intel
        </button>
      </div>
    </div>
  );
}
