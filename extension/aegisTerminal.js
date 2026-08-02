/**
 * AEGIS TERMINAL - Frontend Logic
 */

let aegisData = { status: "ok", role: "MEMBER", stats: [], incomings: [], standing: [] };
let currentUserIgn = ""; // Will try to determine from active game if possible, or fallback.

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const btnRefresh = document.getElementById('btn-refresh');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Containers
const radarGrid = document.getElementById('radar-grid');
const standingGrid = document.getElementById('standing-grid');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

let currentModalAction = null;
let currentModalPayload = {};
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

// Helper for formatting time
function formatLastUpdated(serverTime, utcOffsetStr) {
    if (!serverTime || !utcOffsetStr) return "--";
    try {
        let match = utcOffsetStr.match(/([+-])(\d{2}):(\d{2})/);
        let offsetMs = 0;
        if (match) {
            let sign = match[1] === '+' ? 1 : -1;
            let hours = parseInt(match[2], 10);
            let mins = parseInt(match[3], 10);
            offsetMs = sign * ((hours * 60 * 60 * 1000) + (mins * 60 * 1000));
        }
        let d = new Date(serverTime);
        let utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
        let travianDate = new Date(utcMs + offsetMs);
        
        let hh = travianDate.getHours();
        let mm = travianDate.getMinutes();
        let ss = travianDate.getSeconds();
        let ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        hh = hh ? hh : 12;
        
        let pad = n => n < 10 ? '0'+n : n;
        return `Updated: ${pad(hh)}:${pad(mm)}:${pad(ss)} ${ampm} (UTC${utcOffsetStr})`;
    } catch(e) {
        return "--";
    }
}

// --- INIT ---
function init() {
    bindEvents();
    fetchAegisData();
}

function bindEvents() {
    btnRefresh.addEventListener('click', fetchAegisData);
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    document.getElementById('btn-report-inc').addEventListener('click', openReportIncomingModal);
    document.getElementById('btn-req-std').addEventListener('click', openRequestStandingModal);

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalConfirm.addEventListener('click', handleModalConfirm);

    // Delegated handlers for dynamically generated kanban card buttons (MV3 CSP: no inline onclick)
    bindDelegatedCardClicks();
}

// --- DATA FETCHING ---
function fetchAegisData() {
    showLoading("Connecting to Aegis Mainframe...");
    
    // Determine active server
    chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
        if (tabs && tabs.length > 0) {
            const url = new URL(tabs[0].url);
            currentHostname = url.hostname;
            chrome.storage.local.get(['discordId'], (res) => {
                if(!res.discordId) {
                    hideLoading();
                    alert("Discord ID not linked. Please connect Discord in the Map Engine.");
                    return;
                }
                
                let payload = [{ action: "aegis_get_data", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                    hideLoading();
                    if (!rawText) { alert("Network error."); return; }
                    try {
                        let data = JSON.parse(rawText);
                        if (data.status === "ok") {
                            aegisData = data;
                            
                            // Update last updated text
                            let luEl = document.getElementById('last-updated');
                            if (luEl) luEl.innerText = formatLastUpdated(data.serverTime, data.utcOffset);
                            
                            renderRadar();
                            renderStanding();
                        } else {
                            alert("Error: " + data.status);
                        }
                    } catch (e) {
                        console.error("Aegis Parse/Render Error:", e);
                        alert("Server or render error. Check console.");
                    }
                });
            });
        } else {
            hideLoading();
            alert("Please navigate to a supported Travian server first.");
        }
    });
}

function sendAegisMutation(actionName, payloadData, successMsg) {
    showLoading("Transmitting directive...");
    chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
        if (tabs && tabs.length > 0) {
            const url = new URL(tabs[0].url);
            chrome.storage.local.get(['discordId'], (res) => {
                let payload = [{ action: actionName, extVersion: chrome.runtime.getManifest().version, discordId: res.discordId, ...payloadData }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                    hideLoading();
                    if (!rawText) { alert("Network error."); return; }
                    try {
                        let data = JSON.parse(rawText);
                        if (data.status === "ok") {
                            closeModal();
                            fetchAegisData(); // Refresh data
                        } else {
                            alert("Error: " + data.msg);
                        }
                    } catch (e) {
                        alert("Server error.");
                    }
                });
            });
        }
    });
}

// --- RENDERING ---
function renderRadar() {
    radarGrid.innerHTML = "";
    if (aegisData.incomings.length === 0) {
        radarGrid.innerHTML = `<div style="color:var(--green); grid-column: 1/-1; text-align:center; padding: 40px; background:var(--bg-card2); border-radius:12px; border:1px solid var(--border); font-size:14px; font-weight:700;">🟢 Radar is clear. No hostile incomings detected.</div>`;
        return;
    }
    
    const isLeader = aegisData.role === "LEADER";

    aegisData.incomings.forEach(inc => {
        const isEscalated = inc.status === "ESCALATED";
        const badgeClass = isEscalated ? "badge-escalated" : "badge-open";
        
        let commitsHtml = "";
        if (isEscalated && inc.commits) {
            let totalCommitted = 0;
            let cList = "";
            for (let ign in inc.commits) {
                totalCommitted += inc.commits[ign].amount;
                let cTribeIcon = getTribeMediumIcon(inc.commits[ign].tribe);
                let tImg = cTribeIcon ? `<img src="${cTribeIcon}" class="tribe-icon" title="${inc.commits[ign].tribe}">` : "";
                let ignUrl = inc.commits[ign].uid && inc.commits[ign].uid !== "0"
                    ? `https://${currentHostname}/profile/${inc.commits[ign].uid}`
                    : `https://${currentHostname}/statistiken.php?id=0&name=${encodeURIComponent(ign)}`;
                cList += `<div class="defender-item">
                    <span>${tImg} <a href="${ignUrl}" target="_blank" class="app-link">${ign}</a></span>
                    <span>${inc.commits[ign].amount.toLocaleString()} 🪖 <span style="color:var(--text-muted);font-size:10px;">(${inc.commits[ign].eta})</span></span>
                </div>`;
            }
            if(totalCommitted > 0) {
                commitsHtml = `
                    <div style="margin-top:15px;">
                        <div class="progress-label" style="color:var(--green);"><span>Total Committed</span> <span>${totalCommitted.toLocaleString()} Troops</span></div>
                        <div class="defender-list">${cList}</div>
                    </div>
                `;
            }
        }
        
        // Actions — use data-action + data-id to avoid MV3 inline-onclick CSP violation
        let actionsHtml = "";
        if (!isEscalated) {
            actionsHtml = `
                <button class="btn btn-danger" data-action="escalate" data-id="${inc.id}" ${!isLeader ? 'disabled title="Only High Command can escalate"' : ''}>${!isLeader ? '🔒 ' : ''}Escalate to Normal Def</button>
                <button class="btn btn-secondary" data-action="dismiss" data-id="${inc.id}" ${!isLeader ? 'disabled title="Only High Command can dismiss"' : ''}>${!isLeader ? '🔒 ' : ''}Dismiss (Fake)</button>
            `;
        } else {
            actionsHtml = `
                <button class="btn btn-success" data-action="commit" data-id="${inc.id}">🛡️ Commit Troops</button>
                <button class="btn btn-secondary" data-action="editnotes" data-id="${inc.id}" ${!isLeader ? 'disabled title="Only High Command can edit"' : ''}>${!isLeader ? '🔒 ' : ''}Edit Notes</button>
                <button class="btn btn-danger" data-action="resolve" data-id="${inc.id}" ${!isLeader ? 'disabled title="Only High Command can resolve"' : ''}>${!isLeader ? '🔒 ' : ''}Close / Resolve</button>
            `;
        }

        let tUrl = '#';
        if (inc.targetCoords && inc.targetCoords.includes(',')) {
            let pts = inc.targetCoords.split(',');
            tUrl = `https://${currentHostname}/karte.php?x=${pts[0].trim()}&y=${pts[1].trim()}`;
        }
        let aUrl = inc.attackerUid && inc.attackerUid !== "0" ? `https://${currentHostname}/profile/${inc.attackerUid}` : `https://${currentHostname}/statistiken.php?id=0&name=${encodeURIComponent(inc.attackerIGN)}`;
        let dUrl = inc.defenderUid && inc.defenderUid !== "0" ? `https://${currentHostname}/profile/${inc.defenderUid}` : `https://${currentHostname}/statistiken.php?id=0&name=${encodeURIComponent(inc.defenderIGN)}`;

        let card = document.createElement('div');
        card.className = `ticket-card status-${inc.status.toLowerCase()}`;
        card.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">🚨 ${inc.id}</div>
                <div class="ticket-badge ${badgeClass}">${inc.status}</div>
            </div>
            <div class="ticket-details">
                <div style="margin-bottom:8px;">
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Target Designation</div>
                    <div>Defender: <a href="${dUrl}" target="_blank" class="app-link">${inc.defenderIGN}</a></div>
                    <div>Village: <a href="${tUrl}" target="_blank" class="app-link">${inc.targetVillage}</a> (${inc.targetCoords})</div>
                </div>
                <div style="margin-bottom:8px;">
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Hostile Origin</div>
                    <div>Attacker: <a href="${aUrl}" target="_blank" class="app-link" style="color:#ff4757;">${inc.attackerIGN}</a></div>
                </div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px;">
                    <span>Waves: <strong style="color:var(--gold);">${inc.waves}</strong></span>
                    <span>Impact: <strong>${inc.impactTime}</strong></span>
                </div>
                <div style="color:var(--gold);font-style:italic;">"${inc.notes || 'No additional notes provided.'}"</div>
                ${commitsHtml}
            </div>
            <div class="ticket-actions">${actionsHtml}</div>
        `;
        radarGrid.appendChild(card);
    });
}

function renderStanding() {
    standingGrid.innerHTML = "";
    if (aegisData.standing.length === 0) {
        standingGrid.innerHTML = `<div style="color:var(--text-muted); grid-column: 1/-1; text-align:center; padding: 40px; background:var(--bg-card2); border-radius:12px; border:1px solid var(--border); font-size:14px; font-weight:700;">🟢 No active standing defense walls.</div>`;
        return;
    }

    const isLeader = aegisData.role === "LEADER";

    aegisData.standing.forEach(wall => {
        let pct = wall.goal > 0 ? Math.min(100, Math.round((wall.current / wall.goal) * 100)) : 0;
        
        let garrisonHtml = "";
        if (wall.garrison) {
            for (let ign in wall.garrison) {
                let gEntry = wall.garrison[ign];
                let dTribeIcon = getTribeMediumIcon(gEntry.tribe);
                let tImg = dTribeIcon ? `<img src="${dTribeIcon}" class="tribe-icon" title="${gEntry.tribe}">` : "";
                let ignUrl = gEntry.uid && gEntry.uid !== "0"
                    ? `https://${currentHostname}/profile/${gEntry.uid}`
                    : `https://${currentHostname}/statistiken.php?id=0&name=${encodeURIComponent(ign)}`;
                garrisonHtml += `
                    <div class="defender-item">
                        <span>${tImg} <a href="${ignUrl}" target="_blank" class="app-link">${ign}</a></span>
                        <span>${gEntry.amount.toLocaleString()} 🪖</span>
                    </div>
                `;
            }
            if(garrisonHtml) garrisonHtml = `<div class="defender-list">${garrisonHtml}</div>`;
        }
        if(!garrisonHtml) garrisonHtml = `<div style="font-size:11px; color:var(--text-muted); margin-top:10px; font-style:italic;">No garrison assigned yet.</div>`;

        // Actions — data-action + data-* to avoid MV3 CSP violation on inline onclick
        let actionsHtml = `
            <button class="btn btn-success" data-action="garrison" data-id="${wall.id}">🛡️ Garrison</button>
            <button class="btn btn-secondary" data-action="withdraw" data-id="${wall.id}">🔙 Withdraw</button>
            <button class="btn btn-secondary" data-action="editstanding" data-id="${wall.id}" data-goal="${wall.goal}" data-reason="${(wall.reason || '').replace(/"/g,'&quot;')}" ${!isLeader ? 'disabled' : ''}>${!isLeader ? '🔒 ' : ''}Edit</button>
            <button class="btn btn-danger" data-action="closestanding" data-id="${wall.id}" ${!isLeader ? 'disabled' : ''}>${!isLeader ? '🔒 ' : ''}Close Wall</button>
        `;

        let cUrl = wall.commanderUid && wall.commanderUid !== "0" ? `https://${currentHostname}/profile/${wall.commanderUid}` : `https://${currentHostname}/statistiken.php?id=0&name=${encodeURIComponent(wall.commander)}`;
        let tUrl = '#';
        if (wall.coords && wall.coords.includes(',')) {
            let pts = wall.coords.split(',');
            tUrl = `https://${currentHostname}/karte.php?x=${pts[0].trim()}&y=${pts[1].trim()}`;
        }
        
        let cTribeIcon = getTribeMediumIcon(wall.commanderTribe);
        let cTribeHtml = cTribeIcon ? `<img src="${cTribeIcon}" class="tribe-icon" title="${wall.commanderTribe}">` : "";

        let card = document.createElement('div');
        card.className = "ticket-card status-open";
        card.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">🧱 ${wall.id}</div>
                <div class="ticket-badge badge-open">OPEN</div>
            </div>
            <div class="ticket-details" style="flex:1;">
                <div>Commander: ${cTribeHtml}<a href="${cUrl}" target="_blank" class="app-link">${wall.commander}</a></div>
                <div>Target: <a href="${tUrl}" target="_blank" class="app-link">${wall.village}</a> <span style="color:var(--text-muted);">(${wall.coords})</span></div>
                <div style="margin-top:6px; color:var(--gold); font-style:italic;">Directive: ${wall.reason}</div>
                
                <div class="progress-container" style="margin-top:15px;">
                    <div class="progress-label">
                        <span>Status</span>
                        <span><strong style="color:#fff;">${wall.current.toLocaleString()}</strong> / ${wall.goal.toLocaleString()} 🪖 (${pct}%)</span>
                    </div>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
                
                <div style="margin-top:15px;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Garrison Details</div>
                    ${garrisonHtml}
                </div>
            </div>
            <div class="ticket-actions" style="margin-top:15px;">${actionsHtml}</div>
        `;
        standingGrid.appendChild(card);
    });
}

// Delegated click handler for all dynamically rendered kanban buttons
// Avoids inline onclick which is blocked by Manifest V3 CSP
function bindDelegatedCardClicks() {
    [radarGrid, standingGrid].forEach(grid => {
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || btn.disabled) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            switch(action) {
                case 'escalate':    doEscalate(id); break;
                case 'dismiss':     doDismiss(id); break;
                case 'commit':      doCommit(id); break;
                case 'editnotes':   doEditNotes(id); break;
                case 'resolve':     doResolve(id); break;
                case 'garrison':    doGarrison(id); break;
                case 'withdraw':    doWithdraw(id); break;
                case 'editstanding': doEditStanding(id, btn.dataset.goal, btn.dataset.reason); break;
                case 'closestanding': doCloseStanding(id); break;
            }
        });
    });
}

// --- MODALS & ACTIONS ---

function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function openModal(title, html, action, payload) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    currentModalAction = action;
    currentModalPayload = payload || {};
    modalOverlay.classList.add('open');
}
function closeModal() {
    modalOverlay.classList.remove('open');
    currentModalAction = null;
    currentModalPayload = {};
}

function handleModalConfirm() {
    if (!currentModalAction) return;

    if (currentModalAction === "aegis_report_incoming") {
        let vName = document.getElementById('m_inc_village').value.trim();
        let att = document.getElementById('m_inc_att').value.trim();
        let waves = document.getElementById('m_inc_waves').value.trim();
        let dt = document.getElementById('m_inc_dt').value.trim();
        if(!vName || !att || !dt) { alert("Please fill required fields."); return; }
        sendAegisMutation(currentModalAction, { vNameInput: vName, attackerInput: att, wavesInput: waves, datetimeInput: dt });
    }
    else if (currentModalAction === "aegis_escalate_def") {
        let notes = document.getElementById('m_esc_notes').value.trim();
        sendAegisMutation(currentModalAction, { incId: currentModalPayload.id, notes: notes });
    }
    else if (currentModalAction === "aegis_dismiss_fake") {
        sendAegisMutation(currentModalAction, { incId: currentModalPayload.id });
    }
    else if (currentModalAction === "aegis_commit_def") {
        let amt = document.getElementById('m_com_amt').value.trim();
        let eta = document.getElementById('m_com_eta').value.trim();
        if(!amt || !eta) { alert("Please fill required fields."); return; }
        sendAegisMutation(currentModalAction, { incId: currentModalPayload.id, amount: amt, eta: eta });
    }
    else if (currentModalAction === "aegis_resolve_def") {
        let type = document.getElementById('m_res_type').value;
        let res = document.getElementById('m_res_res').value;
        sendAegisMutation(currentModalAction, { incId: currentModalPayload.id, attackType: type, result: res });
    }
    else if (currentModalAction === "aegis_edit_notes") {
        let notes = document.getElementById('m_edit_notes').value.trim();
        sendAegisMutation(currentModalAction, { incId: currentModalPayload.id, notes: notes });
    }
    else if (currentModalAction === "aegis_request_standing") {
        let vil = document.getElementById('m_std_vil').value.trim();
        let crop = document.getElementById('m_std_crop').value.trim();
        let rsn = document.getElementById('m_std_rsn').value.trim();
        if(!vil || !crop || !rsn) { alert("Please fill required fields."); return; }
        sendAegisMutation(currentModalAction, { village: vil, cropGoal: crop, reason: rsn });
    }
    else if (currentModalAction === "aegis_garrison_standing") {
        let amt = document.getElementById('m_gar_amt').value.trim();
        if(!amt) return;
        sendAegisMutation(currentModalAction, { wallId: currentModalPayload.id, amount: amt });
    }
    else if (currentModalAction === "aegis_withdraw_standing") {
        let amt = document.getElementById('m_wit_amt').value.trim();
        if(!amt) return;
        sendAegisMutation(currentModalAction, { wallId: currentModalPayload.id, amount: amt });
    }
    else if (currentModalAction === "aegis_edit_standing") {
        let crop = document.getElementById('m_eds_crop').value.trim();
        let rsn = document.getElementById('m_eds_rsn').value.trim();
        if(!crop || !rsn) return;
        sendAegisMutation(currentModalAction, { wallId: currentModalPayload.id, cropGoal: crop, reason: rsn });
    }
    else if (currentModalAction === "aegis_close_standing") {
        let rsn = document.getElementById('m_cls_rsn').value.trim();
        if(!rsn) return;
        sendAegisMutation(currentModalAction, { wallId: currentModalPayload.id, reason: rsn });
    }
}

// -- Specific Modal Openers --
function openReportIncomingModal() {
    let html = `
        <label>Your Target Village Name</label>
        <input type="text" id="m_inc_village" placeholder="e.g. 01. Capital">
        <label>Attacker IGN</label>
        <input type="text" id="m_inc_att" placeholder="e.g. Paddson">
        <label>Waves</label>
        <input type="number" id="m_inc_waves" value="1">
        <label>Impact Datetime (Server Time)</label>
        <input type="text" id="m_inc_dt" placeholder="YYYY-MM-DD, HH:MM:SS">
    `;
    openModal("🚨 REPORT INCOMING", html, "aegis_report_incoming");
}

window.doEscalate = function(id) {
    let html = `
        <label>Tactical Notes (Optional)</label>
        <textarea id="m_esc_notes" rows="3" placeholder="Add any instructions for defenders..."></textarea>
    `;
    openModal(`🆘 ESCALATE [${id}]`, html, "aegis_escalate_def", {id});
}

window.doDismiss = function(id) {
    let html = `<p style="font-size:12px;">Are you sure you want to dismiss <b>${id}</b> as a fake and remove it from the radar?</p>`;
    openModal(`🗑️ DISMISS THREAT`, html, "aegis_dismiss_fake", {id});
}

window.doCommit = function(id) {
    let html = `
        <label>Total DEF Troops Sent</label>
        <input type="number" id="m_com_amt" placeholder="e.g. 15000">
        <label>Time of Arrival (Server Time)</label>
        <input type="text" id="m_com_eta" placeholder="14:35:00">
    `;
    openModal(`🛡️ COMMIT DEFENSE [${id}]`, html, "aegis_commit_def", {id});
}

window.doResolve = function(id) {
    let html = `
        <label>Attack Type</label>
        <select id="m_res_type">
            <option value="Real">Real ⚔️</option>
            <option value="Fake">Fake 💨</option>
        </select>
        <label>Result</label>
        <select id="m_res_res">
            <option value="Held">Held (Defended) 🛡️</option>
            <option value="Sniped">Sniped 🎯</option>
            <option value="Lost">Lost (Cleared) 🔥</option>
        </select>
    `;
    openModal(`✅ RESOLVE TICKET [${id}]`, html, "aegis_resolve_def", {id});
}

window.doEditNotes = function(id) {
    let html = `
        <label>Tactical Notes</label>
        <textarea id="m_edit_notes" rows="3" placeholder="Update commander notes here..."></textarea>
    `;
    openModal(`✏️ EDIT NOTES [${id}]`, html, "aegis_edit_notes", {id});
}

function openRequestStandingModal() {
    let html = `
        <label>Target Village Name</label>
        <input type="text" id="m_std_vil" placeholder="e.g. 01. Capital">
        <label>Defensive Troop Goal</label>
        <input type="number" id="m_std_crop" placeholder="e.g. 15000">
        <label>Strategic Justification</label>
        <input type="text" id="m_std_rsn" placeholder="Capital, Artifact, WW, etc.">
    `;
    openModal("🧱 REQUEST STANDING DEFENSE", html, "aegis_request_standing");
}

window.doGarrison = function(id) {
    let html = `
        <label>Troops Amount to Garrison</label>
        <input type="number" id="m_gar_amt" placeholder="e.g. 1000">
    `;
    openModal(`🛡️ GARRISON TROOPS [${id}]`, html, "aegis_garrison_standing", {id});
}

window.doWithdraw = function(id) {
    let html = `
        <label>Troops Amount to Withdraw</label>
        <input type="number" id="m_wit_amt" placeholder="e.g. 1000">
    `;
    openModal(`🔙 WITHDRAW TROOPS [${id}]`, html, "aegis_withdraw_standing", {id});
}

window.doEditStanding = function(id, currentGoal, currentReason) {
    let html = `
        <label>New Def Goal</label>
        <input type="number" id="m_eds_crop" value="${currentGoal}">
        <label>Directive/Reason</label>
        <input type="text" id="m_eds_rsn" value="${currentReason}">
    `;
    openModal(`✏️ EDIT WALL [${id}]`, html, "aegis_edit_standing", {id});
}

window.doCloseStanding = function(id) {
    let html = `
        <label>Closing Reason / Result</label>
        <input type="text" id="m_cls_rsn" placeholder="e.g. Artifact moved, safe.">
    `;
    openModal(`🔒 CLOSE WALL [${id}]`, html, "aegis_close_standing", {id});
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);