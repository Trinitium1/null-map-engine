import React, { useEffect, useState } from 'react';
import { useMapStore } from '../../store/mapStore';

export default function ContextMenu() {
  const contextMenu = useMapStore(state => state.contextMenu);
  const closeContextMenu = useMapStore(state => state.closeContextMenu);
  const addTacticalRoute = useMapStore(state => state.addTacticalRoute);
  const postAlarm = useMapStore(state => state.postAlarm);
  const [showPings, setShowPings] = useState(false);
  
  // Phase 16: UI Container Layering
  const activeUI = useMapStore(state => state.activeUI);
  const bringToFront = useMapStore(state => state.bringToFront);
  const isFront = activeUI === 'contextMenu';

  useEffect(() => {
    if (!contextMenu.isOpen) {
      setShowPings(false);
      return;
    }
    
    const handleOutsideClick = (e) => {
      closeContextMenu();
    };
    
    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('contextmenu', handleOutsideClick);
    }, 10);
    
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen || !contextMenu.tileCoords) return null;

  const handlePing = (pingType) => {
    // Phase 14: Publish to Inmersive Alarms DB
    postAlarm({
      id: `ping-${Date.now()}`,
      x: contextMenu.tileCoords[0],
      y: contextMenu.tileCoords[1],
      title: `Tactical Ping: ${pingType}`,
      message: `Action required at sector [${contextMenu.tileCoords[0]}, ${contextMenu.tileCoords[1]}]`,
      target: { type: 'everyone' }
    });
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.storage.local.get(['discordId', 'discordUser', 'serverData'], (res) => {
        const payload = [{ 
          action: "map_ping_discord", 
          extVersion: chrome.runtime.getManifest().version || "1.9", 
          discordId: res.discordId || "unknown",
          discordUsername: res.discordUser?.username || "Agent",
          pingType: pingType,
          coords: contextMenu.tileCoords
        }];
        const hostname = res.serverData?.hostname || "cw.x2.international.travian.com";
        
        // DIRECT FETCH BYPASSING background.js
        fetch(chrome.runtime.getURL('servers.json'))
          .then(r => r.json())
          .then(servers => {
              const url = servers[hostname];
              if (!url) {
                  console.error("🔥 [DEBUG] Webhook URL not found in servers.json for", hostname);
                  closeContextMenu();
                  return;
              }
              return fetch(url, {
                  method: 'POST',
                  redirect: 'follow',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify(payload)
              });
          })
          .then(r => r.text())
          .then(text => {
              if (text && text.includes("ERROR")) {
                  console.error("GAS returned ERROR:", text);
              }
              closeContextMenu();
          })
          .catch(err => {
              console.error("🔥 [DEBUG] Direct Fetch Error:", err);
              closeContextMenu();
          });
      });
    } else {
      console.warn("🔥 [DEBUG] Chrome extension API not found!");
      closeContextMenu();
    }
  };

  const handleDrawRoute = () => {
    addTacticalRoute({
      id: `route-${Date.now()}`,
      start: [0, 0],
      end: contextMenu.tileCoords,
      type: 'attack'
    });
    closeContextMenu();
  };

  const openTravian = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['serverData'], (res) => {
         const host = res.serverData?.hostname || "cw.x2.international.travian.com";
         window.open(`https://${host}/karte.php?x=${contextMenu.tileCoords[0]}&y=${contextMenu.tileCoords[1]}`, '_blank');
      });
    } else {
         window.open(`https://cw.x2.international.travian.com/karte.php?x=${contextMenu.tileCoords[0]}&y=${contextMenu.tileCoords[1]}`, '_blank');
    }
    closeContextMenu();
  };

  return (
    <div 
      onPointerDownCapture={(e) => {
        bringToFront('contextMenu');
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: contextMenu.y,
        left: contextMenu.x,
        background: '#282936',
        border: '1px solid #00f2fe',
        borderRadius: '8px',
        padding: '8px',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: isFront ? 9999 : 1000,
        width: '180px'
      }}
    >
      <style>{`
        .ctx-btn {
          background: transparent;
          border: none;
          color: #fff;
          padding: 8px 12px;
          text-align: left;
          cursor: pointer;
          border-radius: 4px;
          font-size: 13px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ctx-btn:hover { 
          background: rgba(0, 242, 254, 0.15); 
          color: #00f2fe; 
        }
        .ping-subbtn {
          background: rgba(0,0,0,0.2);
          margin-left: 10px;
          padding: 6px 12px;
          font-size: 12px;
          color: #a4b0be;
        }
        .ping-subbtn:hover {
          color: #fff;
          background: rgba(0, 242, 254, 0.2);
        }
      `}</style>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#a4b0be', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        paddingBottom: '6px', 
        marginBottom: '4px',
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>
        SECTOR [{contextMenu.tileCoords[0]}|{contextMenu.tileCoords[1]}]
      </div>
      
      {/* Ping Target Menu */}
      <div 
        style={{ display: 'flex', flexDirection: 'column' }} 
        onMouseEnter={() => setShowPings(true)}
        onMouseLeave={() => setShowPings(false)}
      >
        <button className="ctx-btn" style={{ width: '100%' }}>
          🎯 Ping Target {showPings ? '▾' : '▸'}
        </button>
        
        {showPings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            <button className="ctx-btn ping-subbtn" onClick={() => handlePing('Call Off')}>⚔️ Call Off</button>
            <button className="ctx-btn ping-subbtn" onClick={() => handlePing('Call Def')}>🛡️ Call Def</button>
            <button className="ctx-btn ping-subbtn" onClick={() => handlePing('Req Scout')}>👁️ Req Scout</button>
          </div>
        )}
      </div>

      <button className="ctx-btn" onClick={openTravian}>
        🔗 View in Travian
      </button>
      
      <button className="ctx-btn" onClick={handleDrawRoute}>
        📍 Draw Route Here
      </button>
      
      <button className="ctx-btn" onClick={() => {
        navigator.clipboard.writeText(`[${contextMenu.tileCoords[0]}|${contextMenu.tileCoords[1]}]`);
        closeContextMenu();
      }}>
        📋 Copy Coordinates
      </button>
    </div>
  );
}
