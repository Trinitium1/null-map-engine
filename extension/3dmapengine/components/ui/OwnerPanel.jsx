import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { PRESETS } from '../../store/scene-presets';

const inputStyle = {
  width: '100%',
  cursor: 'pointer',
  marginBottom: '8px',
  accentColor: '#00f2fe'
};

const Slider = ({ label, prop, min, max, step = 0.01, config, setConfig }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#e0e0e0' }}>
      <span>{label}</span>
      <span style={{ color: '#00f2fe' }}>{config[prop]}</span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} 
      value={config[prop]} 
      onChange={(e) => setConfig({ [prop]: parseFloat(e.target.value) })}
      style={inputStyle}
    />
  </div>
);

const Toggle = ({ label, prop, config, setConfig }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff', marginBottom: '12px', cursor: 'pointer' }}>
    <input 
      type="checkbox" 
      checked={config[prop]}
      onChange={(e) => setConfig({ [prop]: e.target.checked })}
      style={{ cursor: 'pointer' }}
    />
    {label}
  </label>
);

export default function OwnerPanel() {
  const userRole = useMapStore(state => state.userRole);
  const config = useMapStore(state => state.engineConfig);
  const setConfig = useMapStore(state => state.setEngineConfig);
  
  const [activeTab, setActiveTab] = useState('lighting');
  const [isOpen, setIsOpen] = useState(false);

  if (userRole !== 'Owner') return null;
  if (!isOpen) {
    return (
      <div style={{ position: 'absolute', top: '16px', right: '140px', zIndex: 1000 }}>
         <button 
           onClick={() => setIsOpen(true)} 
           style={{
             background: 'rgba(40, 41, 54, 0.9)',
             border: '1px solid #00f2fe',
             color: '#00f2fe',
             padding: '8px 16px',
             borderRadius: '6px',
             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
             fontSize: '13px',
             fontWeight: 'bold',
             cursor: 'pointer',
             backdropFilter: 'blur(10px)',
           }}
         >
            ⚡ Owner Mode
         </button>
      </div>
    );
  }

  const containerStyle = {
    position: 'absolute',
    top: '16px',
    right: '140px',
    zIndex: 1000,
    width: '340px',
    background: 'rgba(31, 34, 41, 0.95)',
    border: '1px solid #00f2fe',
    borderRadius: '8px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    backdropFilter: 'blur(10px)',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(21, 24, 30, 0.9)',
    padding: '12px',
    borderBottom: '1px solid #2a2d36',
  };

  const tabContainerStyle = {
    display: 'flex',
    borderBottom: '1px solid #2a2d36',
    fontSize: '12px',
  };

  const getTabStyle = (tabName) => ({
    flex: 1,
    padding: '10px 0',
    textAlign: 'center',
    cursor: 'pointer',
    background: activeTab === tabName ? '#2a2d36' : 'transparent',
    color: activeTab === tabName ? '#00f2fe' : '#a0a0b0',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    border: 'none',
    borderBottom: activeTab === tabName ? '2px solid #00f2fe' : '2px solid transparent',
    transition: 'all 0.2s',
  });

  const contentStyle = {
    padding: '16px',
    maxHeight: '65vh',
    overflowY: 'auto',
  };

  const sectionTitleStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#a0a0b0',
    marginBottom: '10px',
    textTransform: 'uppercase',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", config.presetName + "_Preset.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  return (
    <div 
      style={containerStyle}
      onPointerDownCapture={(e) => e.stopPropagation()}
      onPointerMoveCapture={(e) => e.stopPropagation()}
      onPointerUpCapture={(e) => e.stopPropagation()}
      onWheelCapture={(e) => e.stopPropagation()}
    >
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe', display: 'inline-block' }}></span>
          God Mode
        </h2>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#a0a0b0', cursor: 'pointer', fontSize: '14px' }}>✕</button>
      </div>
      
      <div style={tabContainerStyle}>
        <button style={getTabStyle('lighting')} onClick={() => setActiveTab('lighting')}>Lighting</button>
        <button style={getTabStyle('post')} onClick={() => setActiveTab('post')}>Post-Proc</button>
        <button style={getTabStyle('scenarios')} onClick={() => setActiveTab('scenarios')}>Scenarios</button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'lighting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={sectionTitleStyle}>Global Sun</h3>
              <Slider label="Direction X" prop="lightDirX" min={-5} max={5} config={config} setConfig={setConfig} />
              <Slider label="Direction Y" prop="lightDirY" min={-5} max={5} config={config} setConfig={setConfig} />
              <Slider label="Direction Z" prop="lightDirZ" min={-5} max={5} config={config} setConfig={setConfig} />
              <Slider label="Intensity" prop="intensity" min={0} max={5} config={config} setConfig={setConfig} />
              <Toggle label="Show Debug Helper Lines" prop="displayHelper" config={config} setConfig={setConfig} />
            </div>
            
            <div style={{ paddingTop: '12px', borderTop: '1px solid #2a2d36' }}>
              <h3 style={sectionTitleStyle}>
                Near Cascade (High Res)
                <input type="checkbox" checked={config.enableNear} onChange={(e) => setConfig({ enableNear: e.target.checked })} />
              </h3>
              {config.enableNear && (
                <div style={{ paddingLeft: '8px', borderLeft: '2px solid #2a2d36', marginTop: '8px' }}>
                  <Slider label="Frustum Box Size" prop="nearSize" min={10} max={200} step={1} config={config} setConfig={setConfig} />
                  <Slider label="Frustum Margin (Offset)" prop="nearMargin" min={10} max={500} step={1} config={config} setConfig={setConfig} />
                  <Slider label="Shadow Camera Near" prop="nearNear" min={0.01} max={50} step={0.1} config={config} setConfig={setConfig} />
                  <Slider label="Shadow Camera Far" prop="nearFar" min={100} max={1000} step={10} config={config} setConfig={setConfig} />
                  <Slider label="Shadow Bias" prop="nearBias" min={-0.005} max={0.005} step={0.0001} config={config} setConfig={setConfig} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#e0e0e0' }}>Shadow Map Resolution</span>
                    <select value={config.nearMapSize} onChange={(e) => setConfig({nearMapSize: parseInt(e.target.value)})} style={{ background: '#2a2d36', color: '#fff', border: '1px solid #4a4d56', borderRadius: '4px', padding: '4px', fontSize: '12px' }}>
                      <option value="512">512</option><option value="1024">1024</option><option value="2048">2048</option><option value="4096">4096</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid #2a2d36' }}>
              <h3 style={sectionTitleStyle}>
                Far Cascade (Low Res)
                <input type="checkbox" checked={config.enableFar} onChange={(e) => setConfig({ enableFar: e.target.checked })} />
              </h3>
              {config.enableFar && (
                <div style={{ paddingLeft: '8px', borderLeft: '2px solid #2a2d36', marginTop: '8px' }}>
                  <Slider label="Frustum Box Size" prop="farSize" min={100} max={1500} step={10} config={config} setConfig={setConfig} />
                  <Slider label="Frustum Margin (Offset)" prop="farMargin" min={100} max={1500} step={10} config={config} setConfig={setConfig} />
                  <Slider label="Shadow Camera Near" prop="farNear" min={1} max={500} step={1} config={config} setConfig={setConfig} />
                  <Slider label="Shadow Camera Far" prop="farFar" min={500} max={3000} step={10} config={config} setConfig={setConfig} />
                  <Slider label="Shadow Bias" prop="farBias" min={-0.005} max={0.005} step={0.0001} config={config} setConfig={setConfig} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#e0e0e0' }}>Shadow Map Resolution</span>
                    <select value={config.farMapSize} onChange={(e) => setConfig({farMapSize: parseInt(e.target.value)})} style={{ background: '#2a2d36', color: '#fff', border: '1px solid #4a4d56', borderRadius: '4px', padding: '4px', fontSize: '12px' }}>
                      <option value="256">256</option><option value="512">512</option><option value="1024">1024</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'post' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Toggle label="Master Enable Post-Processing" prop="enablePostProcessing" config={config} setConfig={setConfig} />
            
            {config.enablePostProcessing && (
              <>
                <div style={{ paddingTop: '12px', borderTop: '1px solid #2a2d36' }}>
                  <h3 style={sectionTitleStyle}>
                    Color Grading
                    <input type="checkbox" checked={config.enableColorGrading} onChange={(e) => setConfig({ enableColorGrading: e.target.checked })} />
                  </h3>
                  {config.enableColorGrading && (
                    <div style={{ paddingLeft: '8px', borderLeft: '2px solid #2a2d36', marginTop: '8px' }}>
                      <Slider label="Brightness" prop="brightness" min={-1} max={1} step={0.01} config={config} setConfig={setConfig} />
                      <Slider label="Contrast" prop="contrast" min={-1} max={1} step={0.01} config={config} setConfig={setConfig} />
                      <Slider label="Saturation" prop="saturation" min={-1} max={1} step={0.01} config={config} setConfig={setConfig} />
                      <Slider label="Hue" prop="hue" min={-Math.PI} max={Math.PI} step={0.01} config={config} setConfig={setConfig} />
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid #2a2d36' }}>
                  <h3 style={sectionTitleStyle}>
                    Bloom (Glow)
                    <input type="checkbox" checked={config.enableBloom} onChange={(e) => setConfig({ enableBloom: e.target.checked })} />
                  </h3>
                  {config.enableBloom && (
                    <div style={{ paddingLeft: '8px', borderLeft: '2px solid #2a2d36', marginTop: '8px' }}>
                      <Slider label="Intensity" prop="bloomIntensity" min={0} max={5} step={0.01} config={config} setConfig={setConfig} />
                      <Slider label="Luminance Threshold" prop="bloomLuminanceThreshold" min={0} max={1} step={0.01} config={config} setConfig={setConfig} />
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid #2a2d36' }}>
                  <h3 style={sectionTitleStyle}>
                    Vignette
                    <input type="checkbox" checked={config.enableVignette} onChange={(e) => setConfig({ enableVignette: e.target.checked })} />
                  </h3>
                  {config.enableVignette && (
                    <div style={{ paddingLeft: '8px', borderLeft: '2px solid #2a2d36', marginTop: '8px' }}>
                      <Slider label="Darkness" prop="vignetteDarkness" min={0} max={1} step={0.01} config={config} setConfig={setConfig} />
                      <Slider label="Offset" prop="vignetteOffset" min={0} max={1} step={0.01} config={config} setConfig={setConfig} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#00f2fe', margin: 0, textTransform: 'uppercase' }}>Load Scenario Preset</h3>
            <p style={{ fontSize: '12px', color: '#a0a0b0', margin: 0 }}>
              Select a pre-configured scenario to instantly apply lighting and post-processing settings.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(PRESETS).map(presetKey => (
                <button
                  key={presetKey}
                  onClick={() => setConfig(PRESETS[presetKey])}
                  style={{
                    background: '#2a2d36',
                    border: '1px solid #4a4b5d',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00f2fe';
                    e.currentTarget.style.color = '#00f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#4a4b5d';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  <span>{presetKey}</span>
                  <span style={{ fontSize: '16px' }}>▶</span>
                </button>
              ))}
              {Object.keys(PRESETS).length === 0 && (
                <div style={{ color: '#a0a0b0', fontSize: '12px', fontStyle: 'italic', padding: '8px' }}>No presets loaded yet.</div>
              )}
            </div>

            <div style={{ height: '1px', background: '#2a2d36', margin: '8px 0' }}></div>

            <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#a0a0b0', margin: 0, textTransform: 'uppercase' }}>Save Configuration</h3>
            <p style={{ fontSize: '12px', color: '#a0a0b0', margin: 0 }}>
              Export your perfect setup to a single JSON file. Drop it into <code>store/scene-presets/</code> to use it.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#e0e0e0' }}>Preset Name</span>
              <input 
                type="text" 
                value={config.presetName} 
                onChange={(e) => setConfig({ presetName: e.target.value })}
                style={{ background: 'rgba(20, 21, 30, 0.8)', border: '1px solid #4a4b5d', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <button 
              onClick={handleExport}
              style={{
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid #00f2fe',
                borderRadius: '6px',
                padding: '12px',
                color: '#00f2fe',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
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
              Export Unified JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
