/**
 * NULL MAP ENGINE — TROOPS ANALYZER V5
 * Fetches data from GAS backend and renders the Alliance Table + Player Drilldown + ApexCharts.
 */

// ── Tribe → medium icon (for player name column header) ───────────────────
const TRIBE_MEDIUM_ICONS = {
    roman:    'assets/roman_medium.png',
    gaul:     'assets/gaul_medium.png',
    teuton:   'assets/teuton_medium.png',
    egyptian: 'assets/egyptian_medium.png',
    hun:      'assets/hun_medium.png',
    spartan:  'assets/spartan_medium.png',
};

// ── Tribe → sprite sheet path (16x16 slots, vertical strip) ───────────────
const TRIBE_SPRITE_SHEETS = {
    roman:    'assets/roman_small.png',
    gaul:     'assets/gaul_small.png',
    teuton:   'assets/teuton_small.png',
    egyptian: 'assets/egyptian_small.png',
    hun:      'assets/hun_small.png',
    spartan:  'assets/spartan_small.png',
    nature:   'assets/nature_small.png',
};

function getTribeMediumIcon(tribe) {
    if (!tribe) return '';
    let t = tribe.toLowerCase();
    for (let key in TRIBE_MEDIUM_ICONS) {
        if (t.includes(key)) return TRIBE_MEDIUM_ICONS[key];
    }
    return '';
}

function getTribeSpriteSheet(tribe) {
    if (!tribe) return null;
    let t = tribe.toLowerCase();
    for (let key in TRIBE_SPRITE_SHEETS) {
        if (t.includes(key)) return TRIBE_SPRITE_SHEETS[key];
    }
    return null;
}

// Generates an <img> tag using the sprite sheet at the correct slot (0-indexed)
// Slot 10 (Hero) always uses the dedicated hero.png
function getTroopSpriteHTML(tribe, slotIndex, troopName) {
    if (slotIndex === 10) {
        return `<img src="assets/hero.png" class="troop-sprite" title="${troopName}" alt="${troopName}">`;
    }
    let sheet = getTribeSpriteSheet(tribe);
    if (!sheet) return `<span title="${troopName}">${troopName.substring(0,3)}</span>`;
    let yOffset = slotIndex * 14;
    return `<span class="troop-sprite-wrap" title="${troopName}" style="background-image:url('${sheet}');background-position:0px -${yOffset}px;"></span>`;
}

// ── Tribe → troop names (11 slots) ───────────────────────────────────────
const TRIBE_TROOP_NAMES = {
    roman:    ['Legionnaire','Praetorian','Imperian','Equites Legati','Equites Imperatoris','Equites Caesaris','Battering Ram','Fire Catapult','Senator','Settler','Hero'],
    gaul:     ['Phalanx','Swordsman','Pathfinder','Theutates Thunder','Druidrider','Haeduan','Ram','Trebuchet','Chieftain','Settler','Hero'],
    teuton:   ['Clubswinger','Spearman','Axeman','Scout','Paladin','Teutonic Knight','Ram','Catapult','Chief','Settler','Hero'],
    egyptian: ['Slave Militia','Ash Warden','Khopesh Warrior','Sopdu Explorer','Anhur Guard','Resheph Chariot','Ram','Stone Catapult','Nomarch','Settler','Hero'],
    hun:      ['Mercenary','Bowman','Spotter','Steppe Rider','Marksman','Marauder','Ram','Catapult','Logades','Settler','Hero'],
    spartan:  ['Hoplite','Sentinel','Edolon','Xiphos Rider','Corinthian Rider','Thessalian Horseman','Ram','Catapult','Ephor','Settler','Hero'],
};

function getTroopNames(tribe) {
    if (!tribe) return Array(11).fill('Troop');
    let t = tribe.toLowerCase();
    for (let key in TRIBE_TROOP_NAMES) {
        if (t.includes(key)) return TRIBE_TROOP_NAMES[key];
    }
    return Array(11).fill('Troop');
}

// ── State ─────────────────────────────────────────────────────────────────
let allPlayers = [];
let dateHeaders = [];
let sortCol = 'totalOff';
let sortDir = 'desc';
let filterText = '';
let selectedIGN = null;
let apexChartInstance = null;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// ── DOM Refs ──────────────────────────────────────────────────────────────
const loadingOverlay   = document.getElementById('loading-overlay');
const loadingText      = document.getElementById('loading-text');
const lastUpdatedLabel = document.getElementById('last-updated-label');
const searchInput      = document.getElementById('search-input');
const allianceTbody    = document.getElementById('alliance-tbody');
const kpiOff           = document.getElementById('kpi-total-off');
const kpiDef           = document.getElementById('kpi-total-def');
const kpiSynced        = document.getElementById('kpi-synced');
const placeholder      = document.getElementById('drilldown-placeholder');
const drilldownContent = document.getElementById('drilldown-content');
const ddPlayerName     = document.getElementById('dd-player-name');
const ddPlayerMeta     = document.getElementById('dd-player-meta');
const ddOff            = document.getElementById('dd-off');
const ddDef            = document.getElementById('dd-def');
const ddScout          = document.getElementById('dd-scout');
const ddVillages       = document.getElementById('dd-villages');
const villageThead     = document.getElementById('village-thead'); // Deprecated, kept to avoid null reference error temporarily
const villageTbody     = document.getElementById('village-tbody'); // Deprecated
const tabVillages      = document.getElementById('tab-villages');
const tabEvolution     = document.getElementById('tab-evolution');
const chartContainer   = document.getElementById('chart-container');

// ── Utilities ─────────────────────────────────────────────────────────────
function fmt(n) {
    if (n === undefined || n === null || isNaN(n)) return '—';
    return Number(n).toLocaleString();
}
function getStatusInfo(lastUpdateISO) {
    if (!lastUpdateISO) return { cls: 's-missing', label: 'Never' };
    let diff = Date.now() - new Date(lastUpdateISO).getTime();
    if (diff < 0) diff = 0;
    if (diff > THREE_DAYS_MS) {
        let days = Math.floor(diff / 86400000);
        return { cls: 's-outdated', label: `${days}d ago` };
    }
    let hours = Math.floor(diff / 3600000);
    if (hours < 1) return { cls: 's-synced', label: 'Just now' };
    return { cls: 's-synced', label: `${hours}h ago` };
}

// ── Data Fetching ─────────────────────────────────────────────────────────
function loadData() {
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = 'Connecting to Oracle...';

    const urlParams = new URLSearchParams(window.location.search);
    const serverParam = urlParams.get('server');

    if (serverParam) {
        fetchDataForServer(serverParam);
    } else {
        chrome.tabs.query({ url: "*://*.travian.com/*" }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                loadingText.textContent = '⚠️ Navigate to Travian first.';
                return;
            }
            const url = new URL(tabs[0].url);
            fetchDataForServer(url.hostname);
        });
    }
}

function fetchDataForServer(hostname) {
    chrome.runtime.sendMessage({
        type: 'FETCH_GAS_GET',
        hostname: hostname,
        params: { action: 'get_troops_data' }
    }, (rawText) => {
        if (!rawText) {
            loadingText.textContent = '❌ No response from server.';
            return;
        }
        try {
            let data = JSON.parse(rawText);
            if (data.status !== 'ok') {
                loadingText.textContent = '❌ Error: ' + (data.message || 'Unknown');
                return;
            }
            allPlayers  = data.players  || [];
            dateHeaders = data.dateHeaders || [];
            lastUpdatedLabel.textContent = 'Updated: ' + new Date().toLocaleTimeString();
            renderAlliance();
            loadingOverlay.classList.add('hidden');
        } catch(e) {
            loadingText.textContent = '❌ Parse error: ' + e.message;
        }
    });
}

// ── Alliance Table ─────────────────────────────────────────────────────────
function renderAlliance() {
    // Compute KPIs
    let totalOff = 0, totalDef = 0, syncedCount = 0;
    allPlayers.forEach(p => {
        totalOff += (p.totalOff || 0);
        totalDef += (p.totalDef || 0);
        let diff = p.lastUpdate ? Date.now() - new Date(p.lastUpdate).getTime() : Infinity;
        if (diff < THREE_DAYS_MS) syncedCount++;
    });
    kpiOff.textContent    = fmt(totalOff);
    kpiDef.textContent    = fmt(totalDef);
    kpiSynced.textContent = `${syncedCount}/${allPlayers.length}`;

    // Filter
    let filtered = allPlayers.filter(p => {
        if (!filterText) return true;
        return p.ign.toLowerCase().includes(filterText) || (p.ally || '').toLowerCase().includes(filterText);
    });

    // Sort
    filtered.sort((a, b) => {
        let av = a[sortCol], bv = b[sortCol];
        if (sortCol === 'ign') {
            av = (av || '').toLowerCase(); bv = (bv || '').toLowerCase();
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        if (sortCol === 'lastUpdate') {
            av = av ? new Date(av).getTime() : 0;
            bv = bv ? new Date(bv).getTime() : 0;
        }
        av = Number(av) || 0; bv = Number(bv) || 0;
        return sortDir === 'asc' ? av - bv : bv - av;
    });

    // Render rows
    allianceTbody.innerHTML = '';
    filtered.forEach(p => {
        let { cls, label } = getStatusInfo(p.lastUpdate);
        let icon = getTribeMediumIcon(p.tribe);
        let nameCell = p.profileUrl
            ? `<a href="${p.profileUrl}" target="_blank" rel="noopener">${p.ign}</a>`
            : p.ign;

        let tr = document.createElement('tr');
        if (p.ign === selectedIGN) tr.classList.add('selected');
        tr.innerHTML = `
            <td class="player-name">
                ${icon ? `<img src="${icon}" class="tribe-icon" style="image-rendering:pixelated;" alt="${p.tribe}">` : ''}
                ${nameCell}
            </td>
            <td class="power-val off-val">${fmt(p.totalOff)}</td>
            <td class="power-val def-val">${fmt(p.totalDef)}</td>
            <td>
                <span class="status-dot ${cls}"></span>
                <span class="sync-label">${label}</span>
            </td>`;
        tr.addEventListener('click', () => openDrilldown(p));
        allianceTbody.appendChild(tr);
    });
}

// ── Sorting ────────────────────────────────────────────────────────────────
document.querySelectorAll('#alliance-table thead th').forEach(th => {
    th.addEventListener('click', () => {
        let col = th.dataset.col;
        if (sortCol === col) {
            sortDir = sortDir === 'desc' ? 'asc' : 'desc';
        } else {
            sortCol = col;
            sortDir = col === 'ign' ? 'asc' : 'desc';
        }
        document.querySelectorAll('#alliance-table thead th').forEach(h => {
            h.classList.remove('sorted');
            let arrow = h.querySelector('.sort-arrow');
            if (arrow) arrow.textContent = '↕';
        });
        th.classList.add('sorted');
        let arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = sortDir === 'desc' ? '↓' : '↑';
        renderAlliance();
    });
});

searchInput.addEventListener('input', () => {
    filterText = searchInput.value.trim().toLowerCase();
    renderAlliance();
});

// ── Player Drilldown ──────────────────────────────────────────────────────
function openDrilldown(player) {
    selectedIGN = player.ign;
    renderAlliance(); // Re-render to update selected row

    // Header — use medium tribe icon
    let medIcon = getTribeMediumIcon(player.tribe);
    ddPlayerName.innerHTML = `${medIcon ? `<img src="${medIcon}" style="width:16px;height:16px;image-rendering:pixelated;vertical-align:middle;margin-right:6px;border-radius:3px;">` : ''} ${player.ign}`;
    let syncInfo = getStatusInfo(player.lastUpdate);
    let syncDate = player.lastUpdate ? new Date(player.lastUpdate).toLocaleDateString() : 'Never';
    ddPlayerMeta.textContent = `[${player.tribe || '—'}]  ·  ${player.ally || '—'}  ·  Last Sync: ${syncDate}`;

    ddOff.textContent    = fmt(player.totalOff);
    ddDef.textContent    = fmt(player.totalDef);
    ddScout.textContent  = fmt(player.totalScout);
    ddVillages.textContent = (player.villages || []).length;

    placeholder.classList.add('hidden');
    drilldownContent.classList.remove('hidden');

    // Render villages tab
    renderVillageTable(player);

    // Re-render chart if evolution tab is active
    if (document.querySelector('.dd-tab.active').dataset.tab === 'evolution') {
        renderEvolutionChart(player);
    }
}

function renderVillageTable(player) {
    let villages = player.villages || [];
    const container = document.getElementById('villages-container');
    container.innerHTML = '';

    if (villages.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;">No data available</div>`;
        return;
    }

    // Group villages by tribe
    let villagesByTribe = {};
    villages.forEach(v => {
        let tName = v.tribe || player.tribe || 'Unknown';
        if (!villagesByTribe[tName]) villagesByTribe[tName] = [];
        villagesByTribe[tName].push(v);
    });

    for (let tribe in villagesByTribe) {
        let tribeVillages = villagesByTribe[tribe];
        let names = getTroopNames(tribe);
        
        // Sums for this tribe group
        let sumOff = 0;
        let sumDef = 0;
        let sumTroops = Array(11).fill(0);

        tribeVillages.forEach(v => {
            let t = v.t || []; while (t.length < 11) t.push(0);
            sumOff += (v.off || 0);
            sumDef += (v.def || 0);
            for(let i=0; i<11; i++) {
                sumTroops[i] += (Number(t[i]) || 0);
            }
        });

        // Build headers
        let headerCells = names.slice(0, 10).map((name, i) =>
            `<th class="troop-th" title="${name}">${getTroopSpriteHTML(tribe, i, name)}</th>`
        ).join('');
        let heroHeader = `<th class="troop-th" title="${names[10]}">${getTroopSpriteHTML(tribe, 10, names[10])}</th>`;

        let tableHtml = `
        <div style="margin-bottom: 20px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom: 6px; padding-left: 4px;">
                ${getTribeMediumIcon(tribe) ? `<img src="${getTribeMediumIcon(tribe)}" style="width:16px;height:16px;image-rendering:pixelated;vertical-align:middle;border-radius:3px;">` : ''}
                <span style="font-size:11px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:1px;">${tribe} VILLAGES</span>
            </div>
            <table class="village-table">
                <thead>
                    <tr>
                        <th class="vname-cell">Village</th>
                        <th>Role</th>
                        ${headerCells}
                        ${heroHeader}
                        <th><span title="Offensive Crop" style="color:var(--off-color);font-size:9px;">OFF🌾</span></th>
                        <th><span title="Defensive Crop" style="color:var(--def-color);font-size:9px;">DEF🌾</span></th>
                    </tr>
                </thead>
                <tbody>
        `;

        tribeVillages.forEach(v => {
            let t = v.t || []; while (t.length < 11) t.push(0);
            let role = v.role || 'UNKNOWN';
            let roleClass = `role-${role}`;
            let tCells = t.slice(0, 11).map(val => {
                let n = Number(val) || 0;
                return `<td class="${n > 0 ? 'troop-has' : 'troop-zero'}">${n > 0 ? fmt(n) : '·'}</td>`;
            }).join('');

            tableHtml += `
                <tr>
                    <td class="vname-cell" title="${v.vName}">${v.vName || '—'}</td>
                    <td><span class="role-badge ${roleClass}">${role}</span></td>
                    ${tCells}
                    <td class="off-val power-val">${fmt(v.off)}</td>
                    <td class="def-val power-val">${fmt(v.def)}</td>
                </tr>
            `;
        });

        // Sum row
        let sumCells = sumTroops.map(n => `<td class="${n > 0 ? 'troop-has' : 'troop-zero'}">${n > 0 ? fmt(n) : '·'}</td>`).join('');
        tableHtml += `
                <tr style="background: rgba(0,0,0,0.15); border-top: 1px solid var(--border);">
                    <td class="vname-cell" style="color:var(--gold);">Total</td>
                    <td></td>
                    ${sumCells}
                    <td class="off-val power-val" style="color:var(--gold);">${fmt(sumOff)}</td>
                    <td class="def-val power-val" style="color:var(--gold);">${fmt(sumDef)}</td>
                </tr>
                </tbody>
            </table>
        </div>
        `;

        container.innerHTML += tableHtml;
    }
}

// ── Evolution Chart ───────────────────────────────────────────────────────
function renderEvolutionChart(player) {
    if (apexChartInstance) {
        apexChartInstance.destroy();
        apexChartInstance = null;
    }
    chartContainer.innerHTML = '';

    let history = player.history || {};
    // Build sorted date array using the global dateHeaders order
    let dates = dateHeaders.filter(d => history[d]);
    if (dates.length === 0) {
        chartContainer.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:60px 20px;">No historical data yet.<br>Data accumulates with each scan.</div>';
        return;
    }

    let offSeries = dates.map(d => history[d].off || 0);
    let defSeries = dates.map(d => history[d].def || 0);

    let options = {
        chart: {
            type: 'area',
            height: 260,
            background: 'transparent',
            toolbar: { show: false },
            animations: { enabled: true, speed: 500 },
            fontFamily: 'Inter, sans-serif',
            foreColor: '#6b7280',
        },
        theme: { mode: 'dark' },
        series: [
            { name: '⚔️ Offensive 🌾', data: offSeries, color: '#ff4757' },
            { name: '🛡️ Defensive 🌾', data: defSeries, color: '#1e90ff' },
        ],
        xaxis: {
            categories: dates,
            labels: { style: { fontSize: '10px', colors: '#6b7280' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { fontSize: '10px', colors: '#6b7280' },
                formatter: (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v,
            }
        },
        grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100]
            }
        },
        markers: { size: dates.length <= 10 ? 4 : 0, hover: { size: 6 } },
        tooltip: {
            theme: 'dark',
            y: { formatter: (v) => v.toLocaleString() + ' 🌾' }
        },
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px' },
        dataLabels: { enabled: false },
    };

    apexChartInstance = new ApexCharts(chartContainer, options);
    apexChartInstance.render();
}

// ── Tab Switching ─────────────────────────────────────────────────────────
document.querySelectorAll('.dd-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.dd-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        let which = tab.dataset.tab;
        tabVillages.classList.toggle('hidden',  which !== 'villages');
        tabEvolution.classList.toggle('hidden', which !== 'evolution');
        if (which === 'evolution' && selectedIGN) {
            let p = allPlayers.find(x => x.ign === selectedIGN);
            if (p) renderEvolutionChart(p);
        }
    });
});

// ── Refresh button ────────────────────────────────────────────────────────
document.getElementById('btn-refresh').addEventListener('click', loadData);

// ── Boot ──────────────────────────────────────────────────────────────────
loadData();

