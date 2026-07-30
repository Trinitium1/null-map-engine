// ==========================================
// NULL LEGION - PVP ANALYZER MODULE
// ==========================================

let pvpRecordings = [];

function initPvPAnalyzer() {
    // Nav logic
    const appBtnPvp = document.getElementById('app-btn-pvp');
    const appGridContainer = document.getElementById('app-grid-container');
    const pvpModulesContainer = document.getElementById('pvp-modules-container');
    const btnPvpBackHome = document.getElementById('btn-pvp-back-home');
    const btnRefreshPvp = document.getElementById('btn-refresh-pvp');
    const pvpAllianceInput = document.getElementById('pvp-alliance-input');

    if (appBtnPvp) {
        appBtnPvp.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            pvpModulesContainer.classList.remove('hidden');
            loadPvPOverview();
        });
    }

    if (btnPvpBackHome) {
        btnPvpBackHome.addEventListener('click', () => {
            pvpModulesContainer.classList.add('hidden');
            appGridContainer.classList.remove('hidden');
        });
    }

    if (btnRefreshPvp) {
        btnRefreshPvp.addEventListener('click', loadPvPOverview);
    }
    
    if (pvpAllianceInput) {
        pvpAllianceInput.addEventListener('change', loadPvPOverview);
    }

    // Sub-panel routing
    const subPanel = document.getElementById('pvp-sub-panel');
    const mainView = document.getElementById('pvp-main-view');
    const btnSubBack = document.getElementById('btn-pvp-sub-back');
    const subTitle = document.getElementById('pvp-sub-title');
    const subContent = document.getElementById('pvp-sub-content');

    btnSubBack.addEventListener('click', () => {
        subPanel.classList.add('hidden');
        mainView.classList.remove('hidden');
    });

    function openSubPanel(title, htmlContent, onOpenCallback) {
        subTitle.textContent = title;
        subContent.innerHTML = htmlContent;
        mainView.classList.add('hidden');
        subPanel.classList.remove('hidden');
        if (onOpenCallback) onOpenCallback();
    }

    // Buttons
    document.getElementById('btn-pvp-my-villages').addEventListener('click', () => {
        openSubPanel('My Villages', `
            <div style="color:#a4b0be; font-size:12px; margin-bottom:10px;">Scanning your personal empire assets...</div>
            <div id="pvp-my-villages-res">Loading...</div>
        `, () => executeMapRequest("get_pvp_my_villages", {}, "pvp-my-villages-res", "My Villages", generateBasicMapDataset));
    });

    document.getElementById('btn-pvp-tactical-radar').addEventListener('click', () => {
        openSubPanel('Tactical Radar', `
            <div style="font-size: 12px; color:#a4b0be; margin-bottom:10px;">Scan a specific quadrant for hostile or friendly assets.</div>
            <div class="chronos-row">
                <input type="text" id="pvp-radar-x" placeholder="X Coord" style="text-align: center;">
                <input type="text" id="pvp-radar-y" placeholder="Y Coord" style="text-align: center;">
            </div>
            <button id="btn-pvp-run-radar" class="btn primary" style="margin-top:10px;">Scan Sector</button>
            <div id="pvp-radar-res" style="margin-top:15px;"></div>
        `, () => {
            document.getElementById('btn-pvp-run-radar').addEventListener('click', () => {
                let tx = document.getElementById('pvp-radar-x').value;
                let ty = document.getElementById('pvp-radar-y').value;
                if(tx==="" || ty==="") return;
                document.getElementById('pvp-radar-res').innerHTML = 'Scanning...';
                // Tactical radar here acts like topology but maybe different format. Let's use topology map.
                executeMapRequest("get_pvp_topology", {targetX: tx, targetY: ty, radius: 50}, "pvp-radar-res", `Radar (${tx}|${ty})`, generateBasicMapDataset);
            });
        });
    });

    document.getElementById('btn-pvp-alliance-spread').addEventListener('click', () => {
        openSubPanel('Alliance Spread', `
            <div style="font-size: 12px; color:#a4b0be; margin-bottom:10px;">Render the territorial footprint of an alliance.</div>
            <input type="text" id="pvp-map-ally-input" list="alliances-list" placeholder="Alliance Tag" style="width:100%; margin-bottom:10px;">
            <button id="btn-pvp-run-ally" class="btn primary">Render Map</button>
            <div id="pvp-ally-res" style="margin-top:15px;"></div>
        `, () => {
            document.getElementById('btn-pvp-run-ally').addEventListener('click', () => {
                let tag = document.getElementById('pvp-map-ally-input').value;
                if(!tag) return;
                document.getElementById('pvp-ally-res').innerHTML = 'Rendering...';
                executeMapRequest("get_pvp_alliance_spread", {targetTag: tag}, "pvp-ally-res", `Spread: [${tag}]`, generateBasicMapDataset);
            });
        });
    });

    document.getElementById('btn-pvp-find-player').addEventListener('click', () => {
        openSubPanel('Find Player', `
            <div style="font-size: 12px; color:#a4b0be; margin-bottom:10px;">Locate all assets of a specific player.</div>
            <input type="text" id="pvp-map-player-input" placeholder="Player IGN" style="width:100%; margin-bottom:10px;">
            <button id="btn-pvp-run-player" class="btn primary">Locate Target</button>
            <div id="pvp-player-res" style="margin-top:15px;"></div>
        `, () => {
            document.getElementById('btn-pvp-run-player').addEventListener('click', () => {
                let p = document.getElementById('pvp-map-player-input').value;
                if(!p) return;
                document.getElementById('pvp-player-res').innerHTML = 'Locating...';
                executeMapRequest("get_pvp_find_player", {targetPlayer: p}, "pvp-player-res", `Target: ${p}`, generateBasicMapDataset);
            });
        });
    });

    document.getElementById('btn-pvp-topology').addEventListener('click', () => {
        openSubPanel('Topology Scan', `
            <div style="font-size: 12px; color:#a4b0be; margin-bottom:10px;">Generate a high-density asset map of a region.</div>
            <div class="chronos-row">
                <input type="text" id="pvp-topo-x" placeholder="X Coord" style="text-align: center;">
                <input type="text" id="pvp-topo-y" placeholder="Y Coord" style="text-align: center;">
            </div>
            <input type="number" id="pvp-topo-r" placeholder="Radius (max 100)" value="30" style="width:100%; margin-top:10px; margin-bottom:10px;">
            <button id="btn-pvp-run-topo" class="btn primary">Render Topology</button>
            <div id="pvp-topo-res" style="margin-top:15px;"></div>
        `, () => {
            document.getElementById('btn-pvp-run-topo').addEventListener('click', () => {
                let tx = document.getElementById('pvp-topo-x').value;
                let ty = document.getElementById('pvp-topo-y').value;
                let tr = document.getElementById('pvp-topo-r').value;
                if(tx==="" || ty==="") return;
                document.getElementById('pvp-topo-res').innerHTML = 'Rendering...';
                executeMapRequest("get_pvp_topology", {targetX: tx, targetY: ty, radius: tr}, "pvp-topo-res", `Topology (${tx}|${ty})`, generateBasicMapDataset);
            });
        });
    });

    document.getElementById('btn-pvp-view-recordings').addEventListener('click', () => {
        openSubPanel('Recordings', `<div id="pvp-rec-res"></div>`, renderRecordings);
    });

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxMeta = document.getElementById('lightbox-meta');
    
    document.getElementById('btn-lightbox-close').addEventListener('click', () => {
        lightbox.style.opacity = '0';
        setTimeout(() => lightbox.classList.add('hidden'), 300);
    });

    document.getElementById('btn-lightbox-copy').addEventListener('click', async () => {
        try {
            const response = await fetch(lightboxImg.src);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            let btn = document.getElementById('btn-lightbox-copy');
            btn.textContent = '✅ Copied';
            setTimeout(() => btn.textContent = '📋 Copy', 2000);
        } catch(e) {
            console.error("Failed to copy image", e);
        }
    });
    
    document.getElementById('btn-lightbox-save').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = lightboxImg.src;
        a.download = `null_map_${Date.now()}.png`;
        a.click();
    });

    // Load initial recordings from storage
    chrome.storage.local.get(['pvpRecordings'], (res) => {
        if (res.pvpRecordings) pvpRecordings = res.pvpRecordings;
    });
}

function loadPvPOverview() {
    const elStats = document.getElementById('pvp-overview-stats');
    const targetTag = document.getElementById('pvp-alliance-input').value.trim();
    elStats.innerHTML = 'Fetching intelligence...';

    chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
        if (tabs && tabs.length > 0) {
            const url = new URL(tabs[0].url);
            chrome.storage.local.get(['discordId'], (res) => {
                let payload = [{ 
                    action: "get_pvp_overview", 
                    targetTag: targetTag,
                    discordId: res.discordId || "unknown",
                    extVersion: chrome.runtime.getManifest().version
                }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                    if (!rawText) { elStats.innerHTML = 'Network error.'; return; }
                    try {
                    let data = JSON.parse(rawText);
                    if (data.error) { elStats.innerHTML = '<span style="color:#ff4757;">' + data.error + '</span>'; }
                    else {
                        let html = `
                            <div style="margin-bottom:8px;">👥 <b>Active Personnel:</b> ${data.personnel} Legionnaires</div>
                            <div style="margin-bottom:8px;">📍 <b>Global Assets:</b> ${data.assets} Villages</div>
                            <div style="margin-bottom:8px;">🧭 <b>Territorial Control:</b><br>
                               <span style="color:#a4b0be; font-size:11px;">NE(+|+): <b style="color:white;">${data.quads.ne}</b> | NW(-|+): <b style="color:white;">${data.quads.nw}</b><br>
                               SE(+|-): <b style="color:white;">${data.quads.se}</b> | SW(-|-): <b style="color:white;">${data.quads.sw}</b></span>
                            </div>
                            <div style="margin-bottom:8px;">🏆 <b>Top Expansion:</b></div>
                            <div style="margin-left:10px; font-size:11px; color:#a4b0be; margin-bottom:8px;">
                                ${data.top5.map((p,i) => `<b>${i+1}.</b> <a href="https://${url.hostname}/profile/${p.uid}" target="_blank" class="app-link" style="color:#70a1ff;">${p.ign}</a> [${p.villages} Assets]`).join('<br>')}
                            </div>
                            <div style="margin-bottom:8px;">🛡️ <b>Vanguard Outposts:</b></div>
                            <div style="margin-left:10px; font-size:11px; color:#a4b0be;">
                                ⬆️ North: <span style="color:white;">${data.outposts.n.p}</span> (Y: ${data.outposts.n.y})<br>
                                ⬇️ South: <span style="color:white;">${data.outposts.s.p}</span> (Y: ${data.outposts.s.y})<br>
                                ➡️ East: <span style="color:white;">${data.outposts.e.p}</span> (X: ${data.outposts.e.x})<br>
                                ⬅️ West: <span style="color:white;">${data.outposts.w.p}</span> (X: ${data.outposts.w.x})
                            </div>
                        `;
                        elStats.innerHTML = html;
                    }
                } catch (e) { elStats.innerHTML = 'Server error.'; }
                });
            });
        } else { elStats.innerHTML = 'Navigate to game.'; }
    });
}

function executeMapRequest(action, extraPayload, resultElementId, title, datasetBuilderFn) {
    const elResults = document.getElementById(resultElementId);
    
    chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
        if (tabs && tabs.length > 0) {
            const url = new URL(tabs[0].url);
            chrome.storage.local.get(['discordId'], (res) => {
                let payload = Object.assign({ 
                    action: action,
                    discordId: res.discordId || "unknown",
                    extVersion: chrome.runtime.getManifest().version
                }, extraPayload);
                
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: [payload] }, (rawText) => {
                    if (!rawText) { elResults.innerHTML = 'Network error.'; return; }
                    try {
                    let data = JSON.parse(rawText);
                    if (data.error) { elResults.innerHTML = '<span style="color:#ff4757;">' + data.error + '</span>'; }
                    else {
                        if (!data.villages || data.villages.length === 0) {
                            elResults.innerHTML = 'No assets found.';
                            return;
                        }
                        
                        // 1. Build Dataset
                        let datasets = datasetBuilderFn(data, title);
                        
                        // 2. Render Map
                        let renderer = new NullMapRenderer();
                        renderer.render(datasets).then(base64Img => {
                            // 3. Save Recording
                            let metadata = `<b>${title}</b><br>Assets plotted: ${data.villages ? data.villages.length : (data.datasets.worldBubbles ? data.datasets.worldBubbles.length : 0)}<br>Generated: ${new Date().toLocaleString()}`;
                            savePvPRecording(title, base64Img, metadata);
                            
                            // 4. Display thumbnail in UI
                            elResults.innerHTML = `
                                <div style="color:#2ed573; font-size:12px; margin-bottom:10px;">✅ Map rendered successfully.</div>
                                <img src="${base64Img}" class="map-thumbnail lightbox-trigger" style="width:100%; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);" data-img="${base64Img}" data-meta="${metadata}">
                                <div style="text-align:center; font-size:10px; color:#a4b0be; margin-top:5px;">Click image to expand gallery</div>
                            `;
                        });
                    }
                } catch (e) { elResults.innerHTML = 'Server error.'; }
                });
            });
        } else { elResults.innerHTML = 'Navigate to game.'; }
    });
}

// Simple hash based color generator (matches WarMap)
function _getColorForAlliance(tag) {
    if (!tag) return 'rgba(255, 255, 255, 0.5)';
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    let h = hue / 360; let s = 1.0; let l = 0.55;
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s; let p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
        if(t < 0) t += 1; if(t > 1) t -= 1; if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q; if(t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p;
    };
    let r = Math.round(hue2rgb(p, q, h + 1/3) * 255); let g = Math.round(hue2rgb(p, q, h) * 255); let b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
}

function generateBasicMapDataset(data, title) {
    let out = [];
    
    // If no datasets object (fallback)
    if (!data.datasets) {
        let pts = (data.villages || []).map(v => ({ x: v.x, y: v.y, r: Math.max(1, (v.r || 0) / 300) }));
        return [{ label: title, data: pts, backgroundColor: '#eccc68', borderColor: '#ff4757' }];
    }

    const d = data.datasets;

    if (d.worldBubbles && d.worldBubbles.length > 0) {
        out.push({ label: 'World', data: d.worldBubbles, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'none' });
    }
    
    if (d.legionBubbles && d.legionBubbles.length > 0) {
        out.push({ label: 'Legion', data: d.legionBubbles, backgroundColor: 'rgba(0, 255, 255, 0.4)', borderColor: 'rgba(0, 255, 255, 0.9)' });
    }

    if (d.allianceDatasetsMap) {
        Object.keys(d.allianceDatasetsMap).forEach(tag => {
            let pts = d.allianceDatasetsMap[tag];
            if (pts.length > 0) {
                let color = _getColorForAlliance(tag);
                out.push({ label: `[${tag.toUpperCase()}]`, data: pts, backgroundColor: color.replace('0.9)', '0.4)'), borderColor: color });
            }
        });
    }

    if (d.highlightBubbles && d.highlightBubbles.length > 0) {
        out.push({ label: 'Highlight', data: d.highlightBubbles, backgroundColor: 'rgba(255, 51, 51, 0.5)', borderColor: 'rgba(255, 51, 51, 1)' });
    }

    if (d.radarTargetBubble && d.radarTargetBubble.length > 0) {
        out.push({ label: 'Target Lock', data: d.radarTargetBubble, backgroundColor: 'none', borderColor: '#ff3f34', pointStyle: 'crossRot' });
    }

    return out;
}

function savePvPRecording(title, base64Img, metadata) {
    pvpRecordings.unshift({
        title: title,
        img: base64Img,
        meta: metadata,
        time: Date.now()
    });
    if (pvpRecordings.length > 20) pvpRecordings.pop();
    chrome.storage.local.set({ pvpRecordings: pvpRecordings });
}

function renderRecordings() {
    const elResults = document.getElementById('pvp-rec-res');
    if (pvpRecordings.length === 0) {
        elResults.innerHTML = '<div style="color:#a4b0be; font-size:12px;">No recordings found. Generate maps to save history.</div>';
        return;
    }
    
    let html = '';
    pvpRecordings.forEach((rec, idx) => {
        let dateStr = new Date(rec.time).toLocaleString();
        html += `
        <div style="display:flex; align-items:center; gap: 10px; margin-bottom:15px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
            <img src="${rec.img}" class="lightbox-trigger" style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer; object-fit: cover;" data-img="${rec.img}" data-meta="${rec.meta}">
            <div style="flex-grow: 1;">
                <div style="font-weight:bold; color:#f1f2f6;">${rec.title}</div>
                <div style="font-size:10px; color:#a4b0be;">${dateStr}</div>
            </div>
            <button class="btn secondary lightbox-trigger" style="padding: 4px 8px; font-size:11px;" data-img="${rec.img}" data-meta="${rec.meta}">View</button>
        </div>`;
    });
    
    elResults.innerHTML = `<div style="max-height: 400px; overflow-y: auto;">${html}</div>`;
}

// Global exposure for Lightbox
function openLightbox(imgSrc, metadata) {
    const lightbox = document.getElementById('lightbox-overlay');
    document.getElementById('lightbox-img').src = imgSrc;
    document.getElementById('lightbox-meta').innerHTML = metadata;
    
    lightbox.classList.remove('hidden');
    // small delay for css transition
    setTimeout(() => lightbox.style.opacity = '1', 10);
}

// Delegated event listener for Lightbox to avoid CSP violations
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.lightbox-trigger');
    if (trigger) {
        const imgSrc = trigger.getAttribute('data-img');
        const metadata = trigger.getAttribute('data-meta');
        if (imgSrc) {
            openLightbox(imgSrc, metadata || '');
        }
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPvPAnalyzer);
