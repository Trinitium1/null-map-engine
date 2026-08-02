/**
 * LOGISTICS COMMAND TERMINAL - Frontend Logic
 */

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

let logisticsData = {
    status: "ok",
    role: "MEMBER",
    userDiscordId: "",
    userIGN: "Unknown",
    titans: [],
    requested: [],
    debtors: [],
    pushRequests: [],
    activePushes: [],
    serverTime: Date.now()
};

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const btnRefresh = document.getElementById('btn-refresh');
const btnInitiatePush = document.getElementById('btn-initiate-push');

// Tabs
const tabBtnRequests = document.getElementById('tab-btn-requests');
const tabBtnActive = document.getElementById('tab-btn-active');
const tabRequests = document.getElementById('tab-requests');
const tabActive = document.getElementById('tab-active');

// Grids
const requestsGrid = document.getElementById('requests-grid');
const activeGrid = document.getElementById('active-grid');

// Modals
const modalRequest = document.getElementById('modal-request');
const reqClose = document.getElementById('req-close');
const reqCancel = document.getElementById('req-cancel');
const reqSubmit = document.getElementById('req-submit');

const modalDetails = document.getElementById('modal-details');
const detailsClose = document.getElementById('details-close');
const detailsCancel = document.getElementById('details-cancel');
const detailsTitle = document.getElementById('details-title');
const detailsBody = document.getElementById('details-body');

let currentHostname = "";

// Helper for Tribe Icons
function getTribeMediumIcon(tribe) {
    if (!tribe) return "";
    let t = tribe.toLowerCase();
    if (t.includes('roman')) return 'assets/roman_medium.png';
    if (t.includes('gaul')) return 'assets/gaul_medium.png';
    if (t.includes('teuton')) return 'assets/teuton_medium.png';
    if (t.includes('egyptian')) return 'assets/egyptian_medium.png';
    if (t.includes('hun')) return 'assets/hun_medium.png';
    if (t.includes('spartan')) return 'assets/spartan_medium.png';
    return "";
}

// Helper for Progress Bar Color
function getDynamicProgressColor(percent) {
    if (percent >= 100) return '#2ed573';
    if (percent >= 75) return '#2ecc71';
    if (percent >= 50) return '#f1c40f';
    if (percent >= 25) return '#e67e22';
    return '#ff4757';
}

function showLoading(msg) {
    if (loadingText) loadingText.textContent = msg || "Loading...";
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    fetchLogisticsData();
});

function bindEvents() {
    if (btnRefresh) btnRefresh.addEventListener('click', fetchLogisticsData);

    if (tabBtnRequests && tabBtnActive) {
        tabBtnRequests.addEventListener('click', () => {
            tabBtnRequests.classList.add('active');
            tabBtnActive.classList.remove('active');
            tabRequests.classList.add('active');
            tabActive.classList.remove('active');
        });

        tabBtnActive.addEventListener('click', () => {
            tabBtnActive.classList.add('active');
            tabBtnRequests.classList.remove('active');
            tabActive.classList.add('active');
            tabRequests.classList.remove('active');
        });
    }

    // Modal Request
    if (btnInitiatePush) {
        btnInitiatePush.addEventListener('click', () => {
            populateUserVillagesDropdown();
            modalRequest.classList.add('open');
        });
    }
    if (reqClose) reqClose.addEventListener('click', () => modalRequest.classList.remove('open'));
    if (reqCancel) reqCancel.addEventListener('click', () => modalRequest.classList.remove('open'));
    if (reqSubmit) reqSubmit.addEventListener('click', handleCreatePushRequest);

    // Modal Details
    if (detailsClose) detailsClose.addEventListener('click', () => modalDetails.classList.remove('open'));
    if (detailsCancel) detailsCancel.addEventListener('click', () => modalDetails.classList.remove('open'));
}

function populateUserVillagesDropdown() {
    const selectVillage = document.getElementById('select-req-village');
    if (!selectVillage) return;

    selectVillage.innerHTML = '<option value="">-- Select Your Target Village --</option>';

    const userVillages = (logisticsData && logisticsData.userVillages) ? logisticsData.userVillages : [];
    if (userVillages.length === 0) {
        let opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "No registered villages found in DB";
        selectVillage.appendChild(opt);
        return;
    }

    userVillages.forEach(v => {
        let opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.x}, ${v.y})`;
        selectVillage.appendChild(opt);
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

function formatTimestampWithServerUtc(tsMs, utcOffsetStr) {
    if (!tsMs) return "--";
    const offsetStr = utcOffsetStr || (logisticsData && logisticsData.utcOffset) || "+01:00";
    try {
        let match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
        let offsetMs = 0;
        if (match) {
            let sign = match[1] === '+' ? 1 : -1;
            let hours = parseInt(match[2], 10);
            let mins = parseInt(match[3], 10);
            offsetMs = sign * ((hours * 60 * 60 * 1000) + (mins * 60 * 1000));
        }
        let d = new Date(tsMs);
        let utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
        let targetDate = new Date(utcMs + offsetMs);
        
        let hh = targetDate.getHours();
        let mm = targetDate.getMinutes();
        let ss = targetDate.getSeconds();
        let ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        hh = hh ? hh : 12;
        
        let pad = n => n < 10 ? '0'+n : n;
        return `${pad(hh)}:${pad(mm)}:${pad(ss)} ${ampm} (UTC${offsetStr})`;
    } catch(e) {
        return new Date(tsMs).toLocaleString();
    }
}

// --- DATA FETCHING ---
function fetchLogisticsData() {
    showLoading("Connecting to Logistics Mainframe...");

    getActiveServerHostname((hostname) => {
        if (!hostname) {
            hideLoading();
            alert("No active server detected. Please open a Travian tab or check extension settings.");
            return;
        }
        currentHostname = hostname;

        chrome.storage.local.get(['discordId'], (res) => {
            if (!res.discordId) {
                hideLoading();
                alert("Discord ID not linked. Please connect Discord in the Map Engine settings.");
                return;
            }

            let payload = [{ action: "logistics_get_data", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId }];
            chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                hideLoading();
                if (!rawText) { alert("Network error connecting to backend."); return; }

                let data = safeParseJSON(rawText);
                if (data && data.status === "ok") {
                        logisticsData = data;

                        const lu = document.getElementById('last-updated');
                        if (lu) lu.textContent = `Updated: ${formatTimestampWithServerUtc(Date.now(), data.utcOffset)}`;

                        // Tab Visibility for Leader
                        if (data.role === "LEADER") {
                            if (tabBtnRequests) tabBtnRequests.classList.remove('hidden');
                        } else {
                            if (tabBtnRequests) tabBtnRequests.classList.add('hidden');
                        }

                        populateUserVillagesDropdown();
                        renderRequestsGrid();
                        renderActiveGrid();
                    } else {
                        alert("Backend Error: " + (data ? (data.msg || data.status) : "Failed to load data"));
                    }
            });
        });
    });
}

// --- RENDERING ---
function renderRequestsGrid() {
    if (!requestsGrid) return;
    requestsGrid.innerHTML = "";

    const requests = logisticsData.pushRequests || [];

    if (requests.length === 0) {
        requestsGrid.innerHTML = `<div style="color:var(--green); grid-column: 1/-1; text-align:center; padding: 40px; background:var(--bg-card2); border-radius:12px; border:1px solid var(--border); font-size:13px; font-weight:700;">🟢 No pending push requisitions. High Command queue is clear.</div>`;
        return;
    }

    requests.forEach(req => {
        const tribeIcon = getTribeMediumIcon(req.tribe);
        const tribeHtml = tribeIcon ? `<img src="${tribeIcon}" class="tribe-icon" title="${req.tribe}"> ` : '';

        const playerLink = (req.uid && req.uid !== "0") ? 
            `<a href="https://${currentHostname}/spieler.php?uid=${req.uid}" target="_blank" style="color:#fff; font-weight:700; text-decoration:underline;">${req.requesterIGN}</a>` : 
            `<a href="https://${currentHostname}/spieler.php?name=${encodeURIComponent(req.requesterIGN)}" target="_blank" style="color:#fff; font-weight:700; text-decoration:underline;">${req.requesterIGN}</a>`;

        const allyLink = (req.aid && req.aid !== "0") ? 
            `<a href="https://${currentHostname}/allianz.php?aid=${req.aid}" target="_blank" style="color:#a4b0be; text-decoration:underline;">[${req.ally || 'CONF'}]</a>` : 
            `<a href="https://${currentHostname}/allianz.php?tag=${encodeURIComponent(req.ally || '')}" target="_blank" style="color:#a4b0be; text-decoration:underline;">[${req.ally || 'CONF'}]</a>`;

        let tx = req.targetX !== undefined && req.targetX !== null ? req.targetX : 0;
        let ty = req.targetY !== undefined && req.targetY !== null ? req.targetY : 0;
        if ((!tx && !ty) && req.coords) {
            let clean = req.coords.replace(/[()]/g, '');
            let p = clean.split(',');
            tx = p[0] ? parseInt(p[0].trim(), 10) || 0 : 0;
            ty = p[1] ? parseInt(p[1].trim(), 10) || 0 : 0;
        }

        const targetVillageName = req.targetVillage || "Target Village";
        const targetLink = `<a href="https://${currentHostname}/karte.php?x=${tx}&y=${ty}" target="_blank" style="color:#f39c12; font-weight:700; text-decoration:underline;">${targetVillageName}</a>`;

        const formattedTime = formatTimestampWithServerUtc(req.timestamp, logisticsData.utcOffset);

        const card = document.createElement('div');
        card.className = 'ticket-card status-pending';
        card.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">
                    <span>📦 PUSH-${req.requesterIGN.toUpperCase()}</span>
                </div>
                <div class="ticket-badge badge-pending">PENDING APPROVAL</div>
            </div>
            <div class="ticket-details">
                <div><strong>Requester:</strong> ${tribeHtml}${allyLink} ${playerLink}</div>
                <div><strong>Target Village:</strong> ${targetLink} <code>(${req.coords})</code></div>
                <div><strong>Required Resources:</strong> <span style="color:#2ed573; font-weight:700;">${req.totalReq.toLocaleString()} 📦</span></div>
                <div style="font-size:10px; color:#8b949e; margin-top:4px;">Requested: ${formattedTime}</div>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-success btn-approve" data-id="${req.channelId}">✅ Approve</button>
                <button class="btn btn-danger btn-reject" data-id="${req.channelId}">❌ Reject</button>
            </div>
        `;

        requestsGrid.appendChild(card);
    });

    // Wire Leader decision buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => handleLeaderDecision(btn.dataset.id, 'approve'));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => handleLeaderDecision(btn.dataset.id, 'reject'));
    });
}

function renderActiveGrid() {
    if (!activeGrid) return;
    activeGrid.innerHTML = "";

    const activePushes = logisticsData.activePushes || [];

    if (activePushes.length === 0) {
        activeGrid.innerHTML = `<div style="color:var(--text-muted); grid-column: 1/-1; text-align:center; padding: 40px; background:var(--bg-card2); border-radius:12px; border:1px solid var(--border); font-size:13px; font-weight:700;">ℹ️ No active push operations currently running.</div>`;
        return;
    }

    activePushes.forEach(push => {
        const tribeIcon = getTribeMediumIcon(push.tribe);
        const tribeHtml = tribeIcon ? `<img src="${tribeIcon}" class="tribe-icon" title="${push.tribe}"> ` : '';

        const progressColor = getDynamicProgressColor(push.percent);

        // Pending Shipments Confirmation Section
        const pendingShipments = (push.manifest && push.manifest.pendingShipments) ? push.manifest.pendingShipments : [];
        let pendingSectionHtml = '';

        if (pendingShipments.length > 0) {
            let pendingItemsHtml = '';
            pendingShipments.forEach(s => {
                pendingItemsHtml += `
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(243, 156, 18, 0.3); border-radius: 6px; padding: 8px; margin-top: 6px; font-size: 11px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                            <span style="color:#fff; font-weight:600;">📦 <b>${s.reporterIGN}</b> reports <b>${s.amount.toLocaleString()}</b> sent for <b>${s.targetPlayerIGN}</b></span>
                        </div>
                        <div style="display:flex; gap: 6px; margin-top: 6px;">
                            <button class="btn btn-success btn-confirm-shipment" style="padding: 4px 10px; font-size: 10px;" data-channel="${push.channelId}" data-shipment="${s.id}">✅ Confirm</button>
                            <button class="btn btn-danger btn-reject-shipment" style="padding: 4px 10px; font-size: 10px;" data-channel="${push.channelId}" data-shipment="${s.id}">❌ Reject</button>
                        </div>
                    </div>
                `;
            });

            pendingSectionHtml = `
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1);">
                    <div style="font-size: 11px; font-weight: 800; color: #f39c12; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <span>📥 PENDING SHIPMENT CONFIRMATIONS (${pendingShipments.length})</span>
                    </div>
                    ${pendingItemsHtml}
                </div>
            `;
        }

        const playerLink = push.uid && push.uid !== "0" ? 
            `<a href="https://${currentHostname}/spieler.php?uid=${push.uid}" target="_blank" style="color:#fff; font-weight:700; text-decoration:underline;">${push.requesterIGN}</a>` : 
            `<a href="https://${currentHostname}/spieler.php?name=${encodeURIComponent(push.requesterIGN)}" target="_blank" style="color:#fff; font-weight:700; text-decoration:underline;">${push.requesterIGN}</a>`;

        const allyLink = push.aid && push.aid !== "0" ? 
            `<a href="https://${currentHostname}/allianz.php?aid=${push.aid}" target="_blank" style="color:#a4b0be; text-decoration:underline;">[${push.ally || 'CONF'}]</a>` : 
            `<a href="https://${currentHostname}/allianz.php?tag=${encodeURIComponent(push.ally || '')}" target="_blank" style="color:#a4b0be; text-decoration:underline;">[${push.ally || 'CONF'}]</a>`;

        let pTx = push.targetX !== undefined && push.targetX !== null ? push.targetX : 0;
        let pTy = push.targetY !== undefined && push.targetY !== null ? push.targetY : 0;
        if ((!pTx && !pTy) && push.coords) {
            let clean = push.coords.replace(/[()]/g, '');
            let p = clean.split(',');
            pTx = p[0] ? parseInt(p[0].trim(), 10) || 0 : 0;
            pTy = p[1] ? parseInt(p[1].trim(), 10) || 0 : 0;
        }

        const targetVillageName = push.targetVillage || "Target Village";
        const targetLink = `<a href="https://${currentHostname}/karte.php?x=${pTx}&y=${pTy}" target="_blank" style="color:#f39c12; font-weight:700; text-decoration:underline;">${targetVillageName}</a>`;

        const card = document.createElement('div');
        card.className = 'ticket-card status-open';
        card.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">
                    <span>📦 PUSH-${push.requesterIGN.toUpperCase()}</span>
                </div>
                <div class="ticket-badge badge-open">ACTIVE PUSH</div>
            </div>
            <div class="ticket-details">
                <div><strong>Requester:</strong> ${tribeHtml}${allyLink} ${playerLink}</div>
                <div><strong>Target:</strong> ${targetLink} <code>(${push.coords})</code></div>
                <div><strong>Supplied:</strong> <span style="color:${progressColor}; font-weight:700;">${push.totalRecv.toLocaleString()}</span> / <span style="color:#fff;">${push.totalReq.toLocaleString()} 📦</span></div>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>SUPPLY PROGRESS</span>
                    <span style="color:${progressColor};">${push.percent}%</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${push.percent}%; background: ${progressColor}; box-shadow: 0 0 10px ${progressColor};"></div>
                </div>
            </div>
            ${pendingSectionHtml}
            <div class="ticket-actions" style="margin-top:10px;">
                <button class="btn btn-primary btn-details" data-channel="${push.channelId}">📋 Operation Details</button>
            </div>
        `;

        activeGrid.appendChild(card);
    });

    // Wire Details buttons
    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const ticket = activePushes.find(p => p.channelId === btn.dataset.channel);
            if (ticket) openDetailsModal(ticket);
        });
    });

    // Wire Shipment Confirm & Reject buttons inside Kanban card
    document.querySelectorAll('.btn-confirm-shipment').forEach(btn => {
        btn.addEventListener('click', () => handleShipmentDecision(btn.dataset.channel, btn.dataset.shipment, 'confirm'));
    });
    document.querySelectorAll('.btn-reject-shipment').forEach(btn => {
        btn.addEventListener('click', () => handleShipmentDecision(btn.dataset.channel, btn.dataset.shipment, 'reject'));
    });
}

function handleShipmentDecision(channelId, shipmentId, decision) {
    showLoading(`${decision === 'confirm' ? 'Confirming' : 'Rejecting'} shipment...`);

    getActiveServerHostname((hostname) => {
        if (!hostname) { hideLoading(); alert("No active server detected."); return; }
        chrome.storage.local.get(['discordId'], (res) => {
            let payload = [{ 
                action: "logistics_confirm_shipment", 
                extVersion: chrome.runtime.getManifest().version, 
                discordId: res.discordId || "unknown",
                channelId: channelId,
                shipmentId: shipmentId,
                decision: decision
            }];
            chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                hideLoading();
                if (!rawText) { alert("Network error."); return; }
                try {
                    let resData = JSON.parse(rawText);
                    if (resData.status === "ok") {
                        fetchLogisticsData();
                    } else {
                        alert("Error: " + (resData.msg || resData.status));
                    }
                } catch(e) {
                    alert("Error parsing server response.");
                }
            });
        });
    });
}

// --- ACTIONS & MODAL HANDLERS ---
function handleCreatePushRequest() {
    const reqTotal = document.getElementById('input-req-total').value;
    const selectVillage = document.getElementById('select-req-village');
    const reqVillage = selectVillage ? selectVillage.value : '';

    if (!reqTotal || parseInt(reqTotal) <= 0 || !reqVillage) {
        alert("Please select a target village and enter a valid resource requirement amount.");
        return;
    }

    showLoading("Transmitting push requisition to High Command...");

    getActiveServerHostname((hostname) => {
        if (!hostname) { hideLoading(); alert("No active server detected."); return; }
        chrome.storage.local.get(['discordId'], (res) => {
            let payload = [{ 
                action: "logistics_create_request", 
                extVersion: chrome.runtime.getManifest().version, 
                discordId: res.discordId,
                reqTotal: reqTotal,
                totalResources: reqTotal,
                reqVillage: reqVillage,
                villageName: reqVillage
            }];

            chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                hideLoading();
                if (!rawText) { alert("Network error."); return; }
                try {
                    let resData = JSON.parse(rawText);
                    if (resData.status === "ok") {
                        alert("✅ " + resData.msg);
                        modalRequest.classList.remove('open');
                        fetchLogisticsData();
                    } else {
                        alert("Error: " + resData.msg);
                    }
                } catch (e) {
                    alert("Error parsing response.");
                }
            });
        });
    });
}

function handleLeaderDecision(channelId, decision) {
    showLoading(`Processing Leader ${decision.toUpperCase()}...`);

    getActiveServerHostname((hostname) => {
        if (!hostname) { hideLoading(); alert("No active server detected."); return; }
        chrome.storage.local.get(['discordId'], (res) => {
            let payload = [{ 
                action: "logistics_leader_decision", 
                extVersion: chrome.runtime.getManifest().version, 
                discordId: res.discordId,
                channelId: channelId,
                decision: decision
            }];

            chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                hideLoading();
                if (!rawText) { alert("Network error."); return; }
                try {
                    let resData = JSON.parse(rawText);
                    if (resData.status === "ok") {
                        alert("✅ " + resData.msg);
                        fetchLogisticsData();
                    } else {
                        alert("Error: " + resData.msg);
                    }
                } catch(e) {
                    alert("Error parsing response.");
                }
            });
        });
    });
}

function openDetailsModal(ticket) {
    if (!detailsBody || !detailsTitle) return;

    detailsTitle.textContent = `📦 PUSH OPERATION DETAILS: ${ticket.requesterIGN.toUpperCase()}`;

    const progressColor = getDynamicProgressColor(ticket.percent);
    const ignData = ticket.manifest?.ignData || {};

    let manifestRows = '';
    const sortedPlayers = Object.keys(ignData).sort((a, b) => (ignData[b].quota - ignData[b].sent) - (ignData[a].quota - ignData[a].sent));

    sortedPlayers.forEach(ign => {
        const p = ignData[ign];
        const pending = Math.max(0, p.quota - p.sent);
        let icon = "⏳";
        if (pending === 0) icon = "✅";
        else if (p.sent > 0) icon = "🔄";

        manifestRows += `
            <tr>
                <td>${icon} <b>${ign}</b></td>
                <td><span style="color:#a4b0be;">[${p.ally || 'CONF'}]</span></td>
                <td><span style="color:#f39c12; font-weight:600;">${p.quota.toLocaleString()}</span></td>
                <td><span style="color:#2ed573; font-weight:600;">${p.sent.toLocaleString()}</span></td>
                <td><span style="color:${pending > 0 ? '#ff4757' : '#2ed573'}; font-weight:600;">${pending.toLocaleString()}</span></td>
            </tr>
        `;
    });

    const isLeader = logisticsData && logisticsData.role === "LEADER";

    detailsBody.innerHTML = `
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <div><b>Target Coords:</b> <code>(${ticket.coords})</code></div>
                <div><b>Requester:</b> <span style="color:#f39c12;">${ticket.requesterIGN}</span></div>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>SUPPLY PROGRESS: ${ticket.totalRecv.toLocaleString()} / ${ticket.totalReq.toLocaleString()} 📦</span>
                    <span style="color:${progressColor};">${ticket.percent}%</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${ticket.percent}%; background: ${progressColor};"></div>
                </div>
            </div>
        </div>

        <div>
            <h3 style="font-size: 12px; font-weight: 800; color: #a4b0be; text-transform: uppercase; margin-bottom: 8px;">📋 OPERATIVE QUOTA BREAKDOWN</h3>
            <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px;">
                <table class="manifest-table">
                    <thead>
                        <tr>
                            <th>Operative IGN</th>
                            <th>Alliance</th>
                            <th>Quota</th>
                            <th>Sent</th>
                            <th>Pending</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${manifestRows || '<tr><td colspan="5" style="text-align:center;">No player manifest data available.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="background: rgba(243, 156, 18, 0.05); border: 1px solid rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 8px;">
            <h3 style="font-size: 12px; font-weight: 800; color: #f39c12; text-transform: uppercase; margin-bottom: 10px;">📤 REPORT RESOURCE SHIPMENT</h3>
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label for="input-ship-amount">Resources Sent (📦 Amount)</label>
                    <input type="number" id="input-ship-amount" placeholder="e.g. 50000" min="1">
                </div>
                <div style="flex: 1;">
                    <label for="input-ship-override">Proxy IGN (Optional)</label>
                    ${isLeader ? 
                        '<input type="text" id="input-ship-override" placeholder="Leave empty for yourself">' : 
                        '<input type="text" id="input-ship-override" placeholder="Leader Role Only" disabled style="opacity: 0.5; cursor: not-allowed;" title="Only Leaders can submit proxy shipments for other players.">'
                    }
                </div>
                <button class="btn btn-primary" id="btn-submit-shipment" data-channel="${ticket.channelId}">📤 Submit Report</button>
            </div>
        </div>
    `;

    document.getElementById('btn-submit-shipment').addEventListener('click', () => {
        const amount = document.getElementById('input-ship-amount').value;
        const inputOverride = document.getElementById('input-ship-override');
        const overrideIGN = (inputOverride && !inputOverride.disabled) ? inputOverride.value : '';
        handleReportShipment(ticket.channelId, amount, overrideIGN);
    });

    modalDetails.classList.add('open');
}

function handleReportShipment(channelId, amount, overrideIGN) {
    if (!amount || parseInt(amount) <= 0) {
        alert("Please enter a valid positive shipment amount.");
        return;
    }

    showLoading("Submitting shipment report...");

    getActiveServerHostname((hostname) => {
        if (!hostname) { hideLoading(); alert("No active server detected."); return; }
        chrome.storage.local.get(['discordId'], (res) => {
            let payload = [{ 
                action: "logistics_submit_shipment", 
                extVersion: chrome.runtime.getManifest().version, 
                discordId: res.discordId,
                channelId: channelId,
                amount: amount,
                overrideIGN: overrideIGN
            }];

            chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                hideLoading();
                if (!rawText) { alert("Network error."); return; }
                try {
                    let resData = JSON.parse(rawText);
                    if (resData.status === "ok") {
                        alert("✅ " + resData.msg);
                        modalDetails.classList.remove('open');
                        fetchLogisticsData();
                    } else {
                        alert("Error: " + resData.msg);
                    }
                } catch(e) {
                    alert("Server response error.");
                }
            });
        });
    });
}
