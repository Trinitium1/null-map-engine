document.addEventListener('DOMContentLoaded', () => {
    const versionDisplay = document.getElementById('version-display');
    const manifest = chrome.runtime.getManifest();
    versionDisplay.textContent = manifest.version;

    const loginBtn = document.getElementById('btn-login-discord');
    const discordIdDisplay = document.getElementById('discord-id-display');
    const saveStatus = document.getElementById('save-status');
    const discordIdentityContainer = document.getElementById('discord-identity-container');
    const discordWidget = document.getElementById('discord-widget');
    const discordAvatar = document.getElementById('discord-avatar');
    const discordUsername = document.getElementById('discord-username');
    const btnLogoutDiscord = document.getElementById('btn-logout-discord');
    const discordCardLabel = document.getElementById('discord-card-label');
    const toggleEngine = document.getElementById('toggle-engine');
    const statusText = document.getElementById('status-text');
    const tilesScanned = document.getElementById('tiles-scanned');
    const discordJoinBtn = document.getElementById('btn-discord-join');
    const killScreen = document.getElementById('kill-screen');
    const downloadBtn = document.getElementById('btn-discord');
    
    const toggleHud = document.getElementById('toggle-hud');
    const hudStatusText = document.getElementById('hud-status-text');

    // Panel Elements (Removed for Sidepanel)
    const body = document.body;
    const sidepanelContainer = document.getElementById('sidepanel-container');
    
    // Settings Menu Toggle
    const btnToggleSettings = document.getElementById('btn-toggle-settings');
    const settingsContainer = document.getElementById('settings-container');
    
    if (btnToggleSettings && settingsContainer) {
        btnToggleSettings.addEventListener('click', () => {
            settingsContainer.classList.toggle('hidden');
        });
    }
    
    const btnRefresh = document.getElementById('btn-refresh');
    const activeServerName = document.getElementById('active-server-name');
    const activeServerIndicator = document.getElementById('active-server-indicator');
    const activeServerBadge = document.getElementById('active-server-badge');
    const activeServerIgn = document.getElementById('active-server-ign');
    const activeServerScans = document.getElementById('active-server-scans');
    const leaderboardsContainer = document.getElementById('leaderboards-container');
    const tableOwnership = document.getElementById('table-ownership');
    const tableScanners = document.getElementById('table-scanners');
    
    // App Navigation & Modules
    const appGridContainer = document.getElementById('app-grid-container');
    const appPanelsWrapper = document.getElementById('app-panels-wrapper');
    const btnBackHome = document.getElementById('btn-back-home');
    const appBtnMap = document.getElementById('app-btn-map');
    const mapModules = document.getElementById('map-modules-container');
    const btnRefreshMap = document.getElementById('btn-refresh-map');
    const mapGlobalStats = document.getElementById('map-global-stats');
    const mapGeoStats = document.getElementById('map-geo-stats');

    // Navigation Logic
    if (appBtnMap) {
        appBtnMap.addEventListener('click', () => {
            // Hide Home Screen
            appGridContainer.classList.add('hidden');
            
            // Show Map Panel
            mapModules.classList.remove('hidden');
            btnBackHome.classList.remove('hidden');
            
            loadMapStats(); // Load data when opening map app
            fetchChronosAlliancesList(); // Fetch alliances for autocomplete
        });
    }

    if (btnBackHome) {
        btnBackHome.addEventListener('click', () => {
            // Hide All Panels
            mapModules.classList.add('hidden');
            btnBackHome.classList.add('hidden');
            
            // Show Home Screen
            appGridContainer.classList.remove('hidden');
            
            // Reset PVE Drilldown if open
            if (pveDrilldown && !pveDrilldown.classList.contains('hidden')) {
                pveDrilldown.classList.add('hidden');
                pveAnimalGrid.classList.remove('hidden');
            }
        });
    }

    // Map Tabs Logic
    const mapTabBtns = document.querySelectorAll('.map-tab-btn');
    const mapTabContents = document.querySelectorAll('.map-tab-content');

    mapTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all tabs
            mapTabBtns.forEach(b => b.classList.remove('active'));
            // Hide all tab contents
            mapTabContents.forEach(c => c.classList.add('hidden'));

            // Activate clicked tab
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // PVE Analyzer
    const pveAnimalGrid = document.getElementById('pve-animal-grid');
    const pveDrilldown = document.getElementById('pve-drilldown');
    const pveDrilldownTitle = document.getElementById('pve-drilldown-title');
    const btnPveBack = document.getElementById('btn-pve-back');
    const pveResults = document.getElementById('pve-results');
    
    // Bind click events to animal cards
    const animalCards = document.querySelectorAll('.animal-card');
    animalCards.forEach(card => {
        card.addEventListener('click', () => {
            const animal = card.getAttribute('data-animal');
            pveAnimalGrid.classList.add('hidden');
            pveDrilldown.classList.remove('hidden');
            pveDrilldownTitle.textContent = `${animal} Analysis`;
            fetchPveCage(animal);
        });
    });
    
    if (btnPveBack) {
        btnPveBack.addEventListener('click', () => {
            pveDrilldown.classList.add('hidden');
            pveAnimalGrid.classList.remove('hidden');
        });
    }

    if (btnRefreshMap) btnRefreshMap.addEventListener('click', () => {
        fetchMapStats();
        fetchWorldEvents();
    });

    const btnChronosAlliance = document.getElementById('btn-chronos-alliance');
    const btnChronosRadar = document.getElementById('btn-chronos-radar');
    const btnChronosEvents = document.getElementById('btn-chronos-events');

    if (btnChronosAlliance) btnChronosAlliance.addEventListener('click', fetchChronosAlliance);
    if (btnChronosRadar) btnChronosRadar.addEventListener('click', fetchChronosRadar);
    if (btnChronosEvents) btnChronosEvents.addEventListener('click', fetchChronosEvents);

    let currentServerData = {};

    // Load saved settings
    chrome.storage.local.get(['discordId', 'discordUser', 'engineActive', 'hudActive', 'sessionTiles', 'killSwitch', 'verifiedServers', 'serverData'], (result) => {
        if (result.killSwitch) {
            killScreen.classList.remove('hidden');
            if (sidepanelContainer) sidepanelContainer.classList.add('hidden');
            return;
        }

        if (result.discordUser) {
            updateDiscordWidget(result.discordUser);
        } else if (result.discordId) {
            // Fallback for old sessions without profile
            discordIdDisplay.textContent = `Connected ID: ${result.discordId}`;
            discordIdDisplay.style.display = "block";
            if (loginBtn) loginBtn.innerHTML = '<img src="assets/DiscordIcon.png" alt="Discord" class="discord-icon"> Reconnect Discord';
        }
        
        if (result.engineActive !== undefined) {
            toggleEngine.checked = result.engineActive;
            updateStatusText(result.engineActive);
        }

        if (result.hudActive !== undefined) {
            toggleHud.checked = result.hudActive;
            updateHudStatusText(result.hudActive);
        }

        if (result.sessionTiles !== undefined) {
            tilesScanned.textContent = result.sessionTiles.toLocaleString();
        }
        
        if (result.serverData) {
            currentServerData = result.serverData;
            updateActiveGameStatus();
        }
    });


    // HUD Toggle
    if (toggleHud) {
        toggleHud.addEventListener('change', (e) => {
            const isActive = e.target.checked;
            chrome.storage.local.set({ hudActive: isActive });
            updateHudStatusText(isActive);

            // Send message to active tab to show/hide immediately if on map
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: isActive ? 'SHOW_HUD' : 'HIDE_HUD' }).catch(() => {});
                }
            });
        });
    }

    function updateHudStatusText(isActive) {
        if (isActive) {
            hudStatusText.textContent = "Live HUD: Enabled";
            hudStatusText.style.color = "#2ed573";
        } else {
            hudStatusText.textContent = "Live HUD: Disabled";
            hudStatusText.style.color = "#ff4757";
        }
    }

    function updateDiscordWidget(user) {
        discordIdentityContainer.classList.add('hidden');
        discordIdDisplay.style.display = 'none';
        discordCardLabel.style.display = 'none';
        discordWidget.classList.remove('hidden');
        
        discordUsername.textContent = user.username;
        if (user.avatar) {
            discordAvatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
        } else {
            discordAvatar.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
        }
    }

    if (btnLogoutDiscord) {
        btnLogoutDiscord.addEventListener('click', () => {
            chrome.storage.local.remove(['discordId', 'discordUser', 'serverData', 'verifiedServers'], () => {
                discordWidget.classList.add('hidden');
                discordCardLabel.style.display = 'block';
                discordIdentityContainer.classList.remove('hidden');
                saveStatus.textContent = "Disconnected.";
                loginBtn.innerHTML = '<img src="assets/DiscordIcon.png" alt="Discord" class="discord-icon"> Connect with Discord';
                
                // Clear all game interface
                currentServerData = {};
                renderServerList();
                tableOwnership.innerHTML = '';
                tableScanners.innerHTML = '';
            });
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            saveStatus.textContent = "Waiting for Discord login...";
            
            // Cliente ID de Discord proporcionado
            const clientId = '1472751920627323081'; 
            const redirectUri = chrome.identity.getRedirectURL();
            const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify`;

            chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            }, (redirectURL) => {
                if (chrome.runtime.lastError || !redirectURL) {
                    console.error(chrome.runtime.lastError);
                    saveStatus.textContent = "Login cancelled or failed.";
                    console.log("Make sure to add this Redirect URI to Discord Developer Portal:", redirectUri);
                    return;
                }

                // Extract access token
                const url = new URL(redirectURL);
                const hash = url.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');

                if (accessToken) {
                    saveStatus.textContent = "Fetching Discord profile...";
                    fetch('https://discord.com/api/v10/users/@me', {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    })
                    .then(res => res.json())
                    .then(user => {
                        if (user.id) {
                            saveStatus.textContent = "Verifying across servers...";
                            
                            const userObj = {
                                id: user.id,
                                username: user.username,
                                avatar: user.avatar
                            };

                            chrome.storage.local.set({ discordId: user.id, discordUser: userObj }, () => {
                                updateDiscordWidget(userObj);
                                triggerVerificationSweep(user.id);
                            });
                        }
                    })
                    .catch(err => {
                        saveStatus.textContent = "Failed to fetch user data.";
                    });
                } else {
                    saveStatus.textContent = "Authentication failed (no token).";
                }
            });
        });
    }
    
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            chrome.storage.local.get(['discordId'], (result) => {
                const id = result.discordId;
                if (id) {
                    if (activeServerName) activeServerName.textContent = "Refreshing...";
                    triggerVerificationSweep(id);
                }
            });
        });
    }

    function triggerVerificationSweep(discordId) {
        chrome.runtime.sendMessage({ type: 'VERIFY_IDENTITY', discordId: discordId }, (response) => {
            if (response && response.status === "KILL") {
                killScreen.classList.remove('hidden');
                if (sidepanelContainer) sidepanelContainer.classList.add('hidden');
                return;
            }
            if (response && response.serverData) {
                currentServerData = response.serverData;
                updateActiveGameStatus();
                
                const verifiedCount = Object.keys(currentServerData).length;
                if (verifiedCount > 0) {
                    saveStatus.textContent = "Verified, welcome!";
                } else {
                    saveStatus.textContent = "Invalid Discord ID.";
                    saveStatus.style.color = "#ff4757";
                    setTimeout(() => { saveStatus.style.color = "#2ed573"; saveStatus.textContent = ""; }, 3000);
                }
            }
        });
    }

    // Tab change listener to update active server indicator
    chrome.tabs.onActivated.addListener(updateActiveGameStatus);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url) updateActiveGameStatus();
    });
    
    function renderLeaderboards(hostname, data) {
        leaderboardsContainer.classList.remove('hidden');
        
        // Ownership
        tableOwnership.innerHTML = "";
        if (data.topOwnership && data.topOwnership.length > 0) {
            data.topOwnership.forEach((p, idx) => {
                const url = p.uid ? `https://${hostname}/profile/${p.uid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(p.ign)}`;
                const row = document.createElement('div');
                row.className = "table-row" + (p.ign === data.ign ? " highlight" : "");
                row.innerHTML = `
                    <span>${idx+1}. <a href="${url}" target="_blank">${p.ign}</a></span>
                    <span class="table-count">${p.count.toLocaleString()}</span>
                `;
                tableOwnership.appendChild(row);
            });
        } else {
            tableOwnership.innerHTML = "<div class='table-row'>No data yet.</div>";
        }
        
        // Scanners
        tableScanners.innerHTML = "";
        if (data.topScanners && data.topScanners.length > 0) {
            data.topScanners.forEach((p, idx) => {
                const url = p.uid ? `https://${hostname}/profile/${p.uid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(p.ign)}`;
                const row = document.createElement('div');
                row.className = "table-row" + (p.ign === data.ign ? " highlight" : "");
                row.innerHTML = `
                    <span>${idx+1}. <a href="${url}" target="_blank">${p.ign}</a></span>
                    <span class="table-count">${p.count.toLocaleString()}</span>
                `;
                tableScanners.appendChild(row);
            });
        } else {
            tableScanners.innerHTML = "<div class='table-row'>No data yet.</div>";
        }
    }

    toggleEngine.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        chrome.storage.local.set({ engineActive: isActive });
        updateStatusText(isActive);
        chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' }).catch(() => {});
    });

    if (discordJoinBtn) {
        discordJoinBtn.addEventListener('click', () => {
            window.open('https://discord.gg/pdpVR69Vf6', '_blank');
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            window.open('https://discord.gg/pdpVR69Vf6', '_blank');
        });
    }

    function updateStatusText(isActive) {
        if (isActive) {
            statusText.textContent = "Engine: Active";
            statusText.style.color = "#2ed573";
        } else {
            statusText.textContent = "Engine: Paused";
            statusText.style.color = "#ff4757";
        }
    }

    function updateActiveGameStatus() {
        if (!activeServerName) return;
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    if (url.hostname.includes('travian.com')) {
                        const shortName = url.hostname.split('.international.travian.com')[0].toUpperCase();
                        activeServerName.textContent = shortName;
                        
                        if (currentServerData && currentServerData[url.hostname]) {
                            const data = currentServerData[url.hostname];
                            activeServerBadge.style.background = "#2ed573";
                            activeServerBadge.style.boxShadow = "0 0 8px #2ed573";
                            if (activeServerIndicator) activeServerIndicator.style.borderLeftColor = "#2ed573";
                            activeServerIgn.textContent = data.ign;
                            activeServerScans.innerHTML = `<strong style="color:#eccc68">${data.scannedTiles.toLocaleString()}</strong> Scans`;
                            
                            // Send message to background to turn icon green
                            chrome.runtime.sendMessage({ type: 'UPDATE_ICON_COLOR', color: 'green' }).catch(() => {});
                            
                            // Render leaderboards for this connected server
                            leaderboardsContainer.classList.remove('hidden');
                            renderLeaderboards(url.hostname, data);
                        } else {
                            activeServerBadge.style.background = "#ff4757";
                            activeServerBadge.style.boxShadow = "0 0 8px #ff4757";
                            if (activeServerIndicator) activeServerIndicator.style.borderLeftColor = "#ff4757";
                            activeServerIgn.textContent = "Unregistered / No Access";
                            activeServerScans.textContent = "";
                            leaderboardsContainer.classList.add('hidden');
                            
                            // Send message to background to turn icon red
                            chrome.runtime.sendMessage({ type: 'UPDATE_ICON_COLOR', color: 'red' }).catch(() => {});
                        }
                    } else {
                        setNoActiveGame();
                    }
                } catch (e) {
                    setNoActiveGame();
                }
            } else {
                setNoActiveGame();
            }
        });
    }
    
    function setNoActiveGame() {
        if (!activeServerName) return;
        activeServerName.textContent = "No Active Game";
        activeServerBadge.style.background = "#a4b0be";
        activeServerBadge.style.boxShadow = "0 0 5px #a4b0be";
        if (activeServerIndicator) activeServerIndicator.style.borderLeftColor = "#a4b0be";
        activeServerIgn.textContent = "Navigate to a supported Travian server";
        activeServerScans.textContent = "";
        leaderboardsContainer.classList.add('hidden');
        chrome.runtime.sendMessage({ type: 'UPDATE_ICON_COLOR', color: 'default' }).catch(() => {});
    }

    function loadMapStats() {
        chrome.storage.local.get(['mapStatsCache'], (result) => {
            if (result.mapStatsCache) {
                renderMapStats(result.mapStatsCache);
            } else {
                fetchMapStats();
            }
        });
    }

    function fetchMapStats() {
        if (!mapGlobalStats || !mapGeoStats) return;
        mapGlobalStats.innerHTML = 'Fetching intelligence...';
        mapGeoStats.innerHTML = 'Waiting for data...';
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ 
                            action: "get_map_stats", 
                            discordId: res.discordId || "unknown",
                            extVersion: chrome.runtime.getManifest().version 
                        }];
                        
                        chrome.runtime.sendMessage({
                            type: 'FETCH_GAS',
                            hostname: url.hostname,
                            payload: payload
                        }, (rawText) => {
                            if (!rawText) {
                                mapGlobalStats.innerHTML = 'Network error.';
                                return;
                            }
                            try {
                                let data = JSON.parse(rawText);
                                if (data.status === "ok") {
                                    chrome.storage.local.set({ mapStatsCache: data.stats });
                                    renderMapStats(data.stats);
                                } else {
                                    mapGlobalStats.innerHTML = 'Error: ' + data.status;
                                }
                            } catch (e) {
                                mapGlobalStats.innerHTML = 'Server error.';
                            }
                        });
                    });
                } else { mapGlobalStats.innerHTML = 'No active server.'; }
            } else { mapGlobalStats.innerHTML = 'Navigate to game.'; }
        });
    }

    function renderMapStats(data) {
        if (!mapGlobalStats || !mapGeoStats || !data) return;
        
        let gHtml = `<div style="margin-bottom:15px; font-size:13px; color:#f1f2f6;">Total Map Size: <b>${data.totalTiles.toLocaleString()}</b> tiles</div>`;
        
        const buildStatRow = (label, pctStr, count) => {
            const pct = parseFloat(pctStr) || 0;
            return `
            <div class="stat-row">
                <div class="stat-bar-fill" style="width: ${pct}%"></div>
                <div class="stat-content">
                    <span class="stat-name">${label}</span>
                    <span>${count.toLocaleString()} (${pctStr}%)</span>
                </div>
            </div>`;
        };

        gHtml += buildStatRow('🔄 Last 30m', data.m30.pct, data.m30.count);
        gHtml += buildStatRow('🕒 Last 2h', data.h2.pct, data.h2.count);
        gHtml += buildStatRow('🕘 Last 6h', data.h6.pct, data.h6.count);
        gHtml += buildStatRow('📅 Last 24h', data.d1.pct, data.d1.count);
        mapGlobalStats.innerHTML = gHtml;
        
        let qHtml = "";
        ['NE', 'NW', 'SE', 'SW'].forEach(q => {
            let info = data.quads[q];
            let title = q === 'NE' ? 'North East (+|+)' : q === 'NW' ? 'North West (-|+)' : q === 'SE' ? 'South East (+|-)' : 'South West (-|-)';
            const pct = parseFloat(info.pct) || 0;
            
            qHtml += `
            <div style="margin-bottom:12px;">
                <div class="stat-row" style="margin-bottom:4px;">
                    <div class="stat-bar-fill" style="width: ${pct}%"></div>
                    <div class="stat-content">
                        <span class="stat-name" style="color:#f1f2f6; font-weight:bold;">${title}</span>
                        <span>${info.pct}% (${info.count.toLocaleString()})</span>
                    </div>
                </div>
                <div style="font-size:10px; padding:0 4px; line-height:1.4;">
                    ${info.fauna} <br>
                    <span style="color:#a4b0be;">💀 Natars: ${info.natars.toLocaleString()}</span>
                </div>
            </div>`;
        });
        mapGeoStats.innerHTML = qHtml;
    }

    function fetchPveCage(animalName) {
        if (!pveResults) return;
        pveResults.innerHTML = `Scanning map for ${animalName}s...`;
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ 
                            action: "get_cage_data", 
                            discordId: res.discordId || "unknown",
                            extVersion: chrome.runtime.getManifest().version,
                            targetAnimal: animalName
                        }];
                        
                        chrome.runtime.sendMessage({
                            type: 'FETCH_GAS',
                            hostname: url.hostname,
                            payload: payload
                        }, (rawText) => {
                            if (!rawText) {
                                pveResults.innerHTML = 'Network error.';
                                return;
                            }
                            try {
                                let data = JSON.parse(rawText);
                                if (data.status === "ok") {
                                    renderPveCage(data.results, url.hostname, animalName);
                                } else { pveResults.innerHTML = 'Error: ' + data.status; }
                            } catch (e) {
                                pveResults.innerHTML = 'Server error.';
                            }
                        });
                    });
                } else { pveResults.innerHTML = 'No active server.'; }
            } else { pveResults.innerHTML = 'Navigate to game.'; }
        });
    }

    function renderPveCage(results, host, animalName) {
        if (!pveResults || !results) return;
        
        // Filter results by the selected animal
        let filtered = results.filter(r => r.animal === animalName);
        
        if (filtered.length === 0) {
            pveResults.innerHTML = `<div style="text-align:center; padding: 20px; color: #ff4757;">No ${animalName}s found on the map yet.</div>`;
            return;
        }
        
        let html = '';
        filtered.forEach((r, idx) => {
            let emoji = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : "📍"));
            let emojiMap = { "Elephant": "🐘", "Tiger": "🐅", "Bear": "🐻", "Crocodile": "🐊" };
            let animalEmoji = emojiMap[animalName] || "";
            let displayTargetCount = (r.targetCount !== undefined && r.targetCount !== null) ? r.targetCount : "?";
            let displayCages = (r.cagesNeeded !== undefined && r.cagesNeeded !== null) ? r.cagesNeeded : "?";
            
            html += `<div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background: rgba(47, 54, 64, 0.4); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="line-height:1.4;">
                    <b style="color:#f1f2f6;">${emoji} Oasis (${r.x}|${r.y})</b><br>
                    <span style="font-size:11px; color:#2ed573;">🎯 ${displayTargetCount} ${animalEmoji} | 📦 ${displayCages} Cages</span>
                </div>
                <div>
                    <a href="https://${host}/karte.php?x=${r.x}&y=${r.y}" target="_blank" class="btn" style="padding:6px 12px; font-size:11px; text-decoration:none; background: #5865F2; color: #fff; border-radius: 4px;">View Map</a>
                </div>
            </div>`;
        });
        pveResults.innerHTML = html;
    }

    // Listen for live updates from background.js
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateTiles") {
            tilesScanned.textContent = message.count.toLocaleString();
        }
        if (message.action === "killSwitchTriggered") {
            killScreen.classList.remove('hidden');
            mainUi.classList.add('hidden');
        }
        if (message.action === "refreshLeaderboards" && message.serverData) {
            currentServerData = message.serverData;
            updateActiveGameStatus(); 
        }
    });
    // ==========================================
    // CHRONOS TERMINAL FETCH & RENDER LOGIC
    // ==========================================

    function fetchWorldEvents() {
        const elGrowth = document.getElementById('world-events-growth');
        const elConquests = document.getElementById('world-events-conquests');
        const elDestroyed = document.getElementById('world-events-destroyed');
        if (!elGrowth) return;

        elGrowth.innerHTML = "Fetching global intelligence...";
        elConquests.innerHTML = "Fetching global intelligence...";
        elDestroyed.innerHTML = "Fetching global intelligence...";

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ action: "get_world_events", discordId: res.discordId || "unknown", extVersion: chrome.runtime.getManifest().version }];
                        chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                            if (!rawText) { elGrowth.innerHTML = 'Network error.'; return; }
                            try {
                                let data = JSON.parse(rawText);
                                if (data.error) {
                                    elGrowth.innerHTML = 'Error: ' + data.error;
                                } else {
                                    renderWorldEvents(data);
                                }
                            } catch (e) { elGrowth.innerHTML = 'Server error.'; }
                        });
                    });
                } else { elGrowth.innerHTML = 'No active server.'; }
            } else { elGrowth.innerHTML = 'Navigate to game.'; }
        });
    }

    function renderWorldEvents(data) {
        const elGrowth = document.getElementById('world-events-growth');
        const elConquests = document.getElementById('world-events-conquests');
        const elDestroyed = document.getElementById('world-events-destroyed');
        
        let host = "";
        if (currentServerData) {
            let sUrl = Object.keys(currentServerData)[0];
            if (sUrl) host = `https://${sUrl}`;
        }

        // 1. Growth
        if (data.growth && data.growth.length > 0) {
            let maxDiff = data.growth[0].diff;
            let gHtml = "";
            data.growth.forEach((p, idx) => {
                let pct = (p.diff / maxDiff) * 100;
                let allyLink = p.ally ? (p.aid ? `<a href="${host}/alliance/${p.aid}" target="_blank" class="app-link" style="color:inherit;">[${p.ally}]</a> ` : `[${p.ally}] `) : "";
                let ignLink = `<a href="${host}/profile/${p.uid}" target="_blank" class="app-link" style="color:inherit;">${p.ign}</a>`;
                
                gHtml += `
                <div style="margin-bottom:12px;">
                    <div class="stat-row" style="margin-bottom:4px; height:20px;">
                        <div class="stat-bar-fill" style="width: ${pct}%; background: rgba(46, 204, 113, 0.2); border-color: #2ecc71;"></div>
                        <div class="stat-content">
                            <span class="stat-name" style="color:#f1f2f6; font-weight:bold;">${idx+1}. ${allyLink}${ignLink}</span>
                            <span>+${p.diff.toLocaleString()}</span>
                        </div>
                    </div>
                </div>`;
            });
            elGrowth.innerHTML = gHtml;
        } else { elGrowth.innerHTML = "No growth data found."; }

        // 2. Conquests
        if (data.conquests && data.conquests.length > 0) {
            let cHtml = "";
            data.conquests.forEach(c => {
                let mapUrl = `${host}/position_details.php?x=${c.x}&y=${c.y}`;
                let prevAllyLink = c.prevAlly ? (c.prevAid ? `<a href="${host}/alliance/${c.prevAid}" target="_blank" class="app-link" style="color:inherit;">[${c.prevAlly}]</a> ` : `[${c.prevAlly}] `) : "";
                let prevPlayerLink = c.prevUid ? `<a href="${host}/profile/${c.prevUid}" target="_blank" class="app-link" style="color:inherit;">${c.prevPlayer}</a>` : c.prevPlayer;
                let currAllyLink = c.currAlly ? (c.currAid ? `<a href="${host}/alliance/${c.currAid}" target="_blank" class="app-link" style="color:inherit;">[${c.currAlly}]</a> ` : `[${c.currAlly}] `) : "";
                let currPlayerLink = c.currUid ? `<a href="${host}/profile/${c.currUid}" target="_blank" class="app-link" style="color:inherit;">${c.currPlayer}</a>` : c.currPlayer;

                cHtml += `
                <div style="margin-bottom:8px; background: rgba(230, 126, 34, 0.1); border-left: 3px solid #e67e22; padding: 6px; border-radius: 4px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                        <span style="font-weight:bold; color:#f1f2f6;">🏰 <a href="${mapUrl}" target="_blank" class="app-link" style="color:#f1f2f6;">${c.vName}</a> <span style="font-size:10px; font-weight:normal; color:#a4b0be;">(${c.x}|${c.y})</span></span>
                        <span style="color:#eccc68;">${c.pop} pop</span>
                    </div>
                    <div style="font-size:11px; color:#a4b0be; display:flex; align-items:center;">
                        <span style="color:#ff6b81; text-decoration:line-through;">${prevAllyLink}${prevPlayerLink}</span> 
                        <span style="margin:0 6px; color:#3498db;">➡️</span>
                        <span style="color:#2ed573;">${currAllyLink}${currPlayerLink}</span>
                    </div>
                </div>`;
            });
            elConquests.innerHTML = cHtml;
        } else { elConquests.innerHTML = "No conquests in the last 24h."; }

        // 3. Destroyed
        if (data.destructions && data.destructions.length > 0) {
            let dHtml = "";
            data.destructions.forEach(d => {
                let mapUrl = `${host}/position_details.php?x=${d.x}&y=${d.y}`;
                let allyLink = d.ally ? (d.aid ? `<a href="${host}/alliance/${d.aid}" target="_blank" class="app-link" style="color:inherit;">[${d.ally}]</a> ` : `[${d.ally}] `) : "";
                let playerLink = d.uid ? `<a href="${host}/profile/${d.uid}" target="_blank" class="app-link" style="color:inherit;">${d.player}</a>` : d.player;

                dHtml += `
                <div style="margin-bottom:8px; background: rgba(231, 76, 60, 0.1); border-left: 3px solid #e74c3c; padding: 6px; border-radius: 4px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                        <span style="font-weight:bold; color:#f1f2f6;">🔥 <a href="${mapUrl}" target="_blank" class="app-link" style="color:#f1f2f6;">${d.vName}</a> <span style="font-size:10px; font-weight:normal; color:#a4b0be;">(${d.x}|${d.y})</span></span>
                        <span style="color:#eccc68;">${d.pop} pop</span>
                    </div>
                    <div style="font-size:11px; color:#a4b0be;">
                        Was: <span style="color:#ff6b81;">${allyLink}${playerLink}</span>
                    </div>
                </div>`;
            });
            elDestroyed.innerHTML = dHtml;
        } else { elDestroyed.innerHTML = "No destroyed villages in the last 24h."; }
    }


    // CHRONOS AUTOCOMPLETE
    function fetchChronosAlliancesList() {
        const datalist = document.getElementById('alliances-list');
        if (!datalist) return;
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ action: "get_alliances_list", discordId: res.discordId || "unknown", extVersion: chrome.runtime.getManifest().version }];
                        chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                            if (!rawText) return;
                            try {
                                let data = JSON.parse(rawText);
                                if (data.alliances) {
                                    let html = "";
                                    data.alliances.forEach(a => html += `<option value="${a}">`);
                                    datalist.innerHTML = html;
                                }
                            } catch (e) {}
                        });
                    });
                }
            }
        });
    }

    // Call fetchAlliancesList when map opens
    if (appBtnMap) {
        appBtnMap.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            mapModules.classList.remove('hidden');
            btnBackHome.classList.remove('hidden');
            loadMapStats();
            fetchChronosAlliancesList(); // New!
        });
    }

    function fetchChronosAlliance() {
        const elResults = document.getElementById('chronos-alliance-results');
        const tag = document.getElementById('chronos-alliance-tag').value;
        if (!tag) { elResults.innerHTML = '<span style="color:#ff4757;">Please enter an alliance tag.</span>'; return; }

        elResults.innerHTML = `Scanning historical matrix for [${tag}]...`;

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ action: "get_chronos_alliance", targetTag: tag, discordId: res.discordId || "unknown", extVersion: chrome.runtime.getManifest().version }];
                        chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                            if (!rawText) { elResults.innerHTML = 'Network error.'; return; }
                            try {
                                let data = JSON.parse(rawText);
                                if (data.error) { elResults.innerHTML = '<span style="color:#ff4757;">' + data.error + '</span>'; }
                                else { renderChronosAlliance(data, url.hostname); }
                            } catch (e) { elResults.innerHTML = 'Server error.'; }
                        });
                    });
                } else { elResults.innerHTML = 'No active server.'; }
            } else { elResults.innerHTML = 'Navigate to game.'; }
        });
    }

    function renderChronosAlliance(data, hostname) {
        const elResults = document.getElementById('chronos-alliance-results');
        let html = `<div style="font-size:12px; margin-bottom:10px; color:#2ed573;">Found <b>${data.players.length}</b> players for [${data.tag.toUpperCase()}]</div>`;
        
        let colsHtml = "";
        data.headers.forEach(h => colsHtml += `<th>${h}</th>`);

        html += `<div class="matrix-grid-container">
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        ${colsHtml}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>`;

        data.players.forEach(p => {
            let rowHtml = "";
            p.history.forEach(d => {
                let statusClass = "status-inactive";
                if (d < 0) statusClass = "status-bleeding";
                else if (d > 0 && d <= 99) statusClass = "status-stagnant";
                else if (d >= 100) statusClass = "status-active";
                rowHtml += `<td class="${statusClass}">${d > 0 ? '+'+d : d}</td>`;
            });

            let totalClass = "status-inactive";
            if (p.diff < 0) totalClass = "status-bleeding";
            else if (p.diff > 0 && p.diff <= 99) totalClass = "status-stagnant";
            else if (p.diff >= 100) totalClass = "status-active";

            let pUrl = `https://${hostname}/profile/${p.uid}`;

            html += `<tr>
                <td><a href="${pUrl}" target="_blank" class="app-link" style="font-weight:bold; color:#f1f2f6;">${p.ign}</a></td>
                ${rowHtml}
                <td class="${totalClass}" style="font-weight:bold; background:rgba(0,0,0,0.2);">${p.diff > 0 ? '+'+p.diff : p.diff}</td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
        elResults.innerHTML = html;
    }

    function fetchChronosRadar() {
        const elResults = document.getElementById('chronos-radar-results');
        const x = document.getElementById('chronos-radar-x').value;
        const y = document.getElementById('chronos-radar-y').value;
        const radius = document.getElementById('chronos-radar-radius').value || 30;
        
        if (x === "" || y === "") { elResults.innerHTML = '<span style="color:#ff4757;">Enter X and Y.</span>'; return; }

        elResults.innerHTML = `Sweeping sector around (${x}|${y}) within ${radius} tiles...`;

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ action: "get_chronos_radar", targetX: x, targetY: y, radius: radius, discordId: res.discordId || "unknown", extVersion: chrome.runtime.getManifest().version }];
                        chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                            if (!rawText) { elResults.innerHTML = 'Network error.'; return; }
                            try {
                                let data = JSON.parse(rawText);
                                if (data.error) { elResults.innerHTML = '<span style="color:#ff4757;">' + data.error + '</span>'; }
                                else { renderChronosRadar(data, url.hostname); }
                            } catch (e) { elResults.innerHTML = 'Server error.'; }
                        });
                    });
                } else { elResults.innerHTML = 'No active server.'; }
            } else { elResults.innerHTML = 'Navigate to game.'; }
        });
    }

    function renderChronosRadar(data, hostname) {
        const elResults = document.getElementById('chronos-radar-results');
        if (!data.targets || data.targets.length === 0) { elResults.innerHTML = "No targets found in the specified radius."; return; }

        let html = `<div style="font-size:12px; margin-bottom:10px; color:#e58e26;">Found <b>${data.targets.length}</b> targets</div>`;
        
        data.targets.forEach(t => {
            let colorClass = '#ff4757';
            let emoji = '🔴';
            
            if (t.conquered) { colorClass = '#70a1ff'; emoji = '🏰'; }
            else if (t.diff < 0) { colorClass = '#a4b0be'; emoji = '🔥'; }
            else if (t.diff >= 100) { colorClass = '#2ed573'; emoji = '🟢'; }
            else if (t.diff > 0) { colorClass = '#eccc68'; emoji = '🟡'; }

            let vUrl = `https://${hostname}/position_details.php?x=${t.x}&y=${t.y}`;
            let pUrl = `https://${hostname}/profile/${t.uid}`;
            let aUrl = t.aid ? `https://${hostname}/alliance/${t.aid}` : '#';

            let allyLink = t.ally ? `<a href="${aUrl}" target="_blank" class="app-link">[${t.ally}]</a> ` : '';
            
            let cropsHtml = t.crops ? `<span style="margin-left: 5px; font-size: 10px; color: #f1c40f;">🌾 ${t.crops}</span>` : '';
            let statusHtml = t.status ? `<span style="margin-left: 5px; font-size: 10px; font-weight: bold; color: #ff4757;">[${t.status}]</span>` : '';

            html += `
            <div style="margin-bottom:8px; background: rgba(255,255,255,0.05); border-left: 3px solid ${colorClass}; padding: 6px; border-radius: 4px;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                    <span style="font-weight:bold; color:#f1f2f6;">
                        ${emoji} <a href="${vUrl}" target="_blank" class="app-link" style="color:#f1f2f6;">${t.vName}</a> 
                        <span style="font-size:10px; font-weight:normal; color:#a4b0be;">(${t.x}|${t.y})</span>
                        ${cropsHtml}
                    </span>
                    <span style="color:#eccc68; font-size: 11px;">${t.dist.toFixed(1)} tiles</span>
                </div>
                <div style="font-size:10px; color:#a4b0be; display:flex; justify-content:space-between; margin-left: 18px;">
                    <span>${allyLink}<a href="${pUrl}" target="_blank" class="app-link">${t.ign}</a> ${statusHtml}</span>
                    <span style="color:${colorClass}; font-weight:bold;">Pop: ${t.pop} (${t.diff > 0 ? '+'+t.diff : t.diff})</span>
                </div>
            </div>`;
        });
        
        elResults.innerHTML = `<div style="max-height: 400px; overflow-y: auto;">${html}</div>`;
    }

    function fetchChronosEvents() {
        const elResults = document.getElementById('chronos-events-results');
        const x = document.getElementById('chronos-events-x').value;
        const y = document.getElementById('chronos-events-y').value;
        const radius = document.getElementById('chronos-events-radius').value || 30;
        
        if (x === "" || y === "") { elResults.innerHTML = '<span style="color:#ff4757;">Enter X and Y.</span>'; return; }

        elResults.innerHTML = `Analyzing history for sector (${x}|${y}) within ${radius} tiles...`;

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('travian.com')) {
                const url = new URL(tabs[0].url);
                if (currentServerData && currentServerData[url.hostname]) {
                    chrome.storage.local.get(['discordId'], (res) => {
                        let payload = [{ action: "get_chronos_events", targetX: x, targetY: y, radius: radius, discordId: res.discordId || "unknown", extVersion: chrome.runtime.getManifest().version }];
                        chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                            if (!rawText) { elResults.innerHTML = 'Network error.'; return; }
                            try {
                                let data = JSON.parse(rawText);
                                if (data.error) { elResults.innerHTML = '<span style="color:#ff4757;">' + data.error + '</span>'; }
                                else { renderChronosEvents(data, url.hostname); }
                            } catch (e) { elResults.innerHTML = 'Server error.'; }
                        });
                    });
                } else { elResults.innerHTML = 'No active server.'; }
            } else { elResults.innerHTML = 'Navigate to game.'; }
        });
    }

    function renderChronosEvents(data, hostname) {
        const elResults = document.getElementById('chronos-events-results');
        if (!data.events || data.events.length === 0) { elResults.innerHTML = "No tactical events found in the specified radius."; return; }

        let html = `<div style="font-size:12px; margin-bottom:10px; color:#5352ed;">Detected <b>${data.events.length}</b> events</div>`;
        
        data.events.forEach(e => {
            let isDestruction = e.type === 'destroyed';
            let colorClass = isDestruction ? '#e74c3c' : '#70a1ff';
            let dayText = e.dayOffset === 0 ? "Today" : (e.dayOffset === 1 ? "Yesterday" : `${e.dayOffset} days ago`);
            let emoji = isDestruction ? '🔥' : '🏰';
            
            let vUrl = `https://${hostname}/position_details.php?x=${e.x}&y=${e.y}`;
            let p1Url = `https://${hostname}/profile/${e.prevUid || e.uid}`;
            let a1Url = (e.prevAid || e.aid) ? `https://${hostname}/alliance/${e.prevAid || e.aid}` : '#';
            let ally1Link = (e.prevAlly || e.ally) ? `<a href="${a1Url}" target="_blank" class="app-link">[${e.prevAlly || e.ally}]</a> ` : '';

            let p2Url = e.currUid ? `https://${hostname}/profile/${e.currUid}` : '#';
            let a2Url = e.currAid ? `https://${hostname}/alliance/${e.currAid}` : '#';
            let ally2Link = e.currAlly ? `<a href="${a2Url}" target="_blank" class="app-link">[${e.currAlly}]</a> ` : '';

            let cropsHtml = e.crops ? `<span style="margin-left: 5px; font-size: 10px; color: #f1c40f;">🌾 ${e.crops}</span>` : '';
            let statusHtml1 = e.prevStatus ? `<span style="margin-left: 5px; font-size: 10px; font-weight: bold; color: #ff4757;">[${e.prevStatus}]</span>` : '';
            let statusHtml2 = e.currStatus ? `<span style="margin-left: 5px; font-size: 10px; font-weight: bold; color: #ff4757;">[${e.currStatus}]</span>` : '';

            html += `
            <div style="margin-bottom:8px; background: rgba(0,0,0,0.2); border-left: 3px solid ${colorClass}; padding: 6px; border-radius: 4px;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                    <span style="font-weight:bold; color:#f1f2f6;">
                        ${emoji} <a href="${vUrl}" target="_blank" class="app-link" style="color:#f1f2f6;">${e.vName}</a> 
                        <span style="font-size:10px; font-weight:normal; color:#a4b0be;">(${e.x}|${e.y})</span>
                        ${cropsHtml}
                    </span>
                    <span style="color:#a4b0be; font-size: 11px;">${dayText}</span>
                </div>`;
                
            if (isDestruction) {
                html += `<div style="font-size:11px; color:#a4b0be;">
                    <span style="color:#ff6b81; text-decoration:line-through;">${ally1Link}<a href="${p1Url}" target="_blank" class="app-link" style="color:#ff6b81;">${e.prevIgn || e.ign}</a> ${statusHtml1}</span>
                    <span style="color:#eccc68; margin-left: 5px;">🔥 Destroyed</span>
                </div>`;
            } else {
                html += `<div style="font-size:11px; color:#a4b0be; display:flex; align-items:center;">
                    <span style="color:#ff6b81; text-decoration:line-through;">${ally1Link}<a href="${p1Url}" target="_blank" class="app-link" style="color:#ff6b81;">${e.prevIgn}</a> ${statusHtml1}</span> 
                    <span style="margin:0 6px; color:#3498db;">➡️</span>
                    <span style="color:#2ed573;">${ally2Link}<a href="${p2Url}" target="_blank" class="app-link" style="color:#2ed573;">${e.currIgn}</a> ${statusHtml2}</span>
                </div>`;
            }
            html += `</div>`;
        });
        
        elResults.innerHTML = `<div style="max-height: 400px; overflow-y: auto;">${html}</div>`;
    }

    // Range Slider Event Listeners
    const radarRadiusSlider = document.getElementById('chronos-radar-radius');
    const radarRadiusVal = document.getElementById('radar-radius-val');
    if (radarRadiusSlider && radarRadiusVal) {
        radarRadiusSlider.addEventListener('input', (e) => {
            radarRadiusVal.textContent = e.target.value;
        });
    }

    const eventsRadiusSlider = document.getElementById('chronos-events-radius');
    const eventsRadiusVal = document.getElementById('events-radius-val');
    if (eventsRadiusSlider && eventsRadiusVal) {
        eventsRadiusSlider.addEventListener('input', (e) => {
            eventsRadiusVal.textContent = e.target.value;
        });
    }

});
