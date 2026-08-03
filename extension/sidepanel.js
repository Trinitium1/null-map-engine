function safeParseJSON(text) {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
        return JSON.parse(trimmed);
    } catch(e) {
        return null;
    }
}

// --- DEBUG CONSOLE HOOK & CARD ENGINE ---
(function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const logHistory = [];

    let lastLoggedMsg = "";
    let lastLoggedTime = 0;

    function isDuplicateLog(msg) {
        const now = Date.now();
        if (msg === lastLoggedMsg && (now - lastLoggedTime) < 5000) {
            return true;
        }
        lastLoggedMsg = msg;
        lastLoggedTime = now;
        return false;
    }

    function createLogCardElement(entry) {
        const card = document.createElement('div');
        const color = entry.type === 'error' ? '#ff4757' : (entry.type === 'warn' ? '#ffa502' : '#2ed573');
        const bgColor = entry.type === 'error' ? 'rgba(255, 71, 87, 0.1)' : (entry.type === 'warn' ? 'rgba(255, 165, 2, 0.08)' : 'rgba(46, 213, 115, 0.08)');
        const borderColor = entry.type === 'error' ? 'rgba(255, 71, 87, 0.3)' : (entry.type === 'warn' ? 'rgba(255, 165, 2, 0.2)' : 'rgba(46, 213, 115, 0.2)');

        card.style.background = bgColor;
        card.style.border = `1px solid ${borderColor}`;
        card.style.borderRadius = '6px';
        card.style.padding = '8px 10px';
        card.style.marginBottom = '6px';
        card.style.fontFamily = 'monospace';
        card.style.fontSize = '11px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-start';
        header.style.gap = '8px';

        const textSpan = document.createElement('span');
        textSpan.style.color = color;
        textSpan.style.wordBreak = 'break-word';
        textSpan.style.flex = '1';
        textSpan.textContent = `[${entry.time}] ${entry.msg}`;

        header.appendChild(textSpan);
        card.appendChild(header);

        // Technical details for errors or warnings or denials
        const isErrorOrDenial = entry.type === 'error' || entry.type === 'warn' || entry.msg.includes('DENIAL') || entry.msg.includes('failed');
        if (isErrorOrDenial) {
            const toggleBtn = document.createElement('div');
            toggleBtn.style.fontSize = '10px';
            toggleBtn.style.color = '#70a1ff';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.marginTop = '4px';
            toggleBtn.style.textDecoration = 'underline';
            toggleBtn.textContent = '🔍 Click to expand full technical error details';

            const detailsBox = document.createElement('div');
            detailsBox.style.display = 'none';
            detailsBox.style.marginTop = '6px';
            detailsBox.style.padding = '6px 8px';
            detailsBox.style.background = '#0d0f14';
            detailsBox.style.border = `1px dashed ${borderColor}`;
            detailsBox.style.borderRadius = '4px';
            detailsBox.style.color = '#a4b0be';
            detailsBox.style.fontSize = '10px';
            detailsBox.style.whiteSpace = 'pre-wrap';
            detailsBox.style.wordBreak = 'break-all';

            let techDetails = `=== TECHNICAL DIAGNOSTICS ===\nTimestamp: ${entry.time}\nLog Type: ${entry.type.toUpperCase()}\nSummary: ${entry.msg}`;

            if (entry.details) {
                techDetails += `\nRaw Error Details: ${typeof entry.details === 'object' ? JSON.stringify(entry.details, null, 2) : entry.details}`;
            } else {
                techDetails += `\nTroubleshooting: Verify Discord ID authentication in DB_Members, check hostname in servers.json, and verify Google Apps Script web app permissions.`;
            }

            detailsBox.textContent = techDetails;

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (detailsBox.style.display === 'none') {
                    detailsBox.style.display = 'block';
                    toggleBtn.textContent = '✖ Collapse technical error details';
                } else {
                    detailsBox.style.display = 'none';
                    toggleBtn.textContent = '🔍 Click to expand full technical error details';
                }
            });

            card.appendChild(toggleBtn);
            card.appendChild(detailsBox);
        }

        return card;
    }

    function logToUI(msg, type, details = null) {
        if (isDuplicateLog(msg)) return;

        const time = new Date().toLocaleTimeString();
        const entry = { time, msg, type, details };
        logHistory.push(entry);
        if (logHistory.length > 150) logHistory.shift();

        const consoleLogs = document.getElementById('debug-console-logs');
        if (consoleLogs) {
            const card = createLogCardElement(entry);
            consoleLogs.appendChild(card);
            consoleLogs.scrollTop = consoleLogs.scrollHeight;
        }
    }

    window.renderLogHistory = function() {
        const consoleLogs = document.getElementById('debug-console-logs');
        if (consoleLogs) {
            consoleLogs.innerHTML = '';
            logHistory.forEach(entry => {
                const card = createLogCardElement(entry);
                consoleLogs.appendChild(card);
            });
            consoleLogs.scrollTop = consoleLogs.scrollHeight;
        }
    };

    console.log = function(...args) {
        originalLog.apply(console, args);
        logToUI(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'info');
    };
    
    console.error = function(...args) {
        logToUI(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'error', args.length > 1 ? args : args[0]);
    };
    
    console.warn = function(...args) {
        logToUI(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'warn', args.length > 1 ? args : args[0]);
    };

    // Relay debug logs from background service worker directly to logToUI (bypassing console.warn/error to prevent extension error page flags)
    chrome.runtime.onMessage.addListener((message) => {
        if (message && message.type === 'DEBUG_LOG') {
            logToUI(`[BG] ${message.msg}`, message.level || 'info');
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        const btnConsole = document.getElementById('btn-debug-console');
        const consoleModal = document.getElementById('debug-console-modal');
        const btnCloseConsole = document.getElementById('btn-close-console');
        const btnClearConsole = document.getElementById('btn-clear-console');

        if (btnConsole && consoleModal) {
            btnConsole.addEventListener('click', () => {
                consoleModal.classList.remove('hidden');
                btnConsole.style.borderColor = 'rgba(255,255,255,0.1)';
                btnConsole.style.color = '#a4b0be';
                btnConsole.style.boxShadow = 'none';
                if (window.renderLogHistory) window.renderLogHistory();
            });
            btnCloseConsole.addEventListener('click', () => consoleModal.classList.add('hidden'));
            btnClearConsole.addEventListener('click', () => {
                logHistory.length = 0;
                const logs = document.getElementById('debug-console-logs');
                if (logs) logs.innerHTML = '';
            });
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    const versionDisplay = document.getElementById('version-display');
    const manifest = chrome.runtime.getManifest();
    versionDisplay.textContent = manifest.version;

    // --- ASCII GLITCH RIPPLE COMPONENT ---
    const glitchTitleEl = document.getElementById('glitch-header-title');
    if (glitchTitleEl) {
        const originalText = glitchTitleEl.getAttribute('data-value') || glitchTitleEl.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZØ';
        let isGlitching = false;

        const getRandomChar = () => glitchChars[Math.floor(Math.random() * glitchChars.length)];

        const triggerAsciiRipple = () => {
            if (isGlitching) return;
            isGlitching = true;
            glitchTitleEl.classList.add('ascii-glitch-active');

            const textLength = originalText.length;
            let frame = 0;
            const totalFrames = 25;

            const interval = setInterval(() => {
                frame++;
                const progress = frame / totalFrames;

                let currentString = "";
                for (let i = 0; i < textLength; i++) {
                    if (originalText[i] === " ") {
                        currentString += " ";
                        continue;
                    }

                    const charProgress = (i / textLength);
                    const diff = Math.abs(progress - charProgress);

                    if (diff < 0.22) {
                        currentString += `<span class="glitch-char">${getRandomChar()}</span>`;
                    } else if (progress > charProgress) {
                        currentString += originalText[i];
                    } else {
                        currentString += (Math.random() < 0.08) ? getRandomChar() : originalText[i];
                    }
                }

                glitchTitleEl.innerHTML = currentString;

                if (frame >= totalFrames) {
                    clearInterval(interval);
                    glitchTitleEl.textContent = originalText;
                    glitchTitleEl.classList.remove('ascii-glitch-active');
                    isGlitching = false;
                }
            }, 35);
        };

        glitchTitleEl.addEventListener('mouseenter', triggerAsciiRipple);
        glitchTitleEl.addEventListener('click', triggerAsciiRipple);
        setTimeout(triggerAsciiRipple, 600);
    }

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
    const appBtnTroops = document.getElementById('app-btn-troops');
    const appBtnDef = document.getElementById('app-btn-def');
    const mapModules = document.getElementById('map-modules-container');
    const btnRefreshMap = document.getElementById('btn-refresh-map');
    const mapGlobalStats = document.getElementById('map-global-stats');
    const mapGeoStats = document.getElementById('map-geo-stats');

    const defModules = document.getElementById('def-modules-container');

    // TROOPS App: open Troops Analyzer in a new tab
    if (appBtnTroops) {
        appBtnTroops.addEventListener('click', () => {
            let url = chrome.runtime.getURL('troopsAnalyzer.html');
            if (currentServerData && Object.keys(currentServerData).length > 0) {
                url += `?server=${Object.keys(currentServerData)[0]}`;
            }
            chrome.tabs.create({ url: url });
        });
    }

    // Navigation Logic
    if (appBtnMap) {
        appBtnMap.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            mapModules.classList.remove('hidden');
            btnBackHome.classList.remove('hidden');
            loadMapStats();
            fetchChronosAlliancesList();
        });
    }

    if (appBtnDef) {
        appBtnDef.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            defModules.classList.remove('hidden');
            loadAegisPanel();
        });
    }

    const appBtnLogistics = document.getElementById('app-btn-logistics');
    const logisticsModules = document.getElementById('logistics-modules-container');
    const btnLogisticsBack = document.getElementById('btn-logistics-back');
    const btnRefreshLogistics = document.getElementById('btn-refresh-logistics');
    const btnOpenLogistics = document.getElementById('btn-open-logistics');

    if (appBtnLogistics) {
        appBtnLogistics.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            if (logisticsModules) logisticsModules.classList.remove('hidden');
            loadLogisticsPanel();
        });
    }

    if (btnLogisticsBack) {
        btnLogisticsBack.addEventListener('click', () => {
            if (logisticsModules) logisticsModules.classList.add('hidden');
            appGridContainer.classList.remove('hidden');
        });
    }

    if (btnRefreshLogistics) {
        btnRefreshLogistics.addEventListener('click', () => {
            refreshPanel('logistics');
        });
    }

    if (btnOpenLogistics) {
        btnOpenLogistics.addEventListener('click', () => {
            let url = chrome.runtime.getURL('logisticsTerminal.html');
            chrome.tabs.create({ url: url });
        });
    }

    const appBtnSitters = document.getElementById('app-btn-sitters');
    const sittersModules = document.getElementById('sitters-modules-container');
    const btnSittersBack = document.getElementById('btn-sitters-back');
    const btnRefreshSitters = document.getElementById('btn-refresh-sitters');
    const btnOpenSitters = document.getElementById('btn-open-sitters');

    if (appBtnSitters) {
        appBtnSitters.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            if (sittersModules) sittersModules.classList.remove('hidden');
            loadSittersPanel();
        });
    }

    if (btnSittersBack) {
        btnSittersBack.addEventListener('click', () => {
            if (sittersModules) sittersModules.classList.add('hidden');
            appGridContainer.classList.remove('hidden');
        });
    }

    if (btnRefreshSitters) {
        btnRefreshSitters.addEventListener('click', () => {
            refreshPanel('sitters');
        });
    }

    if (btnOpenSitters) {
        btnOpenSitters.addEventListener('click', () => {
            let url = chrome.runtime.getURL('sitterTerminal.html');
            chrome.tabs.create({ url: url });
        });
    }

    const appBtnStats = document.getElementById('app-btn-stats');
    const statsModules = document.getElementById('stats-modules-container');
    const btnStatsBack = document.getElementById('btn-stats-back');
    const btnRefreshStats = document.getElementById('btn-refresh-stats');
    const btnOpenAdvancedStats = document.getElementById('btn-open-advanced-stats');

    if (appBtnStats) {
        appBtnStats.addEventListener('click', () => {
            appGridContainer.classList.add('hidden');
            if (statsModules) statsModules.classList.remove('hidden');
            loadStatsPanel();
        });
    }

    if (btnStatsBack) {
        btnStatsBack.addEventListener('click', () => {
            if (statsModules) statsModules.classList.add('hidden');
            appGridContainer.classList.remove('hidden');
        });
    }

    if (btnRefreshStats) {
        btnRefreshStats.addEventListener('click', () => {
            fetchStatsOverview(true);
        });
    }

    if (btnOpenAdvancedStats) {
        btnOpenAdvancedStats.addEventListener('click', () => {
            let url = chrome.runtime.getURL('statsTerminal.html');
            if (currentServerData && Object.keys(currentServerData).length > 0) {
                url += `?server=${Object.keys(currentServerData)[0]}`;
            }
            chrome.tabs.create({ url: url });
        });
    }

    const btnDefBack = document.getElementById('btn-def-back');
    if (btnDefBack) {
        btnDefBack.addEventListener('click', () => {
            defModules.classList.add('hidden');
            appGridContainer.classList.remove('hidden');
        });
    }

    if (btnBackHome) {
        btnBackHome.addEventListener('click', () => {
            mapModules.classList.add('hidden');
            defModules.classList.add('hidden');
            if (logisticsModules) logisticsModules.classList.add('hidden');
            if (sittersModules) sittersModules.classList.add('hidden');
            if (statsModules) statsModules.classList.add('hidden');
            btnBackHome.classList.add('hidden');
            appGridContainer.classList.remove('hidden');
            
            if (pveDrilldown && !pveDrilldown.classList.contains('hidden')) {
                pveDrilldown.classList.add('hidden');
                pveAnimalGrid.classList.remove('hidden');
            }
        });
    }

    // Load background notification badges for Logistics on start
    fetchLogisticsData();

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
        refreshPanel('map');
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
        }
        // Always paint current status from open Travian tabs, then re-verify with backend
        updateActiveGameStatus();
        if (result.discordId) {
            triggerVerificationSweep(result.discordId);
        }
    });

    // Kill Switch action buttons
    const btnKillSupport = document.getElementById('btn-kill-support');
    const btnKillWebstore = document.getElementById('btn-kill-webstore');
    if (btnKillSupport) {
        btnKillSupport.addEventListener('click', () => window.open('https://discord.gg/pdpVR69Vf6', '_blank'));
    }
    if (btnKillWebstore) {
        btnKillWebstore.addEventListener('click', () => window.open('https://chromewebstore.google.com/search/NULL%20Map%20Engine', '_blank'));
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.discordUser) {
                if (changes.discordUser.newValue) {
                    updateDiscordWidget(changes.discordUser.newValue);
                    if (saveStatus) saveStatus.textContent = "Successfully logged in!";
                }
            } else if (changes.discordId) {
                if (changes.discordId.newValue && !discordWidget.classList.contains('hidden') === false) {
                    discordIdDisplay.textContent = `Connected ID: ${changes.discordId.newValue}`;
                    discordIdDisplay.style.display = "block";
                    if (loginBtn) loginBtn.innerHTML = '<img src="assets/DiscordIcon.png" alt="Discord" class="discord-icon"> Reconnect Discord';
                    if (saveStatus) saveStatus.textContent = "Successfully logged in (ID only)!";
                    triggerVerificationSweep(changes.discordId.newValue);
                }
            }
            if (changes.serverData) {
                currentServerData = changes.serverData.newValue || {};
                updateActiveGameStatus();
            }
            if (changes.authError) {
                updateActiveGameStatus();
            }
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
                updateActiveGameStatus();
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

            chrome.tabs.create({ url: authUrl });
            saveStatus.textContent = "Please authorize Discord in the new tab...";
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

    let _verifyInFlight = false;
    function triggerVerificationSweep(discordId) {
        if (!discordId || _verifyInFlight) return;
        _verifyInFlight = true;
        chrome.runtime.sendMessage({ type: 'VERIFY_IDENTITY', discordId: discordId }, (response) => {
            _verifyInFlight = false;
            if (chrome.runtime.lastError) {
                console.error("VERIFY_IDENTITY failed:", chrome.runtime.lastError.message);
                return;
            }
            if (response && response.status === "KILL") {
                killScreen.classList.remove('hidden');
                if (sidepanelContainer) sidepanelContainer.classList.add('hidden');
                return;
            }
            if (response && response.serverData) {
                currentServerData = response.serverData;
            }
            updateActiveGameStatus();

            if (response && response.serverData && Object.keys(response.serverData).length > 0) {
                if (saveStatus) saveStatus.textContent = "Verified, welcome!";
            } else if (response && response.status && response.status !== "OK") {
                if (saveStatus) {
                    saveStatus.textContent = response.msg || response.status;
                    saveStatus.style.color = "#ff4757";
                    setTimeout(() => { saveStatus.style.color = "#2ed573"; saveStatus.textContent = ""; }, 5000);
                }
            }
        });
    }

    // Tab change listener: refresh status + re-verify if a Travian tab exists but we have no access data
    chrome.tabs.onActivated.addListener(() => {
        updateActiveGameStatus();
        chrome.storage.local.get(['discordId'], (res) => {
            if (res.discordId) {
                chrome.tabs.query({ url: "*://*.travian.com/*" }, (tabs) => {
                    if (!tabs || tabs.length === 0) return;
                    const hostname = new URL(tabs[0].url).hostname;
                    if (!currentServerData || !currentServerData[hostname]) {
                        triggerVerificationSweep(res.discordId);
                    }
                });
            }
        });
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url && tab.url && tab.url.includes('travian.com')) {
            updateActiveGameStatus();
            chrome.storage.local.get(['discordId'], (res) => {
                if (res.discordId) triggerVerificationSweep(res.discordId);
            });
        }
    });
    
    function renderLeaderboards(hostname, data) {
        leaderboardsContainer.classList.remove('hidden');
        
        // Helper to get tribe medium icon
        const getTribeImg = (tribe) => {
            if (!tribe) return "";
            let t = String(tribe).toLowerCase();
            if (t.includes('roman')) return 'assets/roman_medium.png';
            if (t.includes('gaul')) return 'assets/gaul_medium.png';
            if (t.includes('teuton')) return 'assets/teuton_medium.png';
            if (t.includes('egyptian')) return 'assets/egyptian_medium.png';
            if (t.includes('hun')) return 'assets/hun_medium.png';
            if (t.includes('spartan')) return 'assets/spartan_medium.png';
            return "";
        };

        const renderLeaderboardRow = (p, idx, currentIgn) => {
            const playerUrl = p.uid && p.uid !== "0" ? `https://${hostname}/profile/${p.uid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(p.ign)}`;
            const allyUrl = (p.aid && p.aid !== "0" && p.aid !== 0) ? `https://${hostname}/alliance/${p.aid}` : (p.ally ? `https://${hostname}/statistiken.php?id=2&name=${encodeURIComponent(p.ally)}` : null);
            
            const row = document.createElement('div');
            row.className = "table-row" + (p.ign === currentIgn ? " highlight" : "");
            
            let tribeImg = getTribeImg(p.tribe);
            let tribeHtml = tribeImg ? `<img src="${tribeImg}" style="width:16px;height:16px;image-rendering:pixelated;vertical-align:text-bottom;margin-right:4px;">` : "";
            
            let allyTagHtml = "";
            if (p.ally && p.ally !== "Unknown" && p.ally !== "None") {
                if (allyUrl) {
                    allyTagHtml = `<a href="${allyUrl}" target="_blank" class="leaderboard-ally-link">[${p.ally}]</a>`;
                } else {
                    allyTagHtml = `<span style="color:#dcdde1;font-weight:700;margin-right:4px;">[${p.ally}]</span>`;
                }
            }

            row.innerHTML = `
                <span style="display:inline-flex;align-items:center;">
                    <span style="min-width:18px;font-weight:600;margin-right:2px;">${idx+1}.</span>
                    ${tribeHtml}
                    ${allyTagHtml}
                    <a href="${playerUrl}" target="_blank" class="leaderboard-link">${p.ign}</a>
                </span>
                <span class="table-count">${p.count.toLocaleString()}</span>
            `;
            return row;
        };

        // Ownership
        tableOwnership.innerHTML = "";
        if (data.topOwnership && data.topOwnership.length > 0) {
            data.topOwnership.forEach((p, idx) => {
                tableOwnership.appendChild(renderLeaderboardRow(p, idx, data.ign));
            });
        } else {
            tableOwnership.innerHTML = "<div class='table-row'>No data yet.</div>";
        }
        
        // Scanners
        tableScanners.innerHTML = "";
        if (data.topScanners && data.topScanners.length > 0) {
            data.topScanners.forEach((p, idx) => {
                tableScanners.appendChild(renderLeaderboardRow(p, idx, data.ign));
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

    function formatAuthDenial(authError) {
        if (!authError) return "Unregistered / No Access";
        const status = authError.status || "";
        const msg = authError.msg || "";
        if (status === "NOT_CONFEDERATION") return msg || "Not in confederacy";
        if (status === "NOT_VERIFIED") return msg || "Missing Verified role";
        if (status === "NOT_REGISTERED" || status === "UNREGISTERED") return msg || "Not registered in DB";
        return msg || status || "Unregistered / No Access";
    }

    let lastCheckedState = { hostname: "", statusText: "", time: 0 };

    function updateActiveGameStatus() {
        if (!activeServerName) return;
        
        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
                try {
                    const url = new URL(tabs[0].url);
                    const shortName = url.hostname.split('.international.travian.com')[0].toUpperCase();
                    activeServerName.textContent = shortName;
                    
                    const now = Date.now();
                    const hostnameChanged = (lastCheckedState.hostname !== url.hostname);
                    const timeElapsed = (now - lastCheckedState.time) > 25000;
                    
                    chrome.storage.local.get(['authError', 'discordId', 'serverData'], (storageRes) => {
                        if (!storageRes.discordId) {
                            activeServerBadge.style.background = "#ff4757";
                            activeServerBadge.style.boxShadow = "0 0 8px #ff4757";
                            if (activeServerIndicator) activeServerIndicator.style.borderLeftColor = "#ff4757";
                            activeServerIgn.textContent = "Discord not connected";
                            activeServerScans.textContent = "";
                            leaderboardsContainer.classList.add('hidden');
                            chrome.runtime.sendMessage({ type: 'UPDATE_ICON_COLOR', color: 'red' }).catch(() => {});
                            
                            if (hostnameChanged || timeElapsed || lastCheckedState.statusText !== "NO_DISCORD") {
                                console.warn(`⚠️ [AUTH] Discord ID not linked in extension storage.`);
                                lastCheckedState = { hostname: url.hostname, statusText: "NO_DISCORD", time: now };
                            }
                            return;
                        }

                        // Prefer live storage if available (keeps status in sync across panels)
                        if (storageRes.serverData) currentServerData = storageRes.serverData;

                        if (currentServerData && currentServerData[url.hostname]) {
                            const data = currentServerData[url.hostname];
                            activeServerBadge.style.background = "#2ed573";
                            activeServerBadge.style.boxShadow = "0 0 8px #2ed573";
                            if (activeServerIndicator) activeServerIndicator.style.borderLeftColor = "#2ed573";
                            activeServerIgn.textContent = data.ign || "Connected";
                            if (data.scannedTiles !== undefined) {
                                activeServerScans.innerHTML = `<strong style="color:#eccc68">${data.scannedTiles.toLocaleString()}</strong> Scans`;
                            }
                            
                            chrome.runtime.sendMessage({ type: 'UPDATE_ICON_COLOR', color: 'green' }).catch(() => {});
                            
                            leaderboardsContainer.classList.remove('hidden');
                            renderLeaderboards(url.hostname, data);
                            
                            if (hostnameChanged || timeElapsed || lastCheckedState.statusText !== "OK") {
                                console.log(`✅ [AUTH VERIFIED] Connected to ${url.hostname} as Operative ${data.ign || 'Member'}`);
                                lastCheckedState = { hostname: url.hostname, statusText: "OK", time: now };
                            }
                        } else {
                            activeServerBadge.style.background = "#ff4757";
                            activeServerBadge.style.boxShadow = "0 0 8px #ff4757";
                            if (activeServerIndicator) activeServerIndicator.style.borderLeftColor = "#ff4757";
                            
                            let denial = "Checking access...";
                            if (storageRes.authError && storageRes.authError.hostname === url.hostname) {
                                denial = formatAuthDenial(storageRes.authError);
                            } else if (storageRes.authError && !storageRes.authError.hostname) {
                                denial = formatAuthDenial(storageRes.authError);
                            }
                            activeServerIgn.innerHTML = `<span style="color:#ff4757; font-weight:600; font-size:11px;" title="${denial}">${denial}</span>`;
                            activeServerScans.textContent = "";
                            leaderboardsContainer.classList.add('hidden');
                            
                            chrome.runtime.sendMessage({ type: 'UPDATE_ICON_COLOR', color: 'red' }).catch(() => {});
                            
                            if (hostnameChanged || timeElapsed || lastCheckedState.statusText !== denial) {
                                console.warn(`🔴 [AUTH DENIAL] Access failed for ${url.hostname}: ${denial}`, storageRes.authError);
                                lastCheckedState = { hostname: url.hostname, statusText: denial, time: now };
                            }
                        }
                    });
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

    function setRefreshBusy(btn, busy) {
        if (!btn) return;
        btn.style.opacity = busy ? '0.5' : '1';
        btn.style.pointerEvents = busy ? 'none' : 'auto';
    }

    function markRefreshError(btn, el) {
        if (el) el.innerHTML = `Error`;
        if (btn) {
            btn.style.background = 'rgba(231, 76, 60, 0.2)';
            btn.style.color = '#e74c3c';
            setRefreshBusy(btn, false);
        }
    }

    function applyRefreshTimestamp(el, btn, fetchedAtMs, utcOffsetStr) {
        if (!el) return;
        const offsetStr = utcOffsetStr || "+00:00";
        let offsetHours = 0, offsetMinutes = 0, sign = 1;
        let match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
        if (match) {
            sign = match[1] === '-' ? -1 : 1;
            offsetHours = parseInt(match[2], 10);
            offsetMinutes = parseInt(match[3], 10);
        }
        let ts = new Date(fetchedAtMs || Date.now());
        let localTime = ts.getTime();
        let localOffset = ts.getTimezoneOffset() * 60000;
        let targetOffset = (offsetHours * 3600000 + offsetMinutes * 60000) * sign;
        let serverTime = new Date(localTime + localOffset + targetOffset);
        let h = serverTime.getHours().toString().padStart(2, '0');
        let m = serverTime.getMinutes().toString().padStart(2, '0');
        el.innerHTML = `Updated<br>${h}:${m} (UTC${offsetStr})`;

        // Color by how fresh THIS successful refresh was (not map tile age)
        let diffMs = Date.now() - ts.getTime();
        if (btn) {
            setRefreshBusy(btn, false);
            if (!fetchedAtMs) {
                btn.style.background = 'rgba(231, 76, 60, 0.2)';
                btn.style.color = '#e74c3c';
            } else if (diffMs < 30 * 60000) {
                btn.style.background = 'rgba(46, 204, 113, 0.2)';
                btn.style.color = '#2ecc71';
            } else if (diffMs < 120 * 60000) {
                btn.style.background = 'rgba(230, 126, 34, 0.2)';
                btn.style.color = '#e67e22';
            } else {
                btn.style.background = 'rgba(231, 76, 60, 0.2)';
                btn.style.color = '#e74c3c';
            }
        }
    }

    // Unified refresh entry-point used by MAP, DEF, LOGISTICS, and SITTERS headers
    function refreshPanel(panel) {
        let btn, el;
        if (panel === 'aegis') {
            btn = document.getElementById('btn-refresh-aegis');
            el = document.getElementById('aegis-last-updated');
        } else if (panel === 'logistics') {
            btn = document.getElementById('btn-refresh-logistics');
            el = document.getElementById('logistics-last-updated');
        } else if (panel === 'sitters') {
            btn = document.getElementById('btn-refresh-sitters');
            el = document.getElementById('sitters-last-updated');
        } else {
            btn = document.getElementById('btn-refresh-map');
            el = document.getElementById('map-last-updated');
        }

        setRefreshBusy(btn, true);
        if (el) el.innerHTML = `Fetching...`;

        chrome.storage.local.get(['discordId'], (result) => {
            if (result.discordId) triggerVerificationSweep(result.discordId);
        });

        if (panel === 'aegis') {
            fetchAegisTop10(true);
        } else if (panel === 'logistics') {
            fetchLogisticsData(true);
        } else if (panel === 'sitters') {
            fetchSitterData(true);
        } else {
            fetchMapStats(true);
            fetchWorldEvents();
        }
    }

    function loadMapStats() {
        chrome.storage.local.get(['mapStatsCache', 'mapStatsLastRefresh', 'mapStatsUtcOffset'], (result) => {
            if (result.mapStatsCache) {
                renderMapStats(result.mapStatsCache, result.mapStatsLastRefresh, result.mapStatsUtcOffset);
            } else {
                fetchMapStats();
            }
        });
    }

    function fetchMapStats(fromRefresh) {
        if (!mapGlobalStats || !mapGeoStats) return;
        const lastUpdatedEl = document.getElementById('map-last-updated');
        if (fromRefresh) {
            setRefreshBusy(btnRefreshMap, true);
            if (lastUpdatedEl) lastUpdatedEl.innerHTML = `Fetching...`;
        }
        mapGlobalStats.innerHTML = 'Fetching intelligence...';
        mapGeoStats.innerHTML = 'Waiting for data...';
        
        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
                const url = new URL(tabs[0].url);
                chrome.storage.local.get(['discordId', 'serverData'], (res) => {
                    if (res.serverData) currentServerData = res.serverData;
                    if (!(currentServerData && currentServerData[url.hostname])) {
                        mapGlobalStats.innerHTML = 'No active server.';
                        if (fromRefresh) markRefreshError(btnRefreshMap, lastUpdatedEl);
                        return;
                    }
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
                            if (fromRefresh) markRefreshError(btnRefreshMap, lastUpdatedEl);
                            return;
                        }
                        let data = safeParseJSON(rawText);
                        if (!data) {
                            mapGlobalStats.innerHTML = 'Server error.';
                            if (fromRefresh) markRefreshError(btnRefreshMap, lastUpdatedEl);
                            return;
                        }
                        if (data.status === "ok") {
                            const fetchedAt = Date.now();
                            const utcOffset = (data.stats && data.stats.utcOffset) || "+00:00";
                            chrome.storage.local.set({
                                mapStatsCache: data.stats,
                                mapStatsLastRefresh: fetchedAt,
                                mapStatsUtcOffset: utcOffset
                            });
                            renderMapStats(data.stats, fetchedAt, utcOffset);
                        } else if (data.status === "KILL") {
                            chrome.storage.local.set({ killSwitch: true });
                            killScreen.classList.remove('hidden');
                            if (sidepanelContainer) sidepanelContainer.classList.add('hidden');
                        } else {
                            mapGlobalStats.innerHTML = 'Error: ' + (data.msg || data.status);
                            console.error(`[Map Stats] ${data.status}: ${data.msg || ''}`);
                            if (fromRefresh) markRefreshError(btnRefreshMap, lastUpdatedEl);
                        }
                    });
                });
            } else {
                mapGlobalStats.innerHTML = 'Navigate to game.';
                if (fromRefresh) markRefreshError(btnRefreshMap, lastUpdatedEl);
            }
        });
    }

    function renderMapStats(data, fetchedAtMs, utcOffsetStr) {
        if (!mapGlobalStats || !mapGeoStats || !data) return;
        
        const mapLastUpdated = document.getElementById('map-last-updated');
        if (fetchedAtMs) {
            applyRefreshTimestamp(mapLastUpdated, btnRefreshMap, fetchedAtMs, utcOffsetStr || data.utcOffset);
        } else if (mapLastUpdated) {
            mapLastUpdated.innerHTML = `Never`;
            if (btnRefreshMap) {
                btnRefreshMap.style.background = 'rgba(231, 76, 60, 0.2)';
                btnRefreshMap.style.color = '#e74c3c';
            }
        }

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
        
        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
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
        
        const ANIMAL_STATS = {
            "Rat": { inf: 25, cav: 20 },
            "Spider": { inf: 35, cav: 40 },
            "Snake": { inf: 40, cav: 60 },
            "Bat": { inf: 66, cav: 50 },
            "Wild Boar": { inf: 70, cav: 33 },
            "Wolf": { inf: 80, cav: 70 },
            "Bear": { inf: 140, cav: 200 },
            "Crocodile": { inf: 380, cav: 240 },
            "Tiger": { inf: 170, cav: 250 },
            "Elephant": { inf: 440, cav: 520 }
        };
        
        filtered.forEach((r, idx) => {
            let emoji = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : "📍"));
            let spriteIndices = { "Elephant": 9, "Tiger": 8, "Bear": 6, "Crocodile": 7 };
            let sIdx = spriteIndices[animalName];
            let animalSpriteHtml = sIdx !== undefined ? `<span style="display:inline-block; width: 16px; height: 16px; background-image: url('assets/nature_small.png'); background-position: 0px -${sIdx*16}px; image-rendering: pixelated; vertical-align: text-bottom; margin-left: 2px;"></span>` : animalName;
            let displayTargetCount = (r.targetCount !== undefined && r.targetCount !== null) ? r.targetCount : 0;
            let displayCages = (r.cagesNeeded !== undefined && r.cagesNeeded !== null) ? r.cagesNeeded : 0;
            
            let totalInf = 0;
            let totalCav = 0;
            if (r.captured) {
                for (let aName in r.captured) {
                    let capCount = r.captured[aName];
                    let st = ANIMAL_STATS[aName];
                    if (st) {
                        totalInf += st.inf * capCount;
                        totalCav += st.cav * capCount;
                    }
                }
            } else {
                // Fallback for old cache or missing data
                const stats = ANIMAL_STATS[animalName] || { inf: 0, cav: 0 };
                totalInf = displayTargetCount * stats.inf;
                totalCav = displayTargetCount * stats.cav;
            }
            
            let totalCombined = totalInf + totalCav;
            let avgDefPerCage = displayCages > 0 ? Math.round(totalCombined / displayCages) : 0;
            
            html += `<div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; background: rgba(47, 54, 64, 0.4); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="line-height:1.4;">
                    <b style="color:#f1f2f6;">${emoji} Oasis (${r.x}|${r.y})</b><br>
                    <span style="font-size:11px; color:#2ed573;">🎯 ${displayTargetCount} ${animalSpriteHtml} | 📦 ${displayCages} Cages</span><br>
                    <span style="font-size:10px; color:#a4b0be;">🪖 +${totalInf.toLocaleString()} Inf / 🐎 +${totalCav.toLocaleString()} Cav (Avg: ${avgDefPerCage.toLocaleString()}/cage)</span>
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
        if (message.action === "authError") {
            console.error(`[Security Firewall - ${message.hostname}] ${message.status}: ${message.msg}`);
            updateActiveGameStatus();
            const btnConsole = document.getElementById('btn-debug-console');
            if (btnConsole) {
                btnConsole.style.borderColor = '#f39c12';
                btnConsole.style.color = '#f39c12';
                btnConsole.style.boxShadow = '0 0 8px rgba(243, 156, 18, 0.5)';
            }
        }
    });
    // ==========================================
    // CHRONOS TERMINAL FETCH & RENDER LOGIC
    // ==========================================

    const btnRefreshAegis = document.getElementById('btn-refresh-aegis');
    if (btnRefreshAegis) {
        btnRefreshAegis.addEventListener('click', () => {
            refreshPanel('aegis');
        });
    }

    // Mirror of loadMapStats(): restore cached Aegis UI + refresh timestamp on panel open
    function loadAegisPanel() {
        const lastUpdatedEl = document.getElementById('aegis-last-updated');
        chrome.storage.local.get(['aegisDataCache', 'aegisLastRefresh', 'aegisUtcOffset', 'serverData'], (result) => {
            if (result.serverData) currentServerData = result.serverData;
            if (result.aegisLastRefresh) {
                applyRefreshTimestamp(lastUpdatedEl, btnRefreshAegis, result.aegisLastRefresh, result.aegisUtcOffset || "+00:00");
            } else if (lastUpdatedEl) {
                lastUpdatedEl.innerHTML = ``;
                if (btnRefreshAegis) {
                    btnRefreshAegis.style.background = 'rgba(231, 76, 60, 0.2)';
                    btnRefreshAegis.style.color = '#e74c3c';
                }
            }

            if (result.aegisDataCache && result.aegisDataCache.hostname) {
                const cache = result.aegisDataCache;
                renderAegisTop10(cache.stats, cache.hostname);
                renderAegisSidebarCards(cache, cache.hostname);
                updateDefBubbles(cache.incomings, cache.standing);
            }
            // Do not auto-fetch on open (same philosophy as MAP: keep cache until manual refresh)
        });
    }

    function fetchAegisTop10(fromRefresh) {
        const elContainer = document.getElementById('aegis-hof-container');
        const lastUpdatedEl = document.getElementById('aegis-last-updated');
        const incContainer = document.getElementById('aegis-sidebar-incomings');
        const stdContainer = document.getElementById('aegis-sidebar-standing');
        
        if (fromRefresh) {
            setRefreshBusy(btnRefreshAegis, true);
            if (lastUpdatedEl) lastUpdatedEl.innerHTML = `Fetching...`;
        }
        if (!elContainer) return;
        // Only set fetching text on cold start when container is empty to prevent UI wiping/flicker
        if (!elContainer.children || elContainer.children.length === 0) {
            elContainer.innerHTML = "<div class='table-row'>Fetching Aegis intelligence...</div>";
        }
        if (incContainer && (!incContainer.children || incContainer.children.length === 0)) {
            incContainer.innerHTML = '<div style="font-size: 12px; color: #a4b0be; padding: 10px; text-align: center;">Fetching...</div>';
        }
        if (stdContainer && (!stdContainer.children || stdContainer.children.length === 0)) {
            stdContainer.innerHTML = '<div style="font-size: 12px; color: #a4b0be; padding: 10px; text-align: center;">Fetching...</div>';
        }

        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
                const url = new URL(tabs[0].url);
                chrome.storage.local.get(['discordId', 'serverData'], (res) => {
                    if (res.serverData) currentServerData = res.serverData;
                    if (!(currentServerData && currentServerData[url.hostname])) {
                        elContainer.innerHTML = "<div class='table-row'>No active server.</div>";
                        if (fromRefresh) markRefreshError(btnRefreshAegis, lastUpdatedEl);
                        return;
                    }
                    let payload = [{ action: "aegis_get_data", discordId: res.discordId || "unknown", extVersion: chrome.runtime.getManifest().version }];
                    chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                        if (!rawText) { 
                            elContainer.innerHTML = "<div class='table-row'>Network error.</div>"; 
                            if (fromRefresh) markRefreshError(btnRefreshAegis, lastUpdatedEl);
                            return; 
                        }
                        let data = safeParseJSON(rawText);
                        if (!data) {
                            elContainer.innerHTML = "<div class='table-row'>Network/Server Error.</div>";
                            if (fromRefresh) markRefreshError(btnRefreshAegis, lastUpdatedEl);
                            return;
                        }
                        if (data.status === "KILL") {
                            chrome.storage.local.set({ killSwitch: true });
                            killScreen.classList.remove('hidden');
                            if (sidepanelContainer) sidepanelContainer.classList.add('hidden');
                            return;
                        }
                        if (data.status !== "ok") {
                            elContainer.innerHTML = "<div class='table-row'>Error: " + (data.msg || data.status) + "</div>";
                            if (fromRefresh) markRefreshError(btnRefreshAegis, lastUpdatedEl);
                        } else {
                            renderAegisTop10(data.stats, url.hostname);
                            renderAegisSidebarCards(data, url.hostname);
                            updateDefBubbles(data.incomings, data.standing);

                            const fetchedAt = Date.now();
                            const utcOffsetStr = data.utcOffset || "+00:00";
                            chrome.storage.local.set({
                                aegisLastRefresh: fetchedAt,
                                aegisUtcOffset: utcOffsetStr,
                                aegisDataCache: {
                                    hostname: url.hostname,
                                    stats: data.stats,
                                    incomings: data.incomings,
                                    standing: data.standing,
                                    utcOffset: utcOffsetStr,
                                    serverTime: data.serverTime
                                }
                            });
                            applyRefreshTimestamp(lastUpdatedEl, btnRefreshAegis, fetchedAt, utcOffsetStr);
                        }
                    });
                });
            } else { 
                elContainer.innerHTML = "<div class='table-row'>Navigate to game.</div>"; 
                if (fromRefresh) markRefreshError(btnRefreshAegis, lastUpdatedEl);
            }
        });
    }

    function updateDefBubbles(incomings, standing) {
        let activeInc = incomings ? incomings.length : 0;
        let activeStd = standing ? standing.length : 0;

        let bInc = document.getElementById('def-bubble-inc');
        let bStd = document.getElementById('def-bubble-std');

        if (bInc) {
            if (activeInc > 0) {
                bInc.style.display = "flex";
                bInc.innerText = activeInc > 9 ? "9+" : activeInc;
            } else {
                bInc.style.display = "none";
            }
        }
        if (bStd) {
            if (activeStd > 0) {
                bStd.style.display = "flex";
                bStd.innerText = activeStd > 9 ? "9+" : activeStd;
            } else {
                bStd.style.display = "none";
            }
        }
    }

    function renderAegisTop10(stats, hostname) {
        const elContainer = document.getElementById('aegis-hof-container');
        if (!elContainer) return;

        if (!stats || stats.length === 0) {
            elContainer.innerHTML = "<div class='table-row'>No data yet.</div>";
            return;
        }

        let sorted = [...stats].sort((a, b) => b.total - a.total);
        
        const getTribeImg = (tribe) => {
            if (!tribe) return "";
            let t = tribe.toLowerCase();
            if (t.includes('roman')) return 'assets/roman_medium.png';
            if (t.includes('gaul')) return 'assets/gaul_medium.png';
            if (t.includes('teuton')) return 'assets/teuton_medium.png';
            if (t.includes('egyptian')) return 'assets/egyptian_medium.png';
            if (t.includes('hun')) return 'assets/hun_medium.png';
            if (t.includes('spartan')) return 'assets/spartan_medium.png';
            return "";
        };

        let html = `
            <div style="display:flex; justify-content: space-between; padding: 4px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size:9px; color:#a4b0be; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px;">
                <div style="padding-left:22px;">Operative</div>
                <div style="display:flex; gap: 10px; text-align:right;">
                    <span style="width:35px; color:#ff4757;" title="Vanguard (Active)">VAN</span>
                    <span style="width:35px; color:#3498db;" title="Sentinel (Static)">SEN</span>
                    <span style="width:40px; color:#f1c40f;" title="Total Score">TOT</span>
                </div>
            </div>
        `;
        
        sorted.slice(0, 10).forEach((p, idx) => {
            const playerUrl = p.uid && p.uid !== "0" ? `https://${hostname}/profile/${p.uid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(p.ign)}`;
            const allyUrl = (p.aid && p.aid !== "0" && p.aid !== 0) ? `https://${hostname}/alliance/${p.aid}` : (p.ally ? `https://${hostname}/statistiken.php?id=2&name=${encodeURIComponent(p.ally)}` : null);

            let tribeImg = getTribeImg(p.tribe);
            let tribeHtml = tribeImg ? `<img src="${tribeImg}" style="width:14px;height:14px;image-rendering:pixelated;vertical-align:middle;margin-right:4px;" title="${p.tribe}">` : "";
            
            let emoji = "";
            if (idx === 0) emoji = "🥇";
            else if (idx === 1) emoji = "🥈";
            else if (idx === 2) emoji = "🥉";
            else emoji = `${idx + 1}.`;

            let allyTagHtml = "";
            if (p.ally && p.ally !== "Unknown" && p.ally !== "None") {
                if (allyUrl) {
                    allyTagHtml = `<a href="${allyUrl}" target="_blank" class="leaderboard-ally-link">[${p.ally}]</a>`;
                } else {
                    allyTagHtml = `<span style="color:#dcdde1;font-weight:700;margin-right:4px;">[${p.ally}]</span>`;
                }
            }

            html += `
                <div class="table-row" style="padding: 6px 12px; display:flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); align-items:center;">
                    <div style="display:flex; align-items:center; gap:2px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">
                        <span style="width:20px; font-weight:bold; color:#a4b0be; font-size:11px; text-align:center;">${emoji}</span>
                        ${tribeHtml}
                        ${allyTagHtml}
                        <a href="${playerUrl}" target="_blank" class="leaderboard-link">${p.ign}</a>
                    </div>
                    <div style="display:flex; align-items:center; gap: 10px; font-family:monospace; font-size:11px; text-align:right;">
                        <span style="color:#ff4757; width:35px;" title="Vanguard (Active)"><span style="font-size:10px;color:#a4b0be;margin-right:2px;">⚔️</span>${(p.vanguard || 0).toLocaleString()}</span>
                        <span style="color:#3498db; width:35px;" title="Sentinel (Static)"><span style="font-size:10px;color:#a4b0be;margin-right:2px;">🧱</span>${(p.sentinel || 0).toLocaleString()}</span>
                        <span style="color:#f1c40f; font-weight:bold; font-size:12px; width:40px;" title="Total Score">${(p.total || 0).toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        
        elContainer.innerHTML = html;
    }

    function renderAegisSidebarCards(data, hostname) {
        const incContainer = document.getElementById('aegis-sidebar-incomings');
        const stdContainer = document.getElementById('aegis-sidebar-standing');
        
        const getTribeImg = (tribe) => {
            if (!tribe) return "";
            let t = tribe.toLowerCase();
            if (t.includes('roman')) return 'assets/roman_medium.png';
            if (t.includes('gaul')) return 'assets/gaul_medium.png';
            if (t.includes('teuton')) return 'assets/teuton_medium.png';
            if (t.includes('egyptian')) return 'assets/egyptian_medium.png';
            if (t.includes('hun')) return 'assets/hun_medium.png';
            if (t.includes('spartan')) return 'assets/spartan_medium.png';
            return "";
        };

        // Date parser to add UTC offset
        const parseImpactTime = (impactTimeStr, serverTime, utcOffsetStr) => {
            if (!impactTimeStr) return "--";
            try {
                // If it looks like a valid date string
                let impactTimestamp = new Date(impactTimeStr.replace(" ", "T") + (utcOffsetStr || "+00:00")).getTime();
                if (isNaN(impactTimestamp)) impactTimestamp = new Date(impactTimeStr).getTime();
                
                if (!isNaN(impactTimestamp)) {
                    let match = (utcOffsetStr || "+00:00").match(/([+-])(\d{2}):(\d{2})/);
                    let offsetMs = 0;
                    if (match) {
                        let sign = match[1] === '+' ? 1 : -1;
                        let hours = parseInt(match[2], 10);
                        let mins = parseInt(match[3], 10);
                        offsetMs = sign * ((hours * 60 * 60 * 1000) + (mins * 60 * 1000));
                    }
                    let d = new Date(impactTimestamp);
                    let utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
                    let travianDate = new Date(utcMs + offsetMs);
                    
                    let hh = travianDate.getHours();
                    let mm = travianDate.getMinutes();
                    let ss = travianDate.getSeconds();
                    let ampm = hh >= 12 ? 'PM' : 'AM';
                    hh = hh % 12;
                    hh = hh ? hh : 12;
                    
                    let pad = n => n < 10 ? '0'+n : n;
                    return `${pad(hh)}:${pad(mm)}:${pad(ss)} ${ampm} (UTC${utcOffsetStr || "+00:00"})`;
                }
            } catch(e) {}
            return `${impactTimeStr} (UTC${utcOffsetStr || "+00:00"})`;
        };

        // Render Incomings
        if (incContainer) {
            if (!data.incomings || data.incomings.length === 0) {
                incContainer.innerHTML = '<div style="font-size: 12px; color: #a4b0be; padding: 10px; text-align: center;">No active alerts</div>';
            } else {
                let html = '';
                data.incomings.forEach(inc => {
                    let dImg = getTribeImg(inc.defenderTribe);
                    let aImg = getTribeImg(inc.attackerTribe);
                    
                    let dHtml = dImg ? `<img src="${dImg}" style="width:12px;height:12px;image-rendering:pixelated;vertical-align:middle;margin-right:2px;" title="${inc.defenderTribe}">` : "";
                    let aHtml = aImg ? `<img src="${aImg}" style="width:12px;height:12px;image-rendering:pixelated;vertical-align:middle;margin-right:2px;" title="${inc.attackerTribe}">` : "";
                    
                    let dUrl = inc.defenderUid && inc.defenderUid !== "0" ? `https://${hostname}/profile/${inc.defenderUid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(inc.defenderIGN)}`;
                    let aUrl = inc.attackerUid && inc.attackerUid !== "0" ? `https://${hostname}/profile/${inc.attackerUid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(inc.attackerIGN)}`;
                    
                    let dx=0, dy=0;
                    let cMatch = (inc.targetCoords || "").match(/\((-?\d+)\|(-?\d+)\)/);
                    if (cMatch) { dx = cMatch[1]; dy = cMatch[2]; }
                    let vUrl = dx ? `https://${hostname}/position_details.php?x=${dx}&y=${dy}` : "#";

                    let dAlly = inc.defenderAlly && inc.defenderAlly !== "None" ? `<span style="color:#a4b0be;">[${inc.defenderAlly}]</span>` : '';
                    let aAlly = inc.attackerAlly && inc.attackerAlly !== "None" ? `<span style="color:#a4b0be;">[${inc.attackerAlly}]</span>` : '';
                    
                    let timeDisplay = parseImpactTime(inc.impactTime, data.serverTime, data.utcOffset);

                    html += `
                    <div style="margin-bottom:8px; background: rgba(231, 76, 60, 0.1); border-left: 3px solid #e74c3c; padding: 6px; border-radius: 4px; font-size:11px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:5px;">
                                <div style="color:#2ed573; font-weight:bold; font-size:9px; letter-spacing:0.5px; margin-bottom:2px;">🛡️ DEFENDER</div>
                                <div>${dHtml} ${dAlly} <a href="${dUrl}" target="_blank" class="app-link" style="color:#f1f2f6; font-weight:600;">${inc.defenderIGN}</a></div>
                                <div style="overflow:hidden; text-overflow:ellipsis;"><a href="${vUrl}" target="_blank" class="app-link" style="color:#eccc68;">${inc.targetVillage}</a> <span style="color:#a4b0be;font-size:10px;">${inc.targetCoords}</span></div>
                            </div>
                            <div style="flex:1; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                <div style="color:#e74c3c; font-weight:bold; font-size:9px; letter-spacing:0.5px; margin-bottom:2px;">⚔️ ATTACKER</div>
                                <div>${aAlly} <a href="${aUrl}" target="_blank" class="app-link" style="color:#ff4757; font-weight:600;">${inc.attackerIGN}</a> ${aHtml}</div>
                                <div style="color:#f1c40f; font-family:monospace; margin-top:2px;">${inc.waves} waves</div>
                            </div>
                        </div>
                        <div style="text-align:right; font-size:10px; color:#a4b0be; border-top:1px solid rgba(255,255,255,0.05); padding-top:4px; margin-top:2px;">
                            ⏱️ Impact: <strong>${timeDisplay}</strong>
                        </div>
                    </div>`;
                });
                incContainer.innerHTML = `<div style="max-height: 250px; overflow-y: auto;">${html}</div>`;
            }
        }

        // Render Standing Def
        if (stdContainer) {
            if (!data.standing || data.standing.length === 0) {
                stdContainer.innerHTML = '<div style="font-size: 12px; color: #a4b0be; padding: 10px; text-align: center;">No active alerts</div>';
            } else {
                let html = '';
                data.standing.forEach(std => {
                    let cImg = getTribeImg(std.commanderTribe);
                    let cHtml = cImg ? `<img src="${cImg}" style="width:12px;height:12px;image-rendering:pixelated;vertical-align:middle;margin-right:2px;" title="${std.commanderTribe}">` : "";
                    let cUrl = std.commanderUid && std.commanderUid !== "0" ? `https://${hostname}/profile/${std.commanderUid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(std.commander)}`;
                    let cAlly = std.commanderAlly && std.commanderAlly !== "None" ? `<span style="color:#a4b0be;">[${std.commanderAlly}]</span>` : '';
                    
                    let vUrl = '#';
                    if (std.coords && std.coords.includes(',')) {
                        let pts = std.coords.split(',');
                        vUrl = `https://${hostname}/karte.php?x=${pts[0].trim()}&y=${pts[1].trim()}`;
                    }

                    let pct = 0;
                    if (std.goal > 0) {
                        pct = Math.min(100, Math.round((std.current / std.goal) * 100));
                    }
                    
                    let pColor = "#ff4757";
                    if (pct >= 100) pColor = "#2ed573";
                    else if (pct >= 50) pColor = "#f1c40f";

                    html += `
                    <div style="margin-bottom:8px; background: rgba(241, 196, 15, 0.1); border-left: 3px solid #f1c40f; padding: 6px; border-radius: 4px; font-size:11px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:5px;">
                                <div style="color:#f1c40f; font-weight:bold; font-size:9px; letter-spacing:0.5px; margin-bottom:2px;">🧱 COMMANDER</div>
                                <div>${cHtml} ${cAlly} <a href="${cUrl}" target="_blank" class="app-link" style="color:#f1f2f6; font-weight:600;">${std.commander}</a></div>
                            </div>
                            <div style="flex:1; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                <div style="color:#eccc68; font-weight:bold; font-size:9px; letter-spacing:0.5px; margin-bottom:2px;">📍 TARGET</div>
                                <div style="overflow:hidden; text-overflow:ellipsis;"><a href="${vUrl}" target="_blank" class="app-link" style="color:#eccc68;">${std.village}</a> <span style="color:#a4b0be;font-size:10px;">${std.coords}</span></div>
                            </div>
                        </div>
                        <div style="margin-top: 6px;">
                            <div style="display:flex; justify-content:space-between; font-size:9px; color:#a4b0be; margin-bottom:2px;">
                                <span>GARRISON</span>
                                <span>${std.current.toLocaleString()} / ${std.goal.toLocaleString()}</span>
                            </div>
                            <div style="width:100%; background:rgba(0,0,0,0.3); height:6px; border-radius:3px; overflow:hidden;">
                                <div style="width:${pct}%; background:${pColor}; height:100%; transition:width 0.3s;"></div>
                            </div>
                        </div>
                    </div>`;
                });
                stdContainer.innerHTML = `<div style="max-height: 250px; overflow-y: auto;">${html}</div>`;
            }
        }
    }

    // Bind open terminal
    const btnOpenAegis = document.getElementById('btn-open-aegis');
    if (btnOpenAegis) {
        btnOpenAegis.addEventListener('click', () => {
            let url = chrome.runtime.getURL('aegisTerminal.html');
            if (currentServerData && Object.keys(currentServerData).length > 0) {
                url += `?server=${Object.keys(currentServerData)[0]}`;
            }
            chrome.tabs.create({ url: url });
        });
    }

    function fetchWorldEvents() {
        const elGrowth = document.getElementById('world-events-growth');
        const elConquests = document.getElementById('world-events-conquests');
        const elDestroyed = document.getElementById('world-events-destroyed');
        if (!elGrowth) return;

        elGrowth.innerHTML = "Fetching global intelligence...";
        elConquests.innerHTML = "Fetching global intelligence...";
        elDestroyed.innerHTML = "Fetching global intelligence...";

        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
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
        
        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
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

        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
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
        
        let headers = [
            { id: 'ign', label: 'Player', filterable: true }
        ];
        data.headers.forEach((h, idx) => {
            headers.push({ id: `day_${idx}`, label: h, filterable: false });
        });
        headers.push({ id: 'total', label: 'Total', filterable: false });
        
        let formattedData = data.players.map(p => {
            let row = { ign: p.ign, uid: p.uid, tribe: p.tribe };
            let totalDiff = 0;
            p.history.forEach((d, idx) => {
                row[`day_${idx}`] = d;
                totalDiff += d;
            });
            row.total = totalDiff;
            return row;
        });
        
        // Sort by total descending
        formattedData.sort((a, b) => b.total - a.total);

        // Add a container for TableFilter
        elResults.innerHTML = `
            <div style="font-size:12px; margin-bottom:10px; color:#2ed573; display:flex; justify-content:space-between; align-items:center;">
                <span>Found <b>${data.players.length}</b> players for [${data.tag.toUpperCase()}]</span>
                <span title="Total column sums up the history for the evaluated timeframe. Filter players using the column header." style="cursor:help;">ℹ️</span>
            </div>
            <div id="alliance-matrix-table-container"></div>
        `;
        
        const renderRow = (row) => {
            let rowHtml = "";
            data.headers.forEach((h, idx) => {
                let d = row[`day_${idx}`] || 0;
                let statusClass = "status-inactive";
                if (d < 0) statusClass = "status-bleeding";
                else if (d > 0 && d <= 99) statusClass = "status-stagnant";
                else if (d >= 100) statusClass = "status-active";
                rowHtml += `<td class="${statusClass}" style="border: 1px solid rgba(255,255,255,0.05);">${d > 0 ? '+'+d : d}</td>`;
            });
            
            let totalClass = "status-inactive";
            if (row.total < 0) totalClass = "status-bleeding";
            else if (row.total > 0 && row.total <= 99) totalClass = "status-stagnant";
            else if (row.total >= 100) totalClass = "status-active";

            let pUrl = `https://${hostname}/profile/${row.uid}`;
            
            // Re-using the getTribeImg function defined in renderLeaderboards, or duplicating a compact version here:
            const getTribeImg = (tribe) => {
                if (!tribe) return "";
                let t = tribe.toLowerCase();
                if (t.includes('roman')) return 'assets/roman_medium.png';
                if (t.includes('gaul')) return 'assets/gaul_medium.png';
                if (t.includes('teuton')) return 'assets/teuton_medium.png';
                if (t.includes('egyptian')) return 'assets/egyptian_medium.png';
                if (t.includes('hun')) return 'assets/hun_medium.png';
                if (t.includes('spartan')) return 'assets/spartan_medium.png';
                return "";
            };
            
            let tribeImg = getTribeImg(row.tribe);
            let tribeHtml = tribeImg ? `<img src="${tribeImg}" style="width:14px;height:14px;image-rendering:pixelated;vertical-align:middle;margin-right:4px;">` : "";
            
            return `<tr>
                <td style="border: 1px solid rgba(255,255,255,0.05);"><div style="display:flex; align-items:center;">${tribeHtml}<a href="${pUrl}" target="_blank" class="app-link" style="font-weight:bold; color:#f1f2f6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:85px;" title="${row.ign}">${row.ign}</a></div></td>
                ${rowHtml}
                <td class="${totalClass}" style="font-weight:bold; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);">${row.total > 0 ? '+'+row.total : row.total}</td>
            </tr>`;
        };
        
        if (window.TableFilter) {
            new window.TableFilter('alliance-matrix-table-container', headers, formattedData, renderRow);
        } else {
            elResults.innerHTML += `<div style="color:#ff4757;">Error: TableFilter library not loaded.</div>`;
        }
    }

    function fetchChronosRadar() {
        const elResults = document.getElementById('chronos-radar-results');
        const x = document.getElementById('chronos-radar-x').value;
        const y = document.getElementById('chronos-radar-y').value;
        const radius = document.getElementById('chronos-radar-radius').value || 30;
        
        if (x === "" || y === "") { elResults.innerHTML = '<span style="color:#ff4757;">Enter X and Y.</span>'; return; }

        elResults.innerHTML = `Sweeping sector around (${x}|${y}) within ${radius} tiles...`;

        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
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

        chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
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

    function getActiveServerHostname(callback) {
        chrome.tabs.query({ url: ["*://*.travian.com/*", "*://*.international.travian.com/*"] }, (tabs) => {
            if (tabs && tabs.length > 0) {
                try {
                    const url = new URL(tabs[0].url);
                    if (url.hostname) {
                        callback(url.hostname);
                        return;
                    }
                } catch(e) {}
            }
            chrome.storage.local.get(['serverData'], (res) => {
                if (res.serverData && Object.keys(res.serverData).length > 0) {
                    callback(Object.keys(res.serverData)[0]);
                } else {
                    callback(null);
                }
            });
        });
    }

    // Mirror of loadMapStats() & loadAegisPanel(): restore cached Logistics UI + refresh timestamp on panel open
    function loadLogisticsPanel() {
        const lastUpdatedEl = document.getElementById('logistics-last-updated');
        const btnRefreshLogistics = document.getElementById('btn-refresh-logistics');
        chrome.storage.local.get(['logisticsDataCache', 'logisticsLastRefresh', 'logisticsUtcOffset', 'serverData'], (result) => {
            if (result.serverData) currentServerData = result.serverData;
            if (result.logisticsLastRefresh) {
                applyRefreshTimestamp(lastUpdatedEl, btnRefreshLogistics, result.logisticsLastRefresh, result.logisticsUtcOffset || "+01:00");
            } else if (lastUpdatedEl) {
                lastUpdatedEl.innerHTML = ``;
                if (btnRefreshLogistics) {
                    btnRefreshLogistics.style.background = 'rgba(231, 76, 60, 0.2)';
                    btnRefreshLogistics.style.color = '#e74c3c';
                }
            }

            if (result.logisticsDataCache && result.logisticsDataCache.hostname) {
                const cache = result.logisticsDataCache;
                renderLogisticsTitans(cache.titans || [], cache.hostname);
                renderLogisticsRequested(cache.requested || [], cache.hostname);
                renderLogisticsDebtors(cache.debtors || [], cache.hostname);
                updateLogisticsBubbles(cache.pushRequests || [], cache.activePushes || [], cache.role);
            } else {
                fetchLogisticsData();
            }
        });
    }

    // LOGISTICS MODULE SUB-PANEL & BADGES DATA ENGINE
    function fetchLogisticsData(fromRefresh) {
        const btn = document.getElementById('btn-refresh-logistics');
        const el = document.getElementById('logistics-last-updated');
        if (fromRefresh) {
            setRefreshBusy(btn, true);
            if (el) el.innerHTML = `Fetching...`;
        }

        getActiveServerHostname((hostname) => {
            if (!hostname) {
                markRefreshError(btn, el);
                return;
            }
            chrome.storage.local.get(['discordId'], (res) => {
                if (!res.discordId) {
                    markRefreshError(btn, el);
                    return;
                }
                let payload = [{ action: "logistics_get_data", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                    if (!rawText) {
                        markRefreshError(btn, el);
                        return;
                    }
                    let data = safeParseJSON(rawText);
                    if (data && data.status === "ok") {
                        const now = Date.now();
                        const utcOffset = data.utcOffset || "+01:00";

                        chrome.storage.local.set({
                            logisticsDataCache: { ...data, hostname: hostname },
                            logisticsLastRefresh: now,
                            logisticsUtcOffset: utcOffset
                        });

                        applyRefreshTimestamp(el, btn, now, utcOffset);

                        renderLogisticsTitans(data.titans || [], hostname);
                        renderLogisticsRequested(data.requested || [], hostname);
                        renderLogisticsDebtors(data.debtors || [], hostname);
                        updateLogisticsBubbles(data.pushRequests || [], data.activePushes || [], data.role);
                    } else {
                        markRefreshError(btn, el);
                    }
                });
            });
        });
    }

    function updateLogisticsBubbles(pushRequests, activePushes, role) {
        const reqBubble = document.getElementById('log-bubble-req');
        const actBubble = document.getElementById('log-bubble-act');

        const activeCount = (activePushes || []).length;
        const pendingCount = (pushRequests || []).length;

        // Orange Badge (Right): Active Pushes (visible to all)
        if (actBubble) {
            if (activeCount > 0) {
                actBubble.textContent = activeCount;
                actBubble.style.display = 'flex';
            } else {
                actBubble.style.display = 'none';
            }
        }

        // Red Badge (Left): Pending Requests (VISIBLE ONLY TO LEADERS)
        if (reqBubble) {
            if (role === "LEADER" && pendingCount > 0) {
                reqBubble.textContent = pendingCount;
                reqBubble.style.display = 'flex';
            } else {
                reqBubble.style.display = 'none';
            }
        }
    }

    function getTribeIconHtml(tribeStr) {
        if (!tribeStr) return '';
        let t = String(tribeStr).toLowerCase();
        let path = '';
        if (t.includes('roman')) path = 'assets/roman_medium.png';
        else if (t.includes('gaul')) path = 'assets/gaul_medium.png';
        else if (t.includes('teuton')) path = 'assets/teuton_medium.png';
        else if (t.includes('egyptian')) path = 'assets/egyptian_medium.png';
        else if (t.includes('hun')) path = 'assets/hun_medium.png';
        else if (t.includes('spartan')) path = 'assets/spartan_medium.png';
        if (!path) return '';
        return `<img src="${path}" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;" title="${tribeStr}">`;
    }

    function getPlayerProfileLink(ign, uid, hostname) {
        if (!ign) return '';
        let host = hostname || (logisticsDataCache && logisticsDataCache.hostname) || (currentServerData && Object.keys(currentServerData)[0]);
        let url = '#';
        if (host) {
            url = (uid && uid !== "0") ? `https://${host}/spieler.php?uid=${uid}` : `https://${host}/spieler.php?name=${encodeURIComponent(ign)}`;
        }
        return `<a href="${url}" target="_blank" class="travian-player-link">${ign}</a>`;
    }

    function getAllianceProfileLink(ally, aid, hostname) {
        if (!ally || ally === "UNK") return `<span style="color:#a4b0be; margin-right:4px;">[${ally || "UNK"}]</span>`;
        let host = hostname || (logisticsDataCache && logisticsDataCache.hostname) || (currentServerData && Object.keys(currentServerData)[0]);
        let url = '#';
        if (host) {
            url = (aid && aid !== "0") ? `https://${host}/allianz.php?aid=${aid}` : `https://${host}/allianz.php?tag=${encodeURIComponent(ally)}`;
        }
        return `<a href="${url}" target="_blank" class="travian-ally-link">[${ally}]</a>`;
    }

    function renderLogisticsTitans(titans, hostname) {
        const container = document.getElementById('logistics-titans-container');
        if (!container) return;
        if (titans.length === 0) {
            container.innerHTML = `<div style="font-size: 11px; color: #a4b0be; padding: 8px; text-align: center;">No donations recorded yet.</div>`;
            return;
        }
        let html = '';
        titans.forEach(t => {
            let rankEmoji = t.rank === 1 ? '🥇' : (t.rank === 2 ? '🥈' : (t.rank === 3 ? '🥉' : `#${t.rank}`));
            let tribeHtml = getTribeIconHtml(t.tribe);
            let playerLink = getPlayerProfileLink(t.ign, t.uid, hostname);
            let allyLink = getAllianceProfileLink(t.ally, t.aid, hostname);
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
                <div style="display:flex; align-items:center;">
                    <span style="font-weight:bold; color:#f1c40f; margin-right:6px; min-width:18px;">${rankEmoji}</span>
                    ${tribeHtml}
                    ${allyLink}
                    ${playerLink}
                </div>
                <div style="color:#2ed573; font-weight:bold;">${t.donated.toLocaleString()} 📦</div>
            </div>`;
        });
        container.innerHTML = html;
    }

    function renderLogisticsRequested(requested, hostname) {
        const container = document.getElementById('logistics-requested-container');
        if (!container) return;
        if (requested.length === 0) {
            container.innerHTML = `<div style="font-size: 11px; color: #a4b0be; padding: 8px; text-align: center;">No push requests fulfilled yet.</div>`;
            return;
        }
        let html = '';
        requested.forEach(r => {
            let tribeHtml = getTribeIconHtml(r.tribe);
            let playerLink = getPlayerProfileLink(r.ign, r.uid, hostname);
            let allyLink = getAllianceProfileLink(r.ally, r.aid, hostname);
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
                <div style="display:flex; align-items:center;">
                    <span style="color:#3498db; font-weight:bold; margin-right:6px; min-width:18px;">#${r.rank}</span>
                    ${tribeHtml}
                    ${allyLink}
                    ${playerLink}
                </div>
                <div style="color:#a4b0be;">
                    <span style="color:#2ed573; font-weight:bold;">${r.received.toLocaleString()}</span> / <span style="color:#e67e22;">${r.requested.toLocaleString()}</span> 📦
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }

    function renderLogisticsDebtors(debtors, hostname) {
        const container = document.getElementById('logistics-debtors-container');
        if (!container) return;
        if (debtors.length === 0) {
            container.innerHTML = `<div style="font-size: 11px; color: #2ed573; padding: 8px; text-align: center;">🟢 All active quotas are currently fulfilled.</div>`;
            return;
        }
        let html = '';
        debtors.forEach(d => {
            let skull = d.rank <= 3 ? '💀 ' : '';
            let tribeHtml = getTribeIconHtml(d.tribe);
            let playerLink = getPlayerProfileLink(d.ign, d.uid, hostname);
            let allyLink = getAllianceProfileLink(d.ally, d.aid, hostname);
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
                <div style="display:flex; align-items:center;">
                    <span style="color:#ff4757; font-weight:bold; margin-right:6px; min-width:18px;">${skull}#${d.rank}</span>
                    ${tribeHtml}
                    ${allyLink}
                    ${playerLink}
                </div>
                <div style="color:#ff4757; font-weight:bold;">-${d.pending.toLocaleString()} 📦</div>
            </div>`;
        });
        container.innerHTML = html;
    }

    // --- SITTERS MODULE SIDE PANEL ENGINE ---
    function loadSittersPanel() {
        const lastUpdatedEl = document.getElementById('sitters-last-updated');
        const btnRefreshSitters = document.getElementById('btn-refresh-sitters');
        chrome.storage.local.get(['sitterDataCache', 'sitterLastRefresh', 'sitterUtcOffset', 'serverData'], (result) => {
            if (result.serverData) currentServerData = result.serverData;
            if (result.sitterLastRefresh) {
                applyRefreshTimestamp(lastUpdatedEl, btnRefreshSitters, result.sitterLastRefresh, result.sitterUtcOffset || "+01:00");
            }
            if (result.sitterDataCache && result.sitterDataCache.hostname) {
                const cache = result.sitterDataCache;
                renderSitterMetrics(cache.stats || {});
                renderSitterMatrix(cache.players || [], cache.hostname);
            } else {
                fetchSitterData();
            }
        });
    }

    function fetchSitterData(fromRefresh) {
        const btn = document.getElementById('btn-refresh-sitters');
        const el = document.getElementById('sitters-last-updated');
        if (fromRefresh) {
            setRefreshBusy(btn, true);
            if (el) el.innerHTML = `Fetching...`;
        }

        chrome.tabs.query({ url: "*://*.travian.com/*" }, (tabs) => {
            if (!tabs || tabs.length === 0) return;
            const url = new URL(tabs[0].url);
            const hostname = url.hostname;

            chrome.storage.local.get(['discordId'], (res) => {
                if (!res.discordId) return;

                let payload = [{ action: "sitter_get_data", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                    if (fromRefresh) setRefreshBusy(btn, false);
                    if (!rawText) return;

                    let data = safeParseJSON(rawText);
                    if (!data) {
                        let params = { action: "sitter_get_data", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId };
                        chrome.runtime.sendMessage({ type: 'FETCH_GAS_GET', hostname: hostname, params: params }, (rawTextGet) => {
                            if (!rawTextGet) return;
                            let dataGet = safeParseJSON(rawTextGet);
                            if (dataGet && dataGet.status === "ok") {
                                const now = Date.now();
                                const utcOffset = dataGet.utcOffset || "+01:00";
                                applyRefreshTimestamp(el, btn, now, utcOffset);

                                chrome.storage.local.set({
                                    sitterDataCache: { ...dataGet, hostname: hostname },
                                    sitterLastRefresh: now,
                                    sitterUtcOffset: utcOffset
                                });

                                renderSitterMetrics(dataGet.stats || {});
                                renderSitterMatrix(dataGet.players || [], hostname);
                            }
                        });
                        return;
                    }

                    if (data && data.status === "ok") {
                        const now = Date.now();
                        const utcOffset = data.utcOffset || "+01:00";
                        applyRefreshTimestamp(el, btn, now, utcOffset);

                        chrome.storage.local.set({
                            sitterDataCache: { ...data, hostname: hostname },
                            sitterLastRefresh: now,
                            sitterUtcOffset: utcOffset
                        });

                        renderSitterMetrics(data.stats || {});
                        renderSitterMatrix(data.players || [], hostname);
                    }
                });
            });
        });
    }

    function renderSitterMetrics(stats) {
        const elSecure = document.getElementById('sitter-count-secure');
        const elAtRisk = document.getElementById('sitter-count-atrisk');
        const elCritical = document.getElementById('sitter-count-critical');
        const elProxy = document.getElementById('sitter-count-proxy');

        if (elSecure) elSecure.textContent = (stats.secure !== undefined ? stats.secure : 0);
        if (elAtRisk) elAtRisk.textContent = (stats.atRisk !== undefined ? stats.atRisk : 0);
        if (elCritical) elCritical.textContent = (stats.critical !== undefined ? stats.critical : 0);
        if (elProxy) elProxy.textContent = (stats.proxy !== undefined ? stats.proxy : 0);
    }

    function renderSitterMatrix(players, hostname) {
        const container = document.getElementById('sitters-matrix-container');
        if (!container) return;
        if (!players || players.length === 0) {
            container.innerHTML = `<div style="font-size: 11px; color: #a4b0be; padding: 10px; text-align: center;">No operative sitter data available.</div>`;
            return;
        }

        let html = '';
        players.forEach(p => {
            let tribeHtml = getTribeIconHtml(p.tribe);
            let allyLink = getAllianceProfileLink(p.ally, p.aid || "0", hostname);
            let playerLink = getPlayerProfileLink(p.ign, p.uid || "0", hostname);

            let sitsHtml = [];
            if (p.isProxy) {
                sitsHtml.push('<span style="color:#a4b0be;font-size:11px;">Dual/Proxy</span>');
            } else {
                if (p.s1) {
                    let s1Link = getPlayerProfileLink(p.s1, p.s1Uid || "0", hostname);
                    sitsHtml.push(s1Link);
                }
                if (p.s2) {
                    let s2Link = getPlayerProfileLink(p.s2, p.s2Uid || "0", hostname);
                    sitsHtml.push(s2Link);
                }
            }
            let sittersStr = sitsHtml.length > 0 ? sitsHtml.join(' | ') : '<span style="color:#e74c3c;font-size:11px;">None ⚠️</span>';
            let covStr = p.covDisplay ? `<span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-size:10px; color:#f1c40f; margin-right:6px;">${p.covDisplay}</span>` : '';

            // User Rule: TRIBE + [ALLY] + IGN order!
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                    <span style="font-size:13px; margin-right:4px;">${p.statusIcon}</span>
                    ${tribeHtml}
                    ${allyLink}
                    ${playerLink}
                </div>
                <div style="display:flex; align-items:center; text-align:right;">
                    ${covStr}
                    <div style="font-size:11px;">
                        <span style="color:#a4b0be; font-size:10px;">Sitted By: </span>${sittersStr}
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }

    // ⏱️ PERIODIC BACKGROUND AUTO-REFRESH FOR DEF & LOGISTICS BADGE NOTIFICATIONS (Every 30 seconds)
    setInterval(() => {
        fetchLogisticsData(false);
        fetchSitterData(false);
        if (typeof fetchAegisTop10 === 'function') fetchAegisTop10(false);
    }, 30000);

    // --- STATISTICS MODULE ENGINE ---
    function loadStatsPanel() {
        const lastUpdatedEl = document.getElementById('stats-last-updated');
        const btnRefreshStats = document.getElementById('btn-refresh-stats');
        chrome.storage.local.get(['statsDataCache', 'statsLastRefresh', 'statsUtcOffset', 'serverData'], (result) => {
            if (result.serverData) currentServerData = result.serverData;
            if (result.statsLastRefresh) {
                applyRefreshTimestamp(lastUpdatedEl, btnRefreshStats, result.statsLastRefresh, result.statsUtcOffset || "+01:00");
            }
            if (result.statsDataCache && result.statsDataCache.hostname && (result.statsDataCache.top10 || result.statsDataCache.top5)) {
                const cache = result.statsDataCache;
                renderConfedOverview(cache.confed || {});
                renderFactionBreakdown(cache.factions || [], cache.hostname);
                renderTop10Comparison(cache.top10 || cache.top5 || [], cache.hostname);
            } else {
                fetchStatsOverview(false);
            }
        });
    }

    function fetchStatsOverview(fromRefresh) {
        const btn = document.getElementById('btn-refresh-stats');
        const el = document.getElementById('stats-last-updated');
        if (fromRefresh) {
            setRefreshBusy(btn, true);
            if (el) el.innerHTML = `Fetching...`;
        }

        chrome.tabs.query({ url: "*://*.travian.com/*" }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                if (fromRefresh) setRefreshBusy(btn, false);
                return;
            }
            const url = new URL(tabs[0].url);
            const hostname = url.hostname;

            chrome.storage.local.get(['discordId'], (res) => {
                let payload = [{ action: "stats_get_overview", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId || "unknown" }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                    if (fromRefresh) setRefreshBusy(btn, false);
                    if (!rawText) {
                        if (fromRefresh) markRefreshError(btn, el);
                        return;
                    }

                    let data = safeParseJSON(rawText);
                    if (data && data.status === "ok") {
                        const now = Date.now();
                        const utcOffset = data.utcOffset || "+01:00";
                        applyRefreshTimestamp(el, btn, now, utcOffset);

                        chrome.storage.local.set({
                            statsDataCache: { ...data, hostname: hostname },
                            statsLastRefresh: now,
                            statsUtcOffset: utcOffset
                        });

                        renderConfedOverview(data.confed || {});
                        renderFactionBreakdown(data.factions || [], hostname);
                        renderTop10Comparison(data.top10 || data.top5 || [], hostname);
                    } else {
                        if (fromRefresh) markRefreshError(btn, el);
                    }
                });
            });
        });
    }

    function renderConfedOverview(c) {
        const el = document.getElementById('stats-confed-overview');
        if (!el) return;
        if (!c || c.members === undefined) {
            el.innerHTML = "<div style='padding:8px; text-align:center;'>No overview metrics available.</div>";
            return;
        }
        el.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:6px; font-size:12px;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                    <span>👥 <b>Members:</b></span> <span style="color:#fff; font-weight:700;">${(c.members || 0).toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                    <span>📈 <b>Total Pop:</b></span> <span style="color:#2ed573; font-weight:700;">${(c.totalPop || 0).toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                    <span>🏠 <b>Villages:</b></span> <span style="color:#eccc68; font-weight:700;">${(c.villages || 0).toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                    <span>📊 <b>Avg Pop/Member:</b></span> <span style="color:#70a1ff; font-weight:700;">${(c.avgPop || 0).toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                    <span>🎯 <b>Core Coords:</b></span> <span style="color:#fff; font-weight:700;">(${c.cx || 0}, ${c.cy || 0})</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                    <span>🕸️ <b>Spread:</b></span> <span style="color:#ff7675; font-weight:700;">${c.spread || "0.0"} tiles</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>🏆 <b>Core Server Rank:</b></span> <span style="color:#f1c40f; font-weight:800;">#${c.coreRank || 1}</span>
                </div>
            </div>
        `;
    }

    function renderFactionBreakdown(factions, hostname) {
        const el = document.getElementById('stats-faction-breakdown');
        if (!el) return;
        if (!factions || factions.length === 0) {
            el.innerHTML = "<div style='padding:8px; text-align:center;'>No faction data found.</div>";
            return;
        }

        let html = "";
        factions.forEach(f => {
            const allyLink = getAllianceProfileLink(f.tag, f.aid, hostname);
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding:6px 0; font-size:12px;">
                    <div>
                        ${allyLink}
                    </div>
                    <div style="display:flex; gap:10px; font-size:11px;">
                        <span>👥 <b>${(f.members || 0).toLocaleString()}</b></span>
                        <span style="color:#2ed573;">📈 <b>${(f.pop || 0).toLocaleString()} Pop</b></span>
                        <span>🎯 <b>(${f.cx || 0}, ${f.cy || 0})</b></span>
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    }

    function renderTop5Comparison(topList, hostname) {
        renderTop10Comparison(topList, hostname);
    }

    function renderTop10Comparison(topList, hostname) {
        const el = document.getElementById('stats-top5-comparison');
        if (!el) return;
        if (!topList || topList.length === 0) {
            el.innerHTML = "<div style='padding:8px; text-align:center;'>No top 10 data found.</div>";
            return;
        }

        let html = "";
        topList.forEach(t => {
            const allyLink = getAllianceProfileLink(t.tag, t.aid, hostname);
            let medal = `#${t.rank}`;
            if (t.rank === 1) medal = "🥇 #1";
            else if (t.rank === 2) medal = "🥈 #2";
            else if (t.rank === 3) medal = "🥉 #3";

            html += `
                <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:8px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:12px;">
                        <span style="font-weight:700; color:#fff;">${medal} ${allyLink}</span>
                        <span style="color:#2ed573; font-weight:700;">📈 ${(t.pop || 0).toLocaleString()} Pop</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#a4b0be;">
                        <span>👤 <b>${(t.avgPop || 0).toLocaleString()} Ø/Usr</b></span>
                        <span>🎯 <b>(${t.cx || 0}, ${t.cy || 0})</b></span>
                        <span>🕸️ <b>${t.spread || "0.0"}</b></span>
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    }

});

