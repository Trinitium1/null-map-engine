// background.js

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ killSwitch: false });
});

// Memory Cache: A Map to ensure we only store the latest state of a coordinate
let cachedTiles = new Map();
let sessionTilesCount = 0;
// We will fetch servers.json dynamically on each request to avoid service worker caching issues.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROCESS_MAP_DATA') {
        processRawTiles(message.payload, message.ign);
    } else if (message.type === 'FLUSH_CACHE') {
        flushCache(message.hostname);
    } else if (message.type === 'VERIFY_IDENTITY') {
        runVerificationSweep(message.discordId).then(sendResponse);
        return true; // Keep message channel open for async
    } else if (message.type === 'FETCH_GAS') {
        fetch(chrome.runtime.getURL('servers.json'))
            .then(response => response.json())
            .then(serversConfig => {
                const webhookUrl = serversConfig[message.hostname];
                if (!webhookUrl) {
                    console.error(`[FETCH_GAS] No webhook URL for hostname: ${message.hostname}`);
                    sendResponse(null);
                    return;
                }
                
                fetch(webhookUrl, {
                    method: 'POST',
                    credentials: 'omit',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(message.payload)
                })
                .then(r => r.text())
                .then(sendResponse)
                .catch(err => {
                    console.error("FETCH_GAS error:", err);
                    sendResponse(null);
                });
            })
            .catch(err => {
                console.error("Error loading servers.json:", err);
                sendResponse(null);
            });
        return true; // async
    } else if (message.type === 'FETCH_GAS_GET') {
        // GET request to the GAS doGet endpoint (used by Troops Analyzer)
        fetch(chrome.runtime.getURL('servers.json'))
            .then(response => response.json())
            .then(serversConfig => {
                const baseUrl = serversConfig[message.hostname];
                if (!baseUrl) { sendResponse(null); return; }
                const params = new URLSearchParams(message.params || {});
                fetch(`${baseUrl}?${params.toString()}`, { method: 'GET', credentials: 'omit' })
                    .then(r => r.text())
                    .then(sendResponse)
                    .catch(err => { console.error("FETCH_GAS_GET error:", err); sendResponse(null); });
            })
            .catch(err => { console.error("Error loading servers.json:", err); sendResponse(null); });
        return true;
    } else if (message.type === 'UPDATE_BADGE') {
        updateBadgeState();
    } else if (message.type === 'UPDATE_ICON_COLOR') {
        if (message.color === 'green') drawCustomBadge("#2ed573");
        else if (message.color === 'red') drawCustomBadge("#ff4757");
        else drawCustomBadge("#747d8c");
    }
});

// Update badge when tabs change (even if sidepanel is closed)
chrome.tabs.onActivated.addListener(evaluateTabForBadge);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const currentUrl = changeInfo.url || tab.url;
    if (currentUrl) evaluateTabForBadge();
});

// Intercept Discord OAuth redirect IMMEDIATELY before Chrome tries to resolve the DNS
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    const redirectUri = chrome.identity.getRedirectURL();
    if (details.url.startsWith(redirectUri)) {
        // Close the auth tab instantly to prevent the 20-second DNS timeout hang
        chrome.tabs.remove(details.tabId).catch(()=>{});

        const url = new URL(details.url);
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            fetch('https://discord.com/api/v10/users/@me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            .then(res => res.json())
            .then(user => {
                if (user.id) {
                    const userObj = { id: user.id, username: user.username, avatar: user.avatar };
                    chrome.storage.local.set({ discordId: user.id, discordUser: userObj }, () => {
                        runVerificationSweep(user.id).then((result) => {
                            if (result && result.serverData) {
                                chrome.runtime.sendMessage({ action: "refreshLeaderboards", serverData: result.serverData }).catch(() => {});
                            }
                            if (result && result.status && result.status !== "OK" && result.status !== "KILL") {
                                chrome.runtime.sendMessage({ action: "authError", status: result.status, msg: result.msg, hostname: result.hostname }).catch(() => {});
                            }
                        });
                    });
                }
            })
            .catch(err => console.error("Discord auth fetch error:", err));
        }
    }
});

function evaluateTabForBadge() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                if (url.hostname.includes('travian.com')) {
                    chrome.storage.local.get(['serverData', 'engineActive', 'killSwitch'], (result) => {
                        if (result.killSwitch) {
                            drawCustomBadge("#ff4757");
                            return;
                        }
                        if (result.engineActive === false) {
                            drawCustomBadge("#ff4757");
                            return;
                        }
                        if (result.serverData && result.serverData[url.hostname]) {
                            drawCustomBadge("#2ed573"); // Connected & Registered
                        } else {
                            drawCustomBadge("#ff4757"); // Connected but Unregistered
                        }
                    });
                } else {
                    drawCustomBadge("#747d8c"); // Not on Travian
                }
            } catch (e) {
                drawCustomBadge("#747d8c");
            }
        } else {
            drawCustomBadge("#747d8c");
        }
    });
}

async function drawCustomBadge(colorHex) {
    try {
        // Clear the default text badge completely
        chrome.action.setBadgeText({ text: "" });

        const offscreen = new OffscreenCanvas(128, 128);
        offscreen.width = 128;
        offscreen.height = 128;
        const ctx = offscreen.getContext('2d');
        
        const response = await fetch('/assets/icon128.png');
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        ctx.clearRect(0, 0, 128, 128);
        ctx.drawImage(bitmap, 0, 0, 128, 128);
        
        // Draw a neat, small dot in the bottom right corner
        ctx.beginPath();
        ctx.arc(104, 104, 20, 0, 2 * Math.PI, false); // Tiny 20px circle on 128px canvas
        ctx.fillStyle = colorHex;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1e272e'; // Dark border to make it pop against the logo
        ctx.stroke();

        const imageData = ctx.getImageData(0, 0, 128, 128);
        chrome.action.setIcon({ imageData: imageData });
    } catch (e) {
        console.error("Failed to draw custom badge", e);
    }
}

function updateBadgeState() {
    chrome.storage.local.get(['verifiedServers', 'engineActive', 'killSwitch'], (result) => {
        if (result.killSwitch) {
            drawCustomBadge("#ff4757"); // Red
            return;
        }

        const isVerified = result.verifiedServers && Object.keys(result.verifiedServers).length > 0;

        if (!isVerified) {
            drawCustomBadge("#747d8c"); // Grey
        } else if (result.engineActive === false) {
            drawCustomBadge("#ff4757"); // Red
        } else {
            drawCustomBadge("#2ed573"); // Green
        }
    });
}

async function runVerificationSweep(discordId) {
    let verifiedServers = {};
    let serverData = {};
    const version = chrome.runtime.getManifest().version;

    let serversConfig;
    try {
        const res = await fetch(chrome.runtime.getURL('servers.json'));
        serversConfig = await res.json();
    } catch (e) {
        console.error("Failed to fetch servers.json in runVerificationSweep", e);
        return { verifiedServers: {}, serverData: {} };
    }

    for (const [hostname, webhookUrl] of Object.entries(serversConfig)) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                credentials: 'omit',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify([{ action: "verify", discordId: discordId, extVersion: version }])
            });
            
            // To debug HTML errors, we can read as text first
            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (jsonErr) {
                console.error(`Verification failed for ${hostname}: Expected JSON but got:`, rawText.substring(0, 100));
                continue; // Skip this server
            }
            
            if (data.status === "KILL") {
                chrome.storage.local.set({ killSwitch: true });
                updateBadgeState();
                return { status: "KILL" };
            }
            if (data.status === "VERIFIED" || data.status === "OK") {
                verifiedServers[hostname] = true;
                serverData[hostname] = data;
                chrome.storage.local.remove('authError');
            } else if (data.status === "NOT_CONFEDERATION" || data.status === "NOT_VERIFIED" || data.status === "NOT_REGISTERED" || data.status === "UNREGISTERED") {
                // Persist denial + clear any stale "connected" cache for this host
                delete verifiedServers[hostname];
                delete serverData[hostname];
                chrome.storage.local.set({
                    authError: { status: data.status, msg: data.msg, hostname: hostname },
                    verifiedServers: verifiedServers,
                    serverData: serverData
                });
                updateBadgeState();
                chrome.runtime.sendMessage({
                    action: "authError",
                    status: data.status,
                    msg: data.msg,
                    hostname: hostname
                }).catch(() => {});
                return { status: data.status, msg: data.msg || data.status, hostname: hostname, serverData, verifiedServers };
            }
        } catch (e) {
            console.error(`Verification failed for ${hostname}:`, e);
        }
    }

    chrome.storage.local.set({ verifiedServers: verifiedServers, serverData: serverData });
    updateBadgeState();
    chrome.runtime.sendMessage({ action: "refreshLeaderboards", serverData: serverData }).catch(() => {});
    return { verifiedServers, serverData, status: "OK" };
}

// Initial badge set
updateBadgeState();

function processRawTiles(tiles, ign) {
    tiles.forEach(tile => {
        if (!tile || !tile.position) return;

        const x = tile.position.x;
        const y = tile.position.y;
        // Generate a unique coordinate key for the cache Map
        const coordKey = `${x},${y}`;

        let parsedData = null;
        const title = tile.title || "";
        const text = tile.text || "";

        const regionData = extractRegionData(text);

        try {
            // 1. Village
            if (title.includes("{k.dt}")) {
                parsedData = {
                    type: "village",
                    x: x,
                    y: y,
                    p: extractValue(text, "{k.spieler}"),
                    pop: parseInt(extractValue(text, "{k.einwohner}")) || 0,
                    a: extractValue(text, "{k.allianz}"),
                    t: extractTribe(text),
                    uid: tile.uid || tile.u || null,
                    aid: tile.aid || tile.a || null,
                    v: extractVillageName(text),
                    vid: tile.did || tile.d || tile.id || null,
                    isCapital: isCapital(text),
                    isCity: isCity(text),
                    isHarbor: isHarbor(text),
                    status: extractStatus(text),
                    region: regionData.region,
                    effect: regionData.effect,
                    scannedBy: ign
                };
            }
            // 2. Unoccupied Oasis
            else if (title.includes("{k.fo}")) {
                parsedData = {
                    type: "oasis_free",
                    x: x,
                    y: y,
                    bonus: extractBonuses(text),
                    oasisType: extractOasisType(title),
                    animals: extractAnimals(text),
                    region: regionData.region,
                    effect: regionData.effect,
                    scannedBy: ign
                };
            }
            // 3. Occupied Oasis (Annexed)
            else if (title.includes("{k.bt}")) {
                parsedData = {
                    type: "oasis_occupied",
                    x: x,
                    y: y,
                    p: extractValue(text, "{k.spieler}"),
                    a: extractValue(text, "{k.allianz}"),
                    uid: tile.uid || tile.u || null,
                    aid: tile.aid || tile.a || null,
                    bonus: extractBonuses(text),
                    oasisType: extractOasisType(title),
                    region: regionData.region,
                    effect: regionData.effect,
                    scannedBy: ign
                };
            }
            // 4. Wilderness (Empty Valley - Settelable)
            else {
                parsedData = {
                    type: "wilderness",
                    x: x,
                    y: y,
                    region: regionData.region,
                    effect: regionData.effect,
                    scannedBy: ign
                };
                const terr = extractTerrain(title) || extractTerrain(text);
                if (terr) {
                    parsedData.terrain = terr.code;
                    parsedData.dist = terr.dist;
                }
            }

            // If we successfully parsed something interesting, store it.
            // This will overwrite older data for the same coordinate in this session.
            if (parsedData) {
                cachedTiles.set(coordKey, parsedData);
            }

        } catch (e) {
            console.error("Error parsing tile:", tile, e);
        }
    });
    
    // Broadcast real-time updates to the HUD
    let currentTotal = sessionTilesCount + cachedTiles.size;
    chrome.runtime.sendMessage({ action: "updateTiles", count: currentTotal }).catch(() => {});
    chrome.tabs.query({url: "*://*.travian.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "updateTiles", count: currentTotal }).catch(() => {});
        });
    });
}

function flushCache(hostname) {
    if (cachedTiles.size === 0) return;

    // Convert Map to array
    const payloadArray = Array.from(cachedTiles.values());
    console.log(`[NULL Map Engine] Flushing ${payloadArray.length} tiles for ${hostname}...`);
    
    const count = payloadArray.length;
    sessionTilesCount += count;
    chrome.storage.local.set({ sessionTiles: sessionTilesCount });
    chrome.runtime.sendMessage({ action: "updateTiles", count: sessionTilesCount }).catch(() => {});
    chrome.tabs.query({url: "*://*.travian.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "updateTiles", count: sessionTilesCount }).catch(() => {});
        });
    });

    // Clear cache immediately so we don't double-send if flush is triggered multiple times
    cachedTiles.clear();

    fetch(chrome.runtime.getURL('servers.json'))
        .then(response => response.json())
        .then(serversConfig => {
            const webhookUrl = serversConfig[hostname];
            if (!webhookUrl) {
                console.warn(`[NULL Map Engine] Unsupported server: ${hostname}`);
                return;
            }

            chrome.storage.local.get(['discordId', 'killSwitch'], (result) => {
                if (result.killSwitch) return;
                const discordId = result.discordId || "Unknown";

                // Inject discordId and extension version into payload
                const version = chrome.runtime.getManifest().version;
                const enrichedPayload = payloadArray.map(tile => {
                    tile.discordId = discordId;
                    tile.extVersion = version;
                    return tile;
                });

                fetch(webhookUrl, {
                    method: 'POST',
                    credentials: 'omit',
                    // Allow CORS so we can read the version check from the server response
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Avoid preflight by using text/plain
                    body: JSON.stringify(enrichedPayload)
                })
                .then(response => response.text())
                .then(rawText => {
                    try {
                        const data = JSON.parse(rawText);
                        if (data.status === "KILL") {
                            chrome.storage.local.set({ killSwitch: true });
                            chrome.runtime.sendMessage({ action: "killSwitchTriggered" }).catch(() => {});
                        } else if (data.status === "UNREGISTERED") {
                            console.warn("Unregistered discord ID mapping for: ", discordId);
                        } else if (data.status && data.status.toLowerCase() === "ok") {
                            console.log(`[NULL Map Engine] Flushed successfully. Status: ${data.status}`);
                            // Update leaderboards automatically after sending new map data!
                            runVerificationSweep(discordId).then((result) => {
                                if (result && result.serverData) {
                                    chrome.runtime.sendMessage({ action: "refreshLeaderboards", serverData: result.serverData }).catch(() => {});
                                }
                            });
                        } else {
                            console.log(`[NULL Map Engine] Flushed with unknown status: ${data.status}`);
                        }
                    } catch (jsonErr) {
                        console.error(`Flush failed for ${hostname}: Expected JSON but got:`, rawText.substring(0, 100));
                    }
        })
        .catch(err => console.error("Error sending to GAS:", err));
    });
})
.catch(err => {
    console.error("[NULL Map Engine] Failed to load servers.json", err);
});
}

// --- Helper Extractors ---

function extractValue(text, key) {
    // Looks for "{key} Value<br />"
    // e.g. "{k.spieler} Trinitium<br />" -> "Trinitium"
    const regex = new RegExp(key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "\\s*([^<]+)<br \\/>");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}

function extractTribe(text) {
    const match = text.match(/{k\.volk}\s*{a\.v(\d)}/);
    if (!match) return "Unknown";
    const tMap = {
        "1": "Romans", "2": "Teutons", "3": "Gauls",
        "4": "Nature", "5": "Natars", "6": "Egyptians",
        "7": "Huns", "8": "Spartans"
    };
    return tMap[match[1]] || "Unknown";
}

function extractBonuses(text) {
    // Looks for "{a:r4} {a.r4} 50%"
    const bonuses = [];
    const regex = /{a\.r(\d)}\s*(\d+)%/g;
    let match;
    const resMap = { "1": "Wood", "2": "Clay", "3": "Iron", "4": "Crop" };
    while ((match = regex.exec(text)) !== null) {
        bonuses.push(`${resMap[match[1]]} ${match[2]}%`);
    }
    return bonuses.join(", ");
}

function extractAnimals(text) {
    // Looks for: <i class="unit u31"></i><span class="value ">26</span>
    const animals = [];
    const regex = /<i class="unit u(\d{2})"><\/i><span class="value(?:.*?)">(\d+)<\/span>/g;
    let match;
    const aMap = {
        "31": "Rats", "32": "Spiders", "33": "Snakes", "34": "Bats",
        "35": "Wild Boars", "36": "Wolves", "37": "Bears", "38": "Crocodiles",
        "39": "Tigers", "40": "Elephants"
    };
    while ((match = regex.exec(text)) !== null) {
        animals.push(`${aMap[match[1]] || "u" + match[1]}:${match[2]}`);
    }
    return animals.join(", ");
}

function extractRegionData(text) {
    const regionMatch = text.match(/{k\.regionTooltip}\s*([^<]+)<br \/>/);
    if (!regionMatch) return { region: null, effect: null };
    
    const regionName = regionMatch[1].trim();
    
    // Now try to find if there is an effect line immediately after.
    const effectMatch = text.match(new RegExp("{k\\.regionTooltip}\\s*" + regionName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "<br \\/>([^<]+)<br \\/>"));
    
    let effectName = null;
    if (effectMatch) {
        const potentialEffect = effectMatch[1].trim();
        // If it starts with &#x202d; or contains coordinate HTML, it's not an effect.
        if (!potentialEffect.startsWith("&#x202d;") && !potentialEffect.includes("coordinate")) {
            effectName = potentialEffect;
        }
    }
    
    return { region: regionName, effect: effectName };
}

const TERRAIN_MAP = {
    "f1": "3-3-3-9", "f2": "3-4-5-6", "f3": "4-4-4-6", "f4": "4-5-3-6",
    "f5": "5-3-4-6", "f6": "1-1-1-15", "f7": "4-4-3-7", "f8": "3-4-4-7",
    "f9": "4-3-4-7", "f10": "3-5-4-6", "f11": "4-3-5-6", "f12": "5-4-3-6",
    "f99": "Natar WW"
};

function extractTerrain(textString) {
    if (!textString) return null;
    const match = textString.match(/{k\.f(\d+)}/);
    if (match) {
        const code = `f${match[1]}`;
        return { code: code, dist: TERRAIN_MAP[code] || null };
    }
    
    // Fallback if translated
    const fallbackMatch = textString.match(/(\d+-\d+-\d+-\d+)/);
    if (fallbackMatch) {
        return { code: "mapped", dist: fallbackMatch[1] };
    }
    
    return null;
}

function extractStatus(text) {
    const match = text.match(/<span class="status (status\d)"><\/span>/);
    return match ? match[1] : null;
}

function extractVillageName(text) {
    const lines = text.split(/<br\s*\/?>/i);
    let regionFound = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        if (line.includes("{k.regionTooltip}")) {
            regionFound = true;
            continue;
        }
        
        // Skip effect line
        if (regionFound && !line.includes("&#x202d;") && !line.includes("{k.")) {
            regionFound = false;
            continue;
        }
        regionFound = false;

        if (line.includes("coordinatesWrapper") || line.includes("{k.distance}")) {
            continue;
        }

        if (line.includes("{k.spieler}") || line.includes("{k.allianz}") || line.includes("{k.einwohner}")) {
            break;
        }

        let cleanName = line.replace(/<\/?[^>]+(>|$)/g, "").trim();
        cleanName = cleanName.replace(/{k\.[^}]+}/g, "").trim();
        if (cleanName) {
            return cleanName;
        }
    }
    return null;
}

function isCapital(text) {
    return text.includes("mainVillage") || text.includes("{k.hauptdorf}") || text.includes("(Capital)");
}

function isCity(text) {
    return text.includes("cityVillage") || text.includes("{k.city}");
}

function isHarbor(text) {
    return text.includes("{k.harbor}") || text.includes("harbor");
}

function extractOasisType(title) {
    const match = title.match(/{k\.o(\d+)}/);
    return match ? `o${match[1]}` : null;
}
