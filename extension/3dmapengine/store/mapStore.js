import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PRESETS } from './scene-presets';

const ZOOM_STEPS = [3, 6, 10, 20, 30, 45, 60];

const getZoomProps = (level) => {
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const tilesToFit = ZOOM_STEPS[level - 1];
  // An isometric tile diagonal is approx 1.414 units.
  return {
    zoom: screenWidth / (tilesToFit * 1.414),
    label: `Zoom: X${8 - level}`
  };
};

export const useMapStore = create(subscribeWithSelector((set, get) => ({
  filters: {},
  alarmList: [],
  unreadAlarms: 0,
  panTarget: null,
  currentCenterCoords: { x: 0, y: 0 },
  isDraggingMap: false,
  
  // Phase 3: Selection & Extraction State
  selectedTile: null, // { instanceId, x, z, color }
  animatingOutTiles: [], // Array of tiles animating down
  showIntelPanel: false,
  
  // Phase 4: Tactical Context Menu
  contextMenu: { isOpen: false, x: 0, y: 0, tileCoords: null },
  
  // Phase 6: Data Hydration & Fog of War
  mapData: {}, // O(1) lookup dictionary by "x,z"
  
  // Phase 7: Camera Modes (isometric | top-down)
  cameraMode: 'isometric',
  
  // Phase 22: Stepped Zoom System
  zoomLevel: 3,
  targetZoom: getZoomProps(3).zoom,
  zoomLabel: getZoomProps(3).label,
  isZooming: false,
  
  // Phase 9: Tactical Vector Overlays
  tacticalRoutes: [],
  showTacticalFilters: true,
  userRole: 'Owner', // 'Owner' or 'Player'

  // Phase 11: Graphics Settings
  graphicsQuality: 'high', // 'low', 'mid', 'high', 'custom'
  shadowsEnabled: true,

  // Engine Configuration (Owner Presets)
  engineConfig: {
    // Dynamic Sun
    enableNear: true,
    enableFar: true,
    lightDirX: -1,
    lightDirY: -1.5,
    lightDirZ: -1,
    intensity: 1.0,
    nearMargin: 150, nearSize: 60, nearNear: 0.1, nearFar: 300, nearMapSize: 2048, nearBias: -0.0005,
    farMargin: 500, farSize: 500, farNear: 10, farFar: 1500, farMapSize: 512, farBias: -0.001,
    displayHelper: false,
    
    // Post Processing
    enablePostProcessing: true,
    enableColorGrading: true,
    brightness: 0.0, contrast: 0.1, hue: 0.0, saturation: 0.1,
    enableBloom: true,
    bloomIntensity: 1.5, bloomLuminanceThreshold: 0.1,
    enableVignette: true,
    vignetteOffset: 0.3, vignetteDarkness: 0.5,
    shadowMapSize: 4096,
    presetName: 'Scenario_1_Noon',
    enableZoomAnimation: true,
    ...PRESETS['Scenario_1_Noon']
  },
  environmentEnabled: true,
  
  // Phase 15: Tactical Outlines
  showTerritories: false,
  confederacyTags: [],
  
  // Phase 16: UI Container Layering
  activeUI: null,
  
  // Actions
  setZoomLevel: (delta) => set((state) => {
    let nextLevel = state.zoomLevel + delta;
    if (nextLevel < 1) nextLevel = 1;
    if (nextLevel > 7) nextLevel = 7;
    
    const props = getZoomProps(nextLevel);
    
    return {
      zoomLevel: nextLevel,
      targetZoom: props.zoom,
      zoomLabel: props.label
    };
  }),
  setIsZooming: (isZooming) => set({ isZooming }),
  bringToFront: (uiId) => set({ activeUI: uiId }),
  toggleCameraMode: () => set((state) => ({ 
    cameraMode: state.cameraMode === 'isometric' ? 'top-down' : 'isometric' 
  })),
  toggleTerritories: () => set((state) => ({ showTerritories: !state.showTerritories })),
  setGraphicsQuality: (level) => {
    set((state) => {
      let settings = { graphicsQuality: level };
      let newConfig = { ...state.engineConfig };
      
      if (level === 'low') {
        settings.cameraMode = 'isometric';
        settings.shadowsEnabled = false;
        settings.environmentEnabled = false;
        newConfig.enablePostProcessing = false;
        newConfig.enableNear = false;
        newConfig.enableFar = false;
        newConfig.shadowMapSize = 512;
        newConfig.enableZoomAnimation = false;
        
        // Phase 23: Cleanup active tiles when switching to Low
        const currentSelected = get().selectedTile;
        if (currentSelected) {
           const outList = [...get().animatingOutTiles, currentSelected].slice(-15);
           set({ animatingOutTiles: outList, selectedTile: null });
        }
      } else if (level === 'mid') {
        settings.cameraMode = 'isometric';
        settings.shadowsEnabled = true;
        settings.environmentEnabled = false;
        newConfig.enablePostProcessing = false;
        newConfig.enableNear = true;
        newConfig.nearMapSize = 2048;
        newConfig.enableFar = false;
        newConfig.enableBloom = false;
        newConfig.enableVignette = true;
        newConfig.shadowMapSize = 1024;
        newConfig.enableZoomAnimation = false;
      } else if (level === 'high') {
        settings.cameraMode = 'isometric';
        settings.shadowsEnabled = true;
        settings.environmentEnabled = true;
        newConfig.enableNear = true;
        newConfig.nearMapSize = 4096;
        newConfig.enableFar = true;
        newConfig.farMapSize = 1024;
        newConfig.enableBloom = true;
        newConfig.enableVignette = true;
        newConfig.enablePostProcessing = true;
        newConfig.shadowMapSize = 4096;
        newConfig.enableZoomAnimation = true;
      } else if (level === 'custom') {
        settings.graphicsQuality = 'custom';
      }
      settings.engineConfig = newConfig;
      return settings;
    });
  },
  setCustomGraphicOption: (key, value) => set(state => ({
    engineConfig: { ...state.engineConfig, [key]: value },
    graphicsQuality: 'custom'
  })),
  setTacticalRoutes: (routes) => set({ tacticalRoutes: routes }),
  setShowTacticalFilters: (show) => set({ showTacticalFilters: show }),
  setEngineConfig: (newConfig) => set((state) => ({ engineConfig: { ...state.engineConfig, ...newConfig } })),
  addTacticalRoute: (route) => set((state) => ({
    tacticalRoutes: [...state.tacticalRoutes, route]
  })),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  setIsDraggingMap: (isDragging) => set({ isDraggingMap: isDragging }),
  setPanTarget: (coords) => set({ panTarget: coords }),
  setCurrentCenterCoords: (coords) => set({ currentCenterCoords: coords }),
  markAlarmRead: (id) => set((state) => {
    let readAlarms = [];
    try { readAlarms = JSON.parse(localStorage.getItem('readAlarms') || '[]'); } catch(e) {}
    if (!readAlarms.includes(id)) {
      readAlarms.push(id);
      localStorage.setItem('readAlarms', JSON.stringify(readAlarms));
    }
    
    // Update local state to mark it read and decrement unread count
    const newList = state.alarmList.map(a => a.id === id ? { ...a, isRead: true } : a);
    return { 
      alarmList: newList, 
      unreadAlarms: Math.max(0, state.unreadAlarms - 1)
    };
  }),

  postAlarm: async (alarmData) => {
    try {
      const { discordId, hostname } = await new Promise(resolve => {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['discordId', 'serverData'], (res) => {
            resolve({
              discordId: res.discordId || "unknown",
              hostname: res.serverData?.hostname || "cw.x2.international.travian.com"
            });
          });
        } else { resolve({ discordId: "unknown", hostname: "cw.x2.international.travian.com" }); }
      });
      
      const payloadString = JSON.stringify(alarmData);
      
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
          type: 'FETCH_GAS_GET',
          hostname: hostname,
          params: { action: "post_inmersive_alarm", discordId: discordId, payload: payloadString }
        }, () => {}); // Empty callback to prevent port closing error
      }
    } catch(e) { console.error("Error posting alarm:", e); }
  },

  fetchAlarms: async () => {
    try {
      const { discordId, hostname } = await new Promise(resolve => {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['discordId', 'serverData'], (res) => {
            resolve({
              discordId: res.discordId || "unknown",
              hostname: res.serverData?.hostname || "cw.x2.international.travian.com"
            });
          });
        } else { resolve({ discordId: "unknown", hostname: "cw.x2.international.travian.com" }); }
      });
      
      // In a real app we might also fetch allianceName from user profile here to pass as targeting criteria
      // We will match against 'discordId' or 'everyone' for now.
      
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'FETCH_GAS_GET',
          hostname: hostname,
          params: { action: "get_inmersive_alarms", discordId: discordId }
        }, (rawText) => {
          if (!rawText) return;
          try {
            const response = JSON.parse(rawText);
            if (response && response.status === "ok" && response.alarmsData) {
              let readAlarms = [];
              try { readAlarms = JSON.parse(localStorage.getItem('readAlarms') || '[]'); } catch(e) {}
              
              let parsedAlarms = [];
              let unreadCount = 0;
              
              // alarmsData is an array of [Timestamp, PayloadJSON]
              response.alarmsData.forEach((row, i) => {
                if (i === 0) return; // skip header
                try {
                  const alarm = JSON.parse(row[1]);
                  alarm.timestamp = row[0];
                  
                  // Target Matching Logic
                  let isTarget = false;
                  if (!alarm.target) isTarget = true;
                  else if (alarm.target.type === 'everyone') isTarget = true;
                  else if (alarm.target.type === 'discord' && alarm.target.value === discordId) isTarget = true;
                  else if (alarm.target.type === 'alliance') isTarget = true; // For now accept all alliance alarms
                  
                  if (isTarget) {
                    alarm.isRead = readAlarms.includes(alarm.id);
                    if (!alarm.isRead) unreadCount++;
                    parsedAlarms.push(alarm);
                  }
                } catch(e) {}
              });
              
              // Sort by newest first
              parsedAlarms.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
              set({ alarmList: parsedAlarms, unreadAlarms: unreadCount });
            }
          } catch(err) {
            console.error("Error parsing alarms response:", err);
          }
        });
      }
    } catch (e) {
      console.error("Error polling alarms:", e);
    }
  },
  
  isLoading: true, // Start in loading state

  hydrateData: async () => {
    set({ isLoading: true });
    
    // Default server for now, or fetch from URL if applicable
    const hostname = "cw.x2.international.travian.com"; 

    try {
      const discordId = await new Promise(resolve => {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['discordId'], (res) => resolve(res.discordId || "unknown"));
        } else {
          resolve("unknown");
        }
      });

      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'FETCH_GAS_GET',
          hostname: hostname,
          params: { action: 'get_inmersive_map_data', discordId: discordId }
        }, (rawText) => {
          if (!rawText) {
             console.error("[NULL Map Engine] No response from GAS server.");
             set({ isLoading: false });
             return;
          }
          try {
             let data = JSON.parse(rawText);
             if (data.status !== 'ok') {
                 console.error("[NULL Map Engine] Server Error:", data.msg || data.message);
                 set({ isLoading: false });
                 return;
             }
             
             if (!data.worldData) {
                 console.error("[NULL Map Engine] Server Error: No world data received.");
                 set({ isLoading: false });
                 return;
             }
             
             const mapDictionary = {}; // O(1) lookup
             
             // 1. Parse DB_World (Baseline)
             const rawWorld = data.worldData;
             if (rawWorld && rawWorld.length > 0) {
                 const headers = rawWorld.shift().map(h => String(h).toLowerCase().trim());
                 rawWorld.forEach(row => {
                     let obj = {};
                     headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
                     let x = obj.x !== undefined ? obj.x : obj.posx;
                     let y = obj.y !== undefined ? obj.y : (obj.z !== undefined ? obj.z : obj.posy);
                     
                     if (x !== undefined && y !== undefined) {
                         obj.x = parseInt(x);
                         obj.y = parseInt(y);
                         
                         // NORMALIZE FOR 3D ENGINE
                         obj.villageId = obj['village id'];
                         obj.playerId = obj['player id'];
                         obj.playerName = obj.player;
                         obj.allianceName = obj.ally;
                         obj.isOasis = false;
                         
                         let key = `${obj.x},${obj.y}`;
                         mapDictionary[key] = obj;
                     }
                 });
             }
             
             // 2. Parse DB_MAP (Real-time Overrides)
             const rawMap = data.mapData; 
             if (rawMap && rawMap.length > 0) {
                 for (let r = 0; r < rawMap.length; r++) {
                     for (let c = 0; c < rawMap[r].length; c++) {
                         if (rawMap[r][c]) {
                             try {
                                 let obj = JSON.parse(rawMap[r][c]);
                                 if (obj.x !== undefined && obj.y !== undefined) {
                                     let key = `${obj.x},${obj.y}`;
                                     
                                     // Categorize Oasis vs Wilderness
                                     let isOasis = false;
                                     let oasisType = null;
                                     
                                     if (obj.type && obj.type.includes('oasis')) {
                                         isOasis = true;
                                     }
                                     if (obj.bonus) {
                                         isOasis = true;
                                         const b = obj.bonus.toLowerCase();
                                         if (b.includes('crop')) oasisType = 'crop';
                                         else if (b.includes('wood')) oasisType = 'wood';
                                         else if (b.includes('iron')) oasisType = 'iron';
                                         else if (b.includes('clay')) oasisType = 'clay';
                                     }
                                     
                                     // Fallback visual if it is an oasis but we couldn't parse the type
                                     if (isOasis && !oasisType) oasisType = 'wood';

                                     if (mapDictionary[key]) {
                                         Object.assign(mapDictionary[key], obj);
                                         
                                         if (isOasis) {
                                             mapDictionary[key].isOasis = true;
                                             mapDictionary[key].oasisType = oasisType;
                                         }
                                         
                                         // Map Roles for RoleSprites
                                         if (obj.status) {
                                             mapDictionary[key].roles = [obj.status.toLowerCase()];
                                         }
                                     } else {
                                         // Normalize DB_MAP fields for the client
                                         obj.isOasis = isOasis;
                                         if (isOasis) obj.oasisType = oasisType;
                                         
                                         if (obj.p) obj.playerName = obj.p;
                                         if (obj.a) obj.allianceName = obj.a;
                                         if (obj.uid) obj.playerId = obj.uid;
                                         if (obj.vid) obj.villageId = obj.vid;
                                         if (obj.pop) obj.population = obj.pop;
                                         
                                         mapDictionary[key] = obj;
                                     }
                                 }
                             } catch(e) {}
                         }
                     }
                 }
             }

             set({ 
               mapData: mapDictionary, 
               isLoading: false, 
               confederacyTags: data.confederacyTags || [] 
             });

          } catch(e) {
             console.error("[NULL Map Engine] Parse error:", e);
             set({ isLoading: false });
          }
        });
      } else {
        console.warn("[NULL Map Engine] Extension environment not detected. Cannot fetch GAS.");
        set({ isLoading: false });
      }

    } catch (err) {
      console.error("[NULL Map Engine] Failed to dispatch hydrate request:", err);
      set({ isLoading: false });
    }
  },
  
  setSelectedTile: (tile) => {
    const current = get().selectedTile;
    if (current && (!tile || current.instanceId !== tile.instanceId)) {
      // Filter out the new tile from outList to prevent infinite loop
      const filteredOuts = get().animatingOutTiles.filter(t => !tile || t.instanceId !== tile.instanceId);
      const outList = [...filteredOuts, current].slice(-15); 
      set({ animatingOutTiles: outList, selectedTile: tile });
    } else {
      set({ selectedTile: tile });
    }
  },
  removeAnimatingOutTile: (instanceId) => {
    set({ animatingOutTiles: get().animatingOutTiles.filter(t => t.instanceId !== instanceId) });
  },
  
  finishAnimationOut: () => set({ animatingOutTile: null }),
  
  openContextMenu: (x, y, tileCoords) => set({ 
    contextMenu: { isOpen: true, x, y, tileCoords } 
  }),
  closeContextMenu: () => set((state) => ({ 
    contextMenu: { ...state.contextMenu, isOpen: false } 
  }))
})));
