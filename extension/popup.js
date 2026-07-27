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
    const mainUi = document.getElementById('main-ui');
    const downloadBtn = document.getElementById('btn-discord');
    
    const toggleHud = document.getElementById('toggle-hud');
    const hudStatusText = document.getElementById('hud-status-text');

    // Panel Elements
    const body = document.body;
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    const sidePanel = document.getElementById('side-panel');
    const btnToggleLeftPanel = document.getElementById('btn-toggle-left-panel');
    const leftPanel = document.getElementById('left-panel');
    const btnCloseLeftPanel = document.getElementById('btn-close-left-panel');
    
    const btnRefresh = document.getElementById('btn-refresh');
    const serverListContainer = document.getElementById('server-list-container');
    const leaderboardsContainer = document.getElementById('leaderboards-container');
    const tableOwnership = document.getElementById('table-ownership');
    const tableScanners = document.getElementById('table-scanners');

    let currentServerData = {};

    // Load saved settings
    chrome.storage.local.get(['discordId', 'discordUser', 'engineActive', 'hudActive', 'sessionTiles', 'killSwitch', 'verifiedServers', 'serverData'], (result) => {
        if (result.killSwitch) {
            killScreen.classList.remove('hidden');
            mainUi.classList.add('hidden');
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
            renderServerList();
        }
    });

    function updateBodyWidth(rightVisible) {
        let w = 320;
        if (rightVisible) w += 320;
        body.style.width = w + 'px';
    }

    let leftOpen = false;
    let rightOpen = false;

    // Toggle Right Panel
    btnTogglePanel.addEventListener('click', () => {
        if (!rightOpen) {
            sidePanel.classList.remove('hidden');
            rightOpen = true;
            btnTogglePanel.textContent = "❮";
            updateBodyWidth(rightOpen);
        } else {
            rightOpen = false;
            btnTogglePanel.textContent = "❯";
            updateBodyWidth(rightOpen);
            setTimeout(() => sidePanel.classList.add('hidden'), 300);
        }
    });

    // Toggle Left Panel
    btnToggleLeftPanel.addEventListener('click', () => {
        if (!leftOpen) {
            leftPanel.classList.add('open');
            leftOpen = true;
        } else {
            leftPanel.classList.remove('open');
            leftOpen = false;
        }
    });

    const btnOpenSidepanel = document.getElementById('btn-open-sidepanel');
    if (btnOpenSidepanel) {
        btnOpenSidepanel.addEventListener('click', () => {
            chrome.windows.getCurrent((currentWindow) => {
                chrome.sidePanel.open({ windowId: currentWindow.id });
                window.close(); // Close the popup after opening the side panel
            });
        });
    }

    btnCloseLeftPanel.addEventListener('click', () => {
        if (leftOpen) {
            leftPanel.classList.remove('open');
            leftOpen = false;
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
    
    btnRefresh.addEventListener('click', () => {
        chrome.storage.local.get(['discordId'], (result) => {
            const id = result.discordId;
            if (id) {
                serverListContainer.innerHTML = "<p style='color:#a4b0be; font-size:11px;'>Refreshing status...</p>";
                triggerVerificationSweep(id);
            }
        });
    });

    function triggerVerificationSweep(discordId) {
        chrome.runtime.sendMessage({ type: 'VERIFY_IDENTITY', discordId: discordId }, (response) => {
            if (response && response.status === "KILL") {
                killScreen.classList.remove('hidden');
                mainUi.classList.add('hidden');
                return;
            }
            if (response && response.serverData) {
                currentServerData = response.serverData;
                renderServerList();
                
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

    function renderServerList() {
        serverListContainer.innerHTML = "";
        leaderboardsContainer.classList.add('hidden');
        
        const hostnames = Object.keys(currentServerData);
        if (hostnames.length === 0) {
            serverListContainer.innerHTML = "<p style='color:#ff4757; font-size:11px;'>Not verified on any server.</p>";
            return;
        }

        hostnames.forEach((hostname, index) => {
            const data = currentServerData[hostname];
            const div = document.createElement('div');
            div.className = "server-item" + (index === 0 ? " active" : "");
            
            // Format hostname like cw.x2 or ts1.x1
            const shortName = hostname.split('.international.travian.com')[0].toUpperCase();
            
            let discordLinkHtml = "";
            // We can map server hostnames to their Discord invite links
            if (hostname.includes("cw.x2")) {
                discordLinkHtml = `<a href="https://discord.gg/SZAYSmZdCs" target="_blank" title="Join Server Discord" class="server-discord-link"><img src="assets/DiscordIcon.png" alt="Discord" class="server-discord-icon"></a>`;
            }

            div.innerHTML = `
                <div class="server-name-container">
                    <div class="server-name">${shortName}</div>
                    ${discordLinkHtml}
                </div>
                <div class="server-status">
                    <span>${data.ign}</span>
                    <span><strong style="color:#eccc68">${data.scannedTiles.toLocaleString()}</strong> Scans</span>
                </div>
            `;
            
            div.addEventListener('click', () => {
                document.querySelectorAll('.server-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                renderLeaderboards(hostname, data);
            });
            
            serverListContainer.appendChild(div);
            
            if (index === 0) {
                renderLeaderboards(hostname, data);
            }
        });
        
        updateActiveGameStatus();
    }
    
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

    discordJoinBtn.addEventListener('click', () => {
        window.open('https://discord.gg/pdpVR69Vf6', '_blank');
    });
    
    downloadBtn.addEventListener('click', () => {
        window.open('https://discord.gg/pdpVR69Vf6', '_blank');
    });

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
        const statusEl = document.getElementById('active-game-status');
        if (!statusEl) return;
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    if (url.hostname.includes('travian.com')) {
                        const shortName = url.hostname.split('.international.travian.com')[0].toUpperCase();
                        if (currentServerData && currentServerData[url.hostname]) {
                            statusEl.innerHTML = `<span style="color: #2ed573;">🟢 ${shortName} (Connected)</span>`;
                        } else {
                            statusEl.innerHTML = `<span style="color: #ff4757;">🔴 ${shortName} (Unregistered)</span>`;
                        }
                    } else {
                        statusEl.textContent = "No active game detected";
                    }
                } catch (e) {
                    statusEl.textContent = "No active game detected";
                }
            } else {
                statusEl.textContent = "No active game detected";
            }
        });
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
            renderServerList(); // This re-renders everything including leaderboards!
        }
    });
});
