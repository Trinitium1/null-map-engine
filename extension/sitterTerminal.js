/**
 * SITTERS COMMAND TERMINAL - Frontend Logic & Heatmap Engine
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

let sitterData = { status: "ok", serverTime: "", utcOffset: "+01:00", stats: {}, players: [], currentMember: null };
let currentHostname = "";
let chartInstance = null;
let profileActiveHours = new Array(24).fill(false);

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const btnRefresh = document.getElementById('btn-refresh');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Helper for Tribe Icons
function getTribeIconHtml(tribe) {
    if (!tribe) return "";
    let t = tribe.toLowerCase();
    if (t.includes('roman')) return '<img src="assets/roman_medium.png" class="tribe-icon" title="Roman">';
    if (t.includes('gaul')) return '<img src="assets/gaul_medium.png" class="tribe-icon" title="Gaul">';
    if (t.includes('teuton')) return '<img src="assets/teuton_medium.png" class="tribe-icon" title="Teuton">';
    if (t.includes('egyptian')) return '<img src="assets/egyptian_medium.png" class="tribe-icon" title="Egyptian">';
    if (t.includes('hun')) return '<img src="assets/hun_medium.png" class="tribe-icon" title="Hun">';
    if (t.includes('spartan')) return '<img src="assets/spartan_medium.png" class="tribe-icon" title="Spartan">';
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
    render24HourSelector();
    fetchSitterData();
}

let currentSortKey = 'operative';
let currentSortOrder = 'asc';

function bindEvents() {
    btnRefresh.addEventListener('click', fetchSitterData);
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            if (btn.dataset.target === 'tab-active-time' && chartInstance) {
                setTimeout(() => chartInstance.render(), 100);
            }
        });
    });

    const searchInput = document.getElementById('matrix-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterMatrixTable(e.target.value.trim().toLowerCase());
        });
    }

    const sortableHeaders = document.querySelectorAll('.matrix-table th.sortable');
    sortableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (currentSortKey === key) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = key;
                currentSortOrder = 'asc';
            }
            updateSortHeaderIcons();
            renderMatrixTable();
        });
    });

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', saveProfileData);
    }
}

function updateSortHeaderIcons() {
    const headers = document.querySelectorAll('.matrix-table th.sortable');
    headers.forEach(th => {
        const key = th.dataset.sort;
        const iconEl = th.querySelector('.sort-icon');
        if (!iconEl) return;
        if (key === currentSortKey) {
            iconEl.textContent = currentSortOrder === 'asc' ? '▲' : '▼';
            th.style.color = '#3498db';
        } else {
            iconEl.textContent = '⇅';
            th.style.color = 'var(--text-muted)';
        }
    });
}

// --- DATA FETCHING ---
function fetchSitterData() {
    showLoading("Connecting to Sitter Mainframe...");
    
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
                
                let payload = [{ action: "sitter_get_data", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                    hideLoading();
                    if (!rawText) { alert("Network error."); return; }
                    let data = safeParseJSON(rawText);
                    if (data && data.status === "ok") {
                        sitterData = data;
                        
                        let luEl = document.getElementById('last-updated');
                        if (luEl) luEl.innerText = formatLastUpdated(data.serverTime, data.utcOffset);
                        
                        renderMetricsSummary();
                        renderHeatmapChart();
                        renderMatrixTable();
                        populateProfileForm();
                    } else {
                        alert("Error: " + (data ? (data.msg || data.status) : "Server returned non-JSON response"));
                    }
                });
            });
        } else {
            hideLoading();
            alert("Please navigate to a supported Travian server first.");
        }
    });
}

// --- RENDERING METRICS & MATRIX ---
function renderMetricsSummary() {
    const stats = sitterData.stats || {};
    document.getElementById('metric-secure').textContent = (stats.secure !== undefined ? stats.secure : 0);
    document.getElementById('metric-atrisk').textContent = (stats.atRisk !== undefined ? stats.atRisk : 0);
    document.getElementById('metric-critical').textContent = (stats.critical !== undefined ? stats.critical : 0);
    document.getElementById('metric-proxy').textContent = (stats.proxy !== undefined ? stats.proxy : 0);
}

function renderMatrixTable() {
    const tbody = document.getElementById('matrix-table-body');
    if (!tbody) return;

    let players = [...(sitterData.players || [])];
    if (players.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No operative sitter data found.</td></tr>`;
        return;
    }

    // Determine current user's active hours for Sitter Match % calculation
    let myActiveHours = profileActiveHours;
    if (sitterData.currentMember && sitterData.currentMember.activeHours) {
        if (Array.isArray(sitterData.currentMember.activeHours)) {
            myActiveHours = sitterData.currentMember.activeHours;
        }
    }

    let myIgn = (sitterData.currentMember?.ign || '').toLowerCase();
    let myInactiveCount = 0;
    for (let h = 0; h < 24; h++) {
        if (!myActiveHours[h]) myInactiveCount++;
    }

    // Compute Sitter Match % for each player
    players.forEach(p => {
        let isSelf = (p.ign.toLowerCase() === myIgn);
        p.isSelf = isSelf;

        if (isSelf) {
            p.sitterMatchPct = -1;
            p.sitterMatchBadge = `<span style="color:var(--text-muted); font-size:11px;">Self</span>`;
        } else {
            let matchedCount = 0;
            let cActiveHours = p.activeHours || new Array(24).fill(false);
            for (let h = 0; h < 24; h++) {
                if (!myActiveHours[h] && cActiveHours[h]) {
                    matchedCount++;
                }
            }

            let pct = 0;
            if (myInactiveCount === 0) {
                pct = 100;
            } else {
                pct = Math.round((matchedCount / myInactiveCount) * 100);
            }
            p.sitterMatchPct = pct;

            if (pct >= 75) {
                p.sitterMatchBadge = `<span style="background:rgba(85,239,196,0.15); color:#55efc4; border:1px solid rgba(85,239,196,0.3); padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">🎯 ${pct}% (${matchedCount}/${myInactiveCount}h)</span>`;
            } else if (pct >= 40) {
                p.sitterMatchBadge = `<span style="background:rgba(255,234,167,0.15); color:#ffeaa7; border:1px solid rgba(255,234,167,0.3); padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">⚡ ${pct}% (${matchedCount}/${myInactiveCount}h)</span>`;
            } else {
                p.sitterMatchBadge = `<span style="background:rgba(255,118,117,0.15); color:#ff7675; border:1px solid rgba(255,118,117,0.3); padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">🔴 ${pct}% (${matchedCount}/${myInactiveCount}h)</span>`;
            }
        }
    });

    // Sort players array based on currentSortKey
    players.sort((a, b) => {
        let valA, valB;
        if (currentSortKey === 'operative') {
            valA = a.ign.toLowerCase();
            valB = b.ign.toLowerCase();
        } else if (currentSortKey === 'status') {
            valA = a.statusType || '';
            valB = b.statusType || '';
        } else if (currentSortKey === 'timezone') {
            valA = a.coveredHours || 0;
            valB = b.coveredHours || 0;
        } else if (currentSortKey === 'coverage') {
            valA = a.covPct || 0;
            valB = b.covPct || 0;
        } else if (currentSortKey === 'sittedBy') {
            valA = (a.s1 + " " + a.s2).toLowerCase();
            valB = (b.s1 + " " + b.s2).toLowerCase();
        } else if (currentSortKey === 'matchPct') {
            valA = a.sitterMatchPct;
            valB = b.sitterMatchPct;
        }

        if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    let html = '';
    players.forEach(p => {
        let tribeImg = getTribeIconHtml(p.tribe);
        let allyLink = p.ally && p.ally !== "Unknown" ? `[<a href="https://${currentHostname}/allianzen.php?tag=${encodeURIComponent(p.ally)}" target="_blank" class="app-link">${p.ally}</a>]` : '';
        let playerLink = `<a href="https://${currentHostname}/profile/${p.uid || '0'}" target="_blank" class="app-link" style="color:#fff; font-weight:700;">${p.ign}</a>`;

        let sits = [];
        if (p.isProxy) {
            sits.push('<span style="color:var(--text-muted);">Dual/Proxy</span>');
        } else {
            if (p.s1) sits.push(`<a href="https://${currentHostname}/profile/${p.s1Uid || '0'}" target="_blank" class="app-link">${p.s1}</a>`);
            if (p.s2) sits.push(`<a href="https://${currentHostname}/profile/${p.s2Uid || '0'}" target="_blank" class="app-link">${p.s2}</a>`);
        }
        let sitsStr = sits.length > 0 ? sits.join(' | ') : '<span style="color:var(--red);">None ⚠️</span>';

        html += `
            <tr data-search="${p.ign.toLowerCase()} ${p.ally.toLowerCase()}">
                <td>${p.statusIcon} ${tribeImg} ${allyLink} ${playerLink}</td>
                <td><strong style="color:${p.statusType === 'SECURE' ? 'var(--green)' : (p.statusType === 'AT_RISK' ? 'var(--orange)' : (p.statusType === 'PROXY' ? 'var(--blue)' : 'var(--red)'))}">${p.statusType}</strong></td>
                <td><code style="color:var(--gold);">${p.tz}</code></td>
                <td><strong style="color:var(--text-primary);">${p.covDisplay || '--'}</strong></td>
                <td>${sitsStr}</td>
                <td>${p.sitterMatchBadge}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function filterMatrixTable(query) {
    const rows = document.querySelectorAll('#matrix-table-body tr');
    rows.forEach(row => {
        const searchVal = row.dataset.search || '';
        if (!query || searchVal.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// --- APEXCHARTS HEATMAP ENGINE ---
function renderHeatmapChart() {
    const container = document.getElementById('heatmap-chart');
    if (!container) return;

    const players = sitterData.players || [];
    if (players.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">No player coverage data to render heatmap.</div>`;
        return;
    }

    const hoursCategories = [];
    for (let h = 0; h < 24; h++) {
        hoursCategories.push(`${h < 10 ? '0' + h : h}:00`);
    }

    const series = [];

    players.forEach(p => {
        const activeHours = p.activeHours || new Array(24).fill(false);
        const dataPoints = [];

        for (let h = 0; h < 24; h++) {
            let val = 0;
            if (activeHours[h]) {
                val = 2; // Active
            } else {
                let prevH = (h - 1 + 24) % 24;
                let nextH = (h + 1) % 24;
                if (activeHours[prevH] || activeHours[nextH]) {
                    val = 1; // Adjacent
                }
            }
            dataPoints.push({ x: hoursCategories[h], y: val });
        }

        let allyTag = p.ally && p.ally !== "Unknown" ? `[${p.ally}] ` : '';
        series.push({
            name: `${allyTag}${p.ign}`,
            data: dataPoints
        });
    });

    const options = {
        series: series,
        chart: {
            type: 'heatmap',
            height: Math.max(380, series.length * 26),
            background: 'transparent',
            toolbar: { show: false }
        },
        dataLabels: { enabled: false },
        stroke: { width: 1, colors: ['#13161e'] },
        plotOptions: {
            heatmap: {
                radius: 2,
                enableShades: false,
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, color: '#ff7675', name: 'Inactive (Pastel Red)' },
                        { from: 1, to: 1, color: '#ffeaa7', name: 'Adjacent (Pastel Yellow)' },
                        { from: 2, to: 2, color: '#55efc4', name: 'Active (Pastel Green)' }
                    ]
                }
            }
        },
        theme: { mode: 'dark' },
        xaxis: {
            categories: hoursCategories,
            labels: { style: { colors: '#8b949e', fontSize: '10px' } }
        },
        yaxis: {
            labels: { style: { colors: '#e8eaf0', fontSize: '11px', fontWeight: 600 } }
        },
        tooltip: {
            theme: 'dark',
            custom: function({ seriesIndex, dataPointIndex, w }) {
                let player = players[seriesIndex];
                let hourStr = hoursCategories[dataPointIndex];
                let val = w.config.series[seriesIndex].data[dataPointIndex].y;
                let statusText = val === 2 ? '🟢 ACTIVE' : (val === 1 ? '🟡 ADJACENT COVERAGE' : '🔴 INACTIVE');
                
                return `<div style="padding:10px; font-size:12px; background:#191c26; border:1px solid #2f3640; border-radius:6px;">
                    <div><strong>${player.ign}</strong> [${player.ally || 'None'}]</div>
                    <div style="font-size:11px; color:#8b949e; margin-top:4px;">Hour: <code>${hourStr} Server Time</code></div>
                    <div style="margin-top:6px; font-weight:700;">${statusText}</div>
                </div>`;
            }
        }
    };

    if (chartInstance) {
        chartInstance.destroy();
    }
    chartInstance = new ApexCharts(container, options);
    chartInstance.render();
}

// --- TAB 2: MY PROFILE ENGINE ---
function render24HourSelector() {
    const grid = document.getElementById('hours-selector-grid');
    if (!grid) return;

    let html = '';
    for (let h = 0; h < 24; h++) {
        let hourStr = `${h < 10 ? '0' + h : h}:00`;
        html += `
            <div class="hour-box" data-hour="${h}">
                <div class="h-time">${hourStr}</div>
                <div class="h-status" id="hb-status-${h}">OFF</div>
            </div>
        `;
    }
    grid.innerHTML = html;

    // Delegated click handler for MV3 CSP compliance (no inline onclick)
    grid.addEventListener('click', (e) => {
        const box = e.target.closest('.hour-box');
        if (!box) return;
        const h = parseInt(box.dataset.hour);
        if (!isNaN(h)) {
            profileActiveHours[h] = !profileActiveHours[h];
            updateHourBoxUi(h);
            updateProfileSummary();
        }
    });
}

function updateHourBoxUi(h) {
    const box = document.querySelector(`.hour-box[data-hour="${h}"]`);
    const statusEl = document.getElementById(`hb-status-${h}`);
    if (!box) return;

    if (profileActiveHours[h]) {
        box.classList.add('active');
        if (statusEl) statusEl.textContent = 'ACTIVE';
    } else {
        box.classList.remove('active');
        if (statusEl) statusEl.textContent = 'OFF';
    }
}

function updateProfileSummary() {
    let activeCount = profileActiveHours.filter(Boolean).length;
    let pct = Math.round((activeCount / 24) * 100);
    const summaryEl = document.getElementById('prof-cov-summary');
    if (summaryEl) {
        summaryEl.textContent = `${activeCount}h (${pct}%)`;
    }
}

function populateProfileForm() {
    const current = sitterData.currentMember || {};
    const infoEl = document.getElementById('profile-identity-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <div style="font-size: 13px; font-weight: 700; color: #fff;">👤 Operative IGN: <strong>${current.ign || 'Unknown'}</strong></div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Registered Discord ID: <code>${current.discordId || '--'}</code></div>
        `;
    }

    const players = sitterData.players || [];
    const myIgn = (current.ign || '').toLowerCase();

    const currS1 = current.s1 || '';
    const currS2 = current.s2 || '';
    const currSitList = current.iSitFor || [];
    const currT1 = currSitList[0] || '';
    const currT2 = currSitList[1] || '';

    const elS1 = document.getElementById('prof-s1');
    const elS2 = document.getElementById('prof-s2');
    const elT1 = document.getElementById('prof-sit-target1');
    const elT2 = document.getElementById('prof-sit-target2');

    // Build options HTML for Sitter 1 & Sitter 2
    const buildSitterOptions = (selectedIgn) => {
        let opts = `<option value="">None (No Sitter assigned)</option>`;
        players.forEach(p => {
            if (p.ign.toLowerCase() === myIgn) return;
            let slots = p.availableSlots !== undefined ? p.availableSlots : 2;
            let isCurrent = (p.ign.toLowerCase() === selectedIgn.toLowerCase());
            let isFull = (slots <= 0 && !isCurrent);

            if (isFull) {
                opts += `<option value="${p.ign}" disabled style="color:#ff7675;">${p.ign} [${p.ally || 'UNK'}] (FULL - 2/2 slots used)</option>`;
            } else {
                opts += `<option value="${p.ign}">${p.ign} [${p.ally || 'UNK'}] (${slots} slot(s) open)</option>`;
            }
        });
        return opts;
    };

    // Build options HTML for Accounts I Sit
    const buildTargetOptions = () => {
        let opts = `<option value="">None (Not sitting for anyone)</option>`;
        players.forEach(p => {
            if (p.ign.toLowerCase() === myIgn) return;
            opts += `<option value="${p.ign}">${p.ign} [${p.ally || 'UNK'}]</option>`;
        });
        return opts;
    };

    if (elS1) { elS1.innerHTML = buildSitterOptions(currS1); elS1.value = currS1; }
    if (elS2) { elS2.innerHTML = buildSitterOptions(currS2); elS2.value = currS2; }
    if (elT1) { elT1.innerHTML = buildTargetOptions(); elT1.value = currT1; }
    if (elT2) { elT2.innerHTML = buildTargetOptions(); elT2.value = currT2; }

    if (current.activeHours) {
        try {
            let parsed = typeof current.activeHours === 'string' ? JSON.parse(current.activeHours) : current.activeHours;
            if (Array.isArray(parsed) && parsed.length === 24) {
                profileActiveHours = parsed.map(Boolean);
            }
        } catch(e) {}
    } else {
        profileActiveHours = new Array(24).fill(false);
    }

    for (let h = 0; h < 24; h++) {
        updateHourBoxUi(h);
    }
    updateProfileSummary();
}

function saveProfileData() {
    const s1 = document.getElementById('prof-s1') ? document.getElementById('prof-s1').value.trim() : '';
    const s2 = document.getElementById('prof-s2') ? document.getElementById('prof-s2').value.trim() : '';
    const t1 = document.getElementById('prof-sit-target1') ? document.getElementById('prof-sit-target1').value.trim() : '';
    const t2 = document.getElementById('prof-sit-target2') ? document.getElementById('prof-sit-target2').value.trim() : '';

    // Validations
    if (s1 && s2 && s1.toLowerCase() === s2.toLowerCase()) {
        alert("Cannot assign the same operative as both Sitter 1 and Sitter 2.");
        return;
    }
    if (t1 && t2 && t1.toLowerCase() === t2.toLowerCase()) {
        alert("Cannot select the same account twice under Accounts I Sit.");
        return;
    }

    const iSitForList = [t1, t2].filter(Boolean);

    showLoading("Transmitting profile updates to Sitter Network...");

    chrome.tabs.query({url: "*://*.travian.com/*"}, (tabs) => {
        if (tabs && tabs.length > 0) {
            const url = new URL(tabs[0].url);
            chrome.storage.local.get(['discordId'], (res) => {
                let payload = [{
                    action: "sitter_update_profile",
                    extVersion: chrome.runtime.getManifest().version,
                    discordId: res.discordId,
                    s1: s1,
                    s2: s2,
                    iSitFor: iSitForList,
                    activeHours: profileActiveHours
                }];
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: url.hostname, payload: payload }, (rawText) => {
                    hideLoading();
                    if (!rawText) { alert("Network error."); return; }
                    try {
                        let data = JSON.parse(rawText);
                        if (data.status === "ok") {
                            alert("Profile updated and synchronized successfully!");
                            fetchSitterData();
                        } else {
                            alert("Error: " + (data.msg || data.status));
                        }
                    } catch (e) {
                        alert("Server error processing response.");
                    }
                });
            });
        }
    });
}

function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', init);
