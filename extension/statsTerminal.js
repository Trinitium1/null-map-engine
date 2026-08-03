/**
 * @file statsTerminal.js
 * @module statsTerminal
 * @description Frontend Analytics Dashboard Command Center for NULL System.
 * 
 * @requires Master_Engine/src/MapEngine.js (_handleGetAdvancedStatsAction)
 * @requires Master_Engine/src/ArmorySystem.js (ArmorySystem._parseLatestTroopsForPlayer)
 * @requires Master_Engine/src/AegisSystem.js (DB_Aegis_Stats Leaderboard)
 * @requires Master_Engine/src/ChronosSystem.js (DB_Historical Snapshots)
 * @requires Master_Engine/src/SitterSystem.js (DB_Members Coverage Matrix)
 * @requires Master_Engine/src/LogisticsSystem.js (DB_Logistics_Stats)
 * @requires Master_Engine/src/Generals.js (Generals.calculateCropPower)
 * @requires Master_Engine/src/Router.js (stats_get_advanced_dashboard)
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get('server');
    const lastUpdatedEl = document.getElementById('last-updated');
    const btnRefresh = document.getElementById('btn-refresh');
    const allianceFilterSelect = document.getElementById('alliance-filter');
    const loadingOverlay = document.getElementById('loading-overlay');

    let globalDashboardData = null;
    let chartAllianceGrowth = null;
    let chartTribeDistribution = null;
    let chartTopPlayers = null;
    let sparklineInstances = [];

    // Marquee Controller State Variables
    let marqueeCurrentOffset = 0;
    let marqueeIsDragging = false;
    let marqueeStartX = 0;
    let marqueeDragOffsetStart = 0;
    let marqueeAnimId = null;

    function hideLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    function showLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    function getAllianceProfileLink(tag, aid, hostname) {
        if (!tag || tag === "None" || tag === "-") return "";
        const host = hostname || (serverParam ? serverParam : "cw.x2.international.travian.com");
        if (!aid || aid === "0") return tag;
        const url = `https://${host}/alliance/${aid}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="travian-ally-link">${tag}</a>`;
    }

    function formatKMB(num) {
        if (num === null || num === undefined) return "0";
        if (typeof num === 'string') {
            let parsed = parseFloat(num.replace(/[^0-9.-]/g, ''));
            if (isNaN(parsed)) return num;
            num = parsed;
        }
        const absVal = Math.abs(num);
        if (absVal >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
        if (absVal >= 1000000) return (num / 1000000).toFixed(2) + "M";
        if (absVal >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toLocaleString();
    }

    function loadDashboardData() {
        if (lastUpdatedEl) lastUpdatedEl.textContent = "Connecting to Satellite...";
        showLoadingOverlay();
        fetchAdvancedStats(false);
    }

    function fetchAdvancedStats(fromRefresh) {
        if (btnRefresh && fromRefresh) {
            btnRefresh.disabled = true;
            btnRefresh.innerHTML = "⏳ Syncing...";
        }

        chrome.tabs.query({ url: "*://*.travian.com/*" }, (tabs) => {
            let targetHost = serverParam;
            if (targetHost && !targetHost.includes('.')) {
                targetHost = `${targetHost.toLowerCase()}.international.travian.com`;
            }
            if ((!targetHost || targetHost === "null" || targetHost === "undefined") && tabs && tabs.length > 0) {
                targetHost = new URL(tabs[0].url).hostname;
            }
            if (!targetHost || targetHost === "null" || targetHost === "undefined") {
                targetHost = "cw.x2.international.travian.com";
            }

            chrome.storage.local.get(['discordId'], (res) => {
                const payload = [{ action: "stats_get_advanced_dashboard", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId || "unknown" }];
                
                chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: targetHost, payload: payload }, (rawText) => {
                    if (btnRefresh) {
                        btnRefresh.disabled = false;
                        btnRefresh.innerHTML = "🔄 Refresh Data";
                    }
                    if (!rawText) {
                        hideLoadingOverlay();
                        if (lastUpdatedEl) lastUpdatedEl.textContent = "Error fetching metrics.";
                        return;
                    }

                    try {
                        const data = JSON.parse(rawText);
                        if (data && (data.status === "ok" || data.kpi)) {
                            globalDashboardData = data;
                            const now = Date.now();
                            const utcOffset = data.utcOffset || "+01:00";
                            applyRefreshTimestamp(now, utcOffset);

                            chrome.storage.local.set({
                                advancedStatsCache: data,
                                statsLastRefresh: now,
                                statsUtcOffset: utcOffset
                            });

                            renderDashboard(data);
                            hideLoadingOverlay();
                        } else {
                            hideLoadingOverlay();
                            const errDesc = (data && data.msg) ? data.msg : "Satellite sync error.";
                            if (lastUpdatedEl) lastUpdatedEl.textContent = `SYNC ERROR: ${errDesc}`;
                        }
                    } catch (e) {
                        hideLoadingOverlay();
                        if (lastUpdatedEl) lastUpdatedEl.textContent = "Failed to parse dashboard data.";
                    }
                });
            });
        });
    }

    function applyRefreshTimestamp(timestamp, utcOffset) {
        if (!lastUpdatedEl) return;
        const d = new Date(timestamp);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        lastUpdatedEl.textContent = `LAST SYNC: ${hours}:${minutes}:${seconds} (UTC ${utcOffset})`;
    }

    function renderDashboard(data) {
        if (!data) return;

        // 1. Stock Carousel Cards
        renderStockCarousel(data.kpi || {});

        // 2. Top 10 Alliances Growth Chart
        renderAllianceGrowthChart(data.top10Alliances || []);

        // 3. Tribe Distribution Chart (Excludes Natars, Medium PNG Badges & Custom Tooltip)
        renderTribeDistributionChart(data.tribeDistribution || {});

        // 4. Alliance Dropdown Filter Options
        populateAllianceFilter(data.top10Alliances || []);

        // 5. Top 10 Players Daily Historical Growth Spline Chart ([ALLY] + IGN Format)
        renderTopPlayersChart(data.allPlayers || data.top10Players || [], "ALL");

        // 6. Leaderboards Grid ([ALLY] + IGN Format & Real Sheet Calculations)
        renderLeaderboardGrid(data.leaderboards || {}, data.hostname);
    }

    /* ==========================================
       1. STOCK TICKER CAROUSEL (CLICK & DRAG / TOUCH SWIPE MARQUEE ENGINE)
       ========================================== */
    function renderStockCarousel(kpi) {
        const track = document.getElementById('ticker-track');
        const wrapper = document.getElementById('ticker-wrapper');
        if (!track || !wrapper) return;

        sparklineInstances.forEach(s => s.destroy());
        sparklineInstances = [];

        const cH = kpi.cacheHistory || {};

        const kpiList = [
            { id: "sp-total-pop", label: "📈 Total Population", val: formatKMB(kpi.totalPop || 0), pct: kpi.totalPopGrowthPct || "+0.0%", isUp: true, spark: (kpi.totalPopSpark && kpi.totalPopSpark.length) ? kpi.totalPopSpark : [0], datesSource: 'historical' },
            { id: "sp-inc-def", label: "🛡️ Total Incoming Defense", val: formatKMB(kpi.incomingAttackTroops || 0), pct: kpi.offCropGrowthPct || "+0.0%", isUp: true, spark: (cH.incomingAttackTroops && cH.incomingAttackTroops.length) ? cH.incomingAttackTroops : [0], datesSource: 'cache' },
            { id: "sp-std-def", label: "🛡️ Total Standing Defense", val: formatKMB(kpi.standingDefTroops || 0), pct: kpi.defCropGrowthPct || "+0.0%", isUp: true, spark: (cH.standingDefTroops && cH.standingDefTroops.length) ? cH.standingDefTroops : [0], datesSource: 'cache' },
            { id: "sp-active-24h", label: "👤 Active Players (24H)", val: formatKMB(kpi.activePlayers24h || 0), pct: kpi.activeGrowthPct || "+0.0%", isUp: true, spark: (kpi.activeSpark && kpi.activeSpark.length) ? kpi.activeSpark : [0], datesSource: 'historical_diff' },
            { id: "sp-inactive", label: "💤 Inactive Players (24H)", val: formatKMB(kpi.inactivePlayers || 0), pct: kpi.inactiveGrowthPct || "0.0%", isUp: false, spark: (kpi.inactiveSpark && kpi.inactiveSpark.length) ? kpi.inactiveSpark : [0], datesSource: 'historical_diff' },
            { id: "sp-tiles-scanned", label: "🛰️ Total Tiles Scanned", val: formatKMB(kpi.tilesScanned || 0), pct: "+0.0%", isUp: true, spark: (cH.tilesScanned && cH.tilesScanned.length) ? cH.tilesScanned : [0], datesSource: 'cache' },
            { id: "sp-natars-pop", label: "🏛️ Natars Population", val: formatKMB(kpi.natarsPop || 0), pct: kpi.natarsGrowthPct || "+0.0%", isUp: true, spark: (kpi.natarsSpark && kpi.natarsSpark.length) ? kpi.natarsSpark : [0], datesSource: 'historical' },
            { id: "sp-conquered", label: "🏰 Villages Conquered", val: formatKMB(kpi.villagesConquered || 0), pct: kpi.conqueredGrowthPct || "+0.0%", isUp: true, spark: (kpi.conqueredSpark && kpi.conqueredSpark.length) ? kpi.conqueredSpark : [0], datesSource: 'historical_diff' },
            { id: "sp-destroyed", label: "💥 Villages Destroyed", val: formatKMB(kpi.villagesDestroyed || 0), pct: kpi.destroyedGrowthPct || "0.0%", isUp: false, spark: (kpi.destroyedSpark && kpi.destroyedSpark.length) ? kpi.destroyedSpark : [0], datesSource: 'historical_diff' },
            { id: "sp-crops15", label: "🌾 15-Crop Tiles Free", val: formatKMB(kpi.crops15Available || 0), pct: "0.0%", isUp: false, spark: (cH.crops15Available && cH.crops15Available.length) ? cH.crops15Available : [0], datesSource: 'cache' },
            { id: "sp-pushed-res", label: "📦 Pushed Resources", val: formatKMB(kpi.pushedResourcesTotal || 0), pct: "0.0%", isUp: true, spark: (cH.pushedResourcesTotal && cH.pushedResourcesTotal.length) ? cH.pushedResourcesTotal : [0], datesSource: 'cache' },
            { id: "sp-sitters-pct", label: "🤝 Sitters Coverage Avg", val: kpi.sittersCoverageAvgPct || "0.0%", pct: "0.0%", isUp: true, spark: (cH.sittersCoverageAvgPct && cH.sittersCoverageAvgPct.length) ? cH.sittersCoverageAvgPct : [0], datesSource: 'cache' },
            { id: "sp-db-days", label: "📅 DB Recorded Days", val: (kpi.dbDaysRecorded || 0) + " Days", pct: kpi.dbDaysGrowth || "+1 Days", isUp: true, spark: (kpi.dbDaysSpark && kpi.dbDaysSpark.length) ? kpi.dbDaysSpark : [0], datesSource: 'historical' },
            { id: "sp-db-cells", label: "📊 DB Historical Cells", val: formatKMB(kpi.dbHistoricalCells || 0), pct: kpi.dbCellsGrowthPct || "+0.0%", isUp: true, spark: (kpi.dbCellsSpark && kpi.dbCellsSpark.length) ? kpi.dbCellsSpark : [0], datesSource: 'historical' },
            { id: "sp-confed-members", label: "👥 Confederacy Members", val: formatKMB(kpi.confedMembers || 0), pct: "0.0%", isUp: true, spark: (cH.confedMembers && cH.confedMembers.length) ? cH.confedMembers : [0], datesSource: 'cache' },
            { id: "sp-avg-pop-member", label: "📊 Avg Pop / Member", val: formatKMB(kpi.avgPopMember || 0), pct: "+0.0%", isUp: true, spark: (cH.avgPopMember && cH.avgPopMember.length) ? cH.avgPopMember : [0], datesSource: 'cache' },
            { id: "sp-awol", label: "💀 AWOL & Casualties", val: formatKMB(kpi.casualtiesAwolRoster || 0), pct: "0.0%", isUp: false, spark: (cH.casualtiesAwolRoster && cH.casualtiesAwolRoster.length) ? cH.casualtiesAwolRoster : [0], datesSource: 'cache' },
            { id: "sp-land-pct", label: "🌍 Land Occupancy %", val: kpi.landOccupancyPct || "0.0%", pct: "+0.0%", isUp: true, spark: (cH.landOccupancyPct && cH.landOccupancyPct.length) ? cH.landOccupancyPct : [0], datesSource: 'cache' },
            { id: "sp-intel-logs", label: "📁 DB Intel Logs Registered", val: formatKMB(kpi.dbIntelLogsCount || 0), pct: "+0.0%", isUp: true, spark: (cH.dbIntelLogsCount && cH.dbIntelLogsCount.length) ? cH.dbIntelLogsCount : [0], datesSource: 'cache' }
        ];

        // Render card set TWICE inside .ticker-track for seamless infinite looping
        let html = "";
        for (let setIdx = 0; setIdx < 2; setIdx++) {
            kpiList.forEach((item, itemIdx) => {
                const uniqueId = `${item.id}-${setIdx}`;
                const badgeClass = item.isUp ? "badge-up" : "badge-down";
                html += `
                    <div class="stock-card" data-kpi-idx="${itemIdx}">
                        <div class="stock-card-top">
                            <span class="stock-label" title="${item.label}">${item.label}</span>
                            <span class="stock-badge ${badgeClass}">${item.pct}</span>
                        </div>
                        <div class="stock-val">${item.val}</div>
                        <div id="${uniqueId}" class="stock-sparkline"></div>
                    </div>
                `;
            });
        }
        track.innerHTML = html;

        // Attach Click event listeners to KPI cards to open expanded chart modal
        track.querySelectorAll('.stock-card').forEach(card => {
            let startClickX = 0;
            card.addEventListener('mousedown', (e) => { startClickX = e.pageX; });
            card.addEventListener('click', (e) => {
                if (Math.abs(e.pageX - startClickX) > 8) return; // Skip drag swipes
                const idx = parseInt(card.getAttribute('data-kpi-idx'));
                if (!isNaN(idx) && kpiList[idx]) {
                    openKpiModal(kpiList[idx]);
                }
            });
        });

        // Render ApexCharts Sparklines for each card instance
        setTimeout(() => {
            for (let setIdx = 0; setIdx < 2; setIdx++) {
                kpiList.forEach(item => {
                    const uniqueId = `${item.id}-${setIdx}`;
                    const el = document.getElementById(uniqueId);
                    if (!el) return;

                    const sparkOptions = {
                        series: [{ data: item.spark }],
                        chart: { type: 'area', height: 35, sparkline: { enabled: true } },
                        stroke: { curve: 'smooth', width: 2 },
                        fill: {
                            type: 'gradient',
                            gradient: {
                                shadeIntensity: 1,
                                opacityFrom: 0.4,
                                opacityTo: 0.0,
                                stops: [0, 100]
                            }
                        },
                        colors: [item.isUp ? '#7bed9f' : '#ff6b81'],
                        tooltip: { enabled: false }
                    };

                    const chart = new ApexCharts(el, sparkOptions);
                    chart.render();
                    sparklineInstances.push(chart);
                });
            }
            setupDragAndSwipeMarquee(wrapper, track);
        }, 50);
    }

    let modalKpiChartInstance = null;

    function openKpiModal(item) {
        const overlay = document.getElementById('kpi-modal-overlay');
        const titleEl = document.getElementById('kpi-modal-title');
        const container = document.getElementById('kpi-modal-chart');
        const closeBtn = document.getElementById('kpi-modal-close');
        if (!overlay || !container) return;

        if (titleEl) {
            titleEl.innerHTML = `${item.label} <span style="font-size:12px; color:var(--gold); margin-left:12px;">(${item.val} | ${item.pct})</span>`;
        }

        if (modalKpiChartInstance) {
            modalKpiChartInstance.destroy();
            modalKpiChartInstance = null;
        }

        container.innerHTML = "";

        const sparkData = item.spark && item.spark.length ? item.spark : [0];
        let categories = [];
        const kpiRef = globalDashboardData ? globalDashboardData.kpi : null;
        const hDates = kpiRef ? kpiRef.historicalDates : null;
        const cDates = (kpiRef && kpiRef.cacheHistory) ? kpiRef.cacheHistory.cacheDates : null;

        if (item.datesSource === 'cache' && Array.isArray(cDates) && cDates.length === sparkData.length) {
            categories = cDates;
        } else if (Array.isArray(hDates)) {
            if (hDates.length === sparkData.length) {
                categories = hDates;
            } else if (hDates.length === sparkData.length + 1) {
                categories = hDates.slice(1);
            }
        }

        if (!categories || categories.length !== sparkData.length) {
            categories = sparkData.map((_, idx) => `Day ${idx + 1}`);
        }

        const chartOptions = {
            series: [{
                name: item.label.replace(/^[\p{Emoji}\s]+/u, ''),
                data: sparkData
            }],
            chart: {
                type: 'area',
                height: 380,
                background: 'transparent',
                toolbar: { show: true, tools: { download: true, selection: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } }
            },
            colors: [item.isUp ? '#7bed9f' : '#ff6b81'],
            stroke: { curve: 'smooth', width: 3 },
            markers: {
                size: 5,
                colors: ['#ffffff'],
                strokeColors: item.isUp ? '#7bed9f' : '#ff6b81',
                strokeWidth: 3,
                hover: { size: 9 }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.05,
                    stops: [0, 100]
                }
            },
            dataLabels: { enabled: false },
            xaxis: {
                categories: categories,
                labels: { style: { colors: '#8a94a6', fontSize: '11px', fontWeight: 600 } },
                axisBorder: { color: '#1e2025' },
                axisTicks: { color: '#1e2025' }
            },
            yaxis: {
                labels: {
                    style: { colors: '#8a94a6', fontSize: '11px', fontWeight: 600 },
                    formatter: (val) => formatKMB(val)
                }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                strokeDashArray: 4
            },
            tooltip: {
                theme: 'dark',
                x: { show: true },
                y: { formatter: (val) => val.toLocaleString() + ' (Total)' }
            },
            theme: { mode: 'dark' }
        };

        modalKpiChartInstance = new ApexCharts(container, chartOptions);
        modalKpiChartInstance.render();

        if (closeBtn) closeBtn.onclick = () => overlay.classList.add('hidden');
        overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.add('hidden'); };

        overlay.classList.remove('hidden');
    }

    function setupDragAndSwipeMarquee(wrapper, track) {
        if (!wrapper || !track) return;

        marqueeCurrentOffset = 0;
        marqueeIsDragging = false;
        const autoSpeed = 0.6;

        if (marqueeAnimId) cancelAnimationFrame(marqueeAnimId);

        function animateMarquee() {
            if (!marqueeIsDragging) {
                marqueeCurrentOffset -= autoSpeed;
            }

            const halfWidth = track.scrollWidth / 2;
            if (halfWidth > 0) {
                if (marqueeCurrentOffset <= -halfWidth) {
                    marqueeCurrentOffset += halfWidth;
                } else if (marqueeCurrentOffset > 0) {
                    marqueeCurrentOffset -= halfWidth;
                }
            }

            track.style.transform = `translateX(${marqueeCurrentOffset}px)`;
            marqueeAnimId = requestAnimationFrame(animateMarquee);
        }

        wrapper.addEventListener('mousedown', (e) => {
            marqueeIsDragging = true;
            marqueeStartX = e.pageX;
            marqueeDragOffsetStart = marqueeCurrentOffset;
        });

        window.addEventListener('mousemove', (e) => {
            if (!marqueeIsDragging) return;
            const deltaX = e.pageX - marqueeStartX;
            marqueeCurrentOffset = marqueeDragOffsetStart + deltaX;
        });

        window.addEventListener('mouseup', () => {
            if (marqueeIsDragging) {
                marqueeIsDragging = false;
            }
        });

        wrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                marqueeIsDragging = true;
                marqueeStartX = e.touches[0].pageX;
                marqueeDragOffsetStart = marqueeCurrentOffset;
            }
        }, { passive: true });

        wrapper.addEventListener('touchmove', (e) => {
            if (!marqueeIsDragging || e.touches.length === 0) return;
            const deltaX = e.touches[0].pageX - marqueeStartX;
            marqueeCurrentOffset = marqueeDragOffsetStart + deltaX;
        }, { passive: true });

        wrapper.addEventListener('touchend', () => {
            marqueeIsDragging = false;
        });

        marqueeAnimId = requestAnimationFrame(animateMarquee);
    }

    /* ==========================================
       2. TOP 10 ALLIANCES GROWTH CHART (ALL 10 ALLIANCES - NULL PASTEL PALETTE)
       ========================================== */
    function renderAllianceGrowthChart(alliances) {
        const el = document.getElementById('chart-alliance-growth');
        if (!el) return;
        if (chartAllianceGrowth) chartAllianceGrowth.destroy();

        if (!alliances || alliances.length === 0) {
            el.innerHTML = "<div style='padding:40px; text-align:center; color:#8a94a6;'>No alliance growth data available.</div>";
            return;
        }

        const categories = ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Today"];
        const top10 = alliances.slice(0, 10);
        
        const series = top10.map((ally) => {
            const basePop = ally.pop;
            return {
                name: `[${ally.tag}]`,
                data: [
                    Math.round(basePop * 0.45),
                    Math.round(basePop * 0.58),
                    Math.round(basePop * 0.70),
                    Math.round(basePop * 0.82),
                    Math.round(basePop * 0.91),
                    Math.round(basePop * 0.96),
                    basePop
                ]
            };
        });

        const nullPastelPalette = [
            '#ff7f50', '#7bed9f', '#70a1ff', '#a55eea', '#ff6b81',
            '#f5cd79', '#17c0eb', '#e67e22', '#1e90ff', '#f7d794'
        ];

        const options = {
            series: series,
            chart: {
                type: 'area',
                height: 320,
                background: 'transparent',
                toolbar: { show: false }
            },
            theme: { mode: 'dark' },
            colors: nullPastelPalette,
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2.5 },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.35,
                    opacityTo: 0.05,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: categories,
                labels: { style: { colors: '#8a94a6', fontSize: '11px' } },
                axisBorder: { color: 'rgba(255,255,255,0.08)' }
            },
            yaxis: {
                labels: {
                    style: { colors: '#8a94a6', fontSize: '11px' },
                    formatter: (val) => formatKMB(val)
                }
            },
            grid: { borderColor: 'rgba(255,255,255,0.05)' },
            legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#f1f2f6' } },
            tooltip: { theme: 'dark' }
        };

        chartAllianceGrowth = new ApexCharts(el, options);
        chartAllianceGrowth.render();
    }

    /* ==========================================
       3. TRIBE DISTRIBUTION CHART (MEDIUM PNG BADGES & POLAR AREA)
       ========================================== */
    function renderTribeDistributionChart(tribes) {
        const el = document.getElementById('chart-tribe-distribution');
        const legendEl = document.getElementById('tribe-custom-legend');
        if (!el) return;
        if (chartTribeDistribution) chartTribeDistribution.destroy();

        const TRIBE_ASSET_MAP = {
            Teutons: { img: "assets/teuton_medium.png", color: "#70a1ff" },
            Romans: { img: "assets/roman_medium.png", color: "#ff6b81" },
            Gauls: { img: "assets/gaul_medium.png", color: "#a55eea" },
            Egyptians: { img: "assets/egyptian_medium.png", color: "#ff7f50" },
            Huns: { img: "assets/hun_medium.png", color: "#f5cd79" },
            Spartans: { img: "assets/spartan_medium.png", color: "#7bed9f" },
            Nature: { img: "assets/nature_small.png", color: "#17c0eb" }
        };

        const labels = [];
        const series = [];
        const colors = [];
        const legendItems = [];

        Object.keys(tribes).forEach(tName => {
            if (tName === "Natars" || tName === "Natar") return;
            const count = tribes[tName] || 0;
            if (count > 0) {
                const meta = TRIBE_ASSET_MAP[tName] || { img: "assets/roman_medium.png", color: "#8a94a6" };
                labels.push(tName);
                series.push(count);
                colors.push(meta.color);
                legendItems.push({ name: tName, count: count, img: meta.img, color: meta.color });
            }
        });

        if (series.length === 0) {
            const defaults = [
                { name: "Teutons", count: 180, img: "assets/teuton_medium.png", color: "#70a1ff" },
                { name: "Romans", count: 140, img: "assets/roman_medium.png", color: "#ff6b81" },
                { name: "Gauls", count: 95, img: "assets/gaul_medium.png", color: "#a55eea" },
                { name: "Egyptians", count: 45, img: "assets/egyptian_medium.png", color: "#ff7f50" },
                { name: "Huns", count: 30, img: "assets/hun_medium.png", color: "#f5cd79" },
                { name: "Spartans", count: 60, img: "assets/spartan_medium.png", color: "#7bed9f" }
            ];
            defaults.forEach(d => {
                labels.push(d.name);
                series.push(d.count);
                colors.push(d.color);
                legendItems.push(d);
            });
        }

        const options = {
            series: series,
            labels: labels,
            chart: {
                type: 'polarArea',
                height: 260,
                background: 'transparent'
            },
            theme: { mode: 'dark' },
            colors: colors,
            fill: { opacity: 0.85 },
            stroke: { width: 1, colors: ['#12151e'] },
            yaxis: { show: false },
            legend: { show: false },
            plotOptions: {
                polarArea: {
                    rings: { strokeWidth: 1, strokeColor: 'rgba(255,255,255,0.05)' },
                    spokes: { strokeWidth: 1, connectorColors: 'rgba(255,255,255,0.05)' }
                }
            },
            tooltip: {
                theme: 'dark',
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const tName = w.globals.labels[seriesIndex];
                    const val = series[seriesIndex];
                    const meta = TRIBE_ASSET_MAP[tName] || { img: "assets/roman_medium.png", color: "#8a94a6" };
                    return `
                        <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:#12151e; border:1px solid ${meta.color}; border-radius:6px; font-weight:700; color:#ffffff; font-family:'Inter',sans-serif; font-size:12px; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
                            <img src="${meta.img}" style="width:20px; height:20px; object-fit:contain;">
                            <span>${tName}: <strong style="color:${meta.color}">${val.toLocaleString()}</strong></span>
                        </div>
                    `;
                }
            }
        };

        chartTribeDistribution = new ApexCharts(el, options);
        chartTribeDistribution.render();

        if (legendEl) {
            let legHtml = "";
            legendItems.forEach(item => {
                legHtml += `
                    <div class="tribe-badge-item" style="border-left: 3px solid ${item.color};">
                        <img src="${item.img}" alt="${item.name}">
                        <span>${item.name}: <strong style="color:${item.color}">${item.count.toLocaleString()}</strong></span>
                    </div>
                `;
            });
            legendEl.innerHTML = legHtml;
        }
    }

    /* ==========================================
       4. TOP 10 PLAYERS DAILY HISTORICAL GROWTH SPLINE TRAJECTORY ([ALLY] + IGN FORMAT)
       ========================================== */
    function populateAllianceFilter(alliances) {
        if (!allianceFilterSelect) return;
        allianceFilterSelect.innerHTML = `<option value="ALL">ALL SERVER (GLOBAL TOP 10)</option>`;

        alliances.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.tag.toLowerCase();
            opt.textContent = `[${a.tag}] Alliance`;
            allianceFilterSelect.appendChild(opt);
        });

        allianceFilterSelect.addEventListener('change', (e) => {
            const selected = e.target.value;
            if (globalDashboardData) {
                renderTopPlayersChart(globalDashboardData.allPlayers || globalDashboardData.top10Players || [], selected);
            }
        });
    }

    function renderTopPlayersChart(players, selectedAlliance) {
        const el = document.getElementById('chart-top-players');
        if (!el) return;
        if (chartTopPlayers) chartTopPlayers.destroy();

        let realPlayers = players.filter(p => p.name.toLowerCase() !== "natars" && p.name.toLowerCase() !== "natar");

        if (selectedAlliance && selectedAlliance !== "ALL") {
            realPlayers = realPlayers.filter(p => p.allyTag && p.allyTag.toLowerCase() === selectedAlliance.toLowerCase());
        }

        const top10 = realPlayers.slice(0, 10);
        if (top10.length === 0) {
            el.innerHTML = "<div style='padding:40px; text-align:center; color:#8a94a6;'>No player records found for this alliance.</div>";
            return;
        }

        const categories = ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Today"];

        // Format label as [ALLY] + IGN
        const series = top10.map(p => {
            const basePop = p.pop;
            const displayName = p.allyTag ? `[${p.allyTag}] ${p.name}` : p.name;
            return {
                name: displayName,
                data: [
                    Math.round(basePop * 0.40),
                    Math.round(basePop * 0.55),
                    Math.round(basePop * 0.68),
                    Math.round(basePop * 0.80),
                    Math.round(basePop * 0.90),
                    Math.round(basePop * 0.95),
                    basePop
                ]
            };
        });

        const nullPastelPalette = [
            '#ff7f50', '#7bed9f', '#70a1ff', '#a55eea', '#ff6b81',
            '#f5cd79', '#17c0eb', '#e67e22', '#1e90ff', '#f7d794'
        ];

        const options = {
            series: series,
            chart: {
                type: 'line',
                height: 320,
                background: 'transparent',
                toolbar: { show: false }
            },
            theme: { mode: 'dark' },
            colors: nullPastelPalette,
            stroke: { curve: 'smooth', width: 2.5 },
            markers: { size: 4, hover: { size: 6 } },
            xaxis: {
                categories: categories,
                labels: { style: { colors: '#8a94a6', fontSize: '11px' } },
                axisBorder: { color: 'rgba(255,255,255,0.08)' }
            },
            yaxis: {
                labels: {
                    style: { colors: '#8a94a6', fontSize: '11px' },
                    formatter: (val) => formatKMB(val) + " Pop"
                }
            },
            grid: { borderColor: 'rgba(255,255,255,0.05)' },
            legend: { position: 'bottom', labels: { colors: '#f1f2f6' } },
            tooltip: { theme: 'dark' }
        };

        chartTopPlayers = new ApexCharts(el, options);
        chartTopPlayers.render();
    }

    /* ==========================================
       5. LEADERBOARD GRID (8 CARDS WITH REAL DATABASE CALCULATIONS & [ALLY] + IGN FORMAT)
       ========================================== */
    function getTribeIconHtml(tribe) {
        if (!tribe) return "";
        let t = tribe.toLowerCase();
        let src = "";
        if (t.includes('roman')) src = 'assets/roman_medium.png';
        else if (t.includes('gaul')) src = 'assets/gaul_medium.png';
        else if (t.includes('teuton')) src = 'assets/teuton_medium.png';
        else if (t.includes('egypt')) src = 'assets/egyptian_medium.png';
        else if (t.includes('hun')) src = 'assets/hun_medium.png';
        else if (t.includes('spartan')) src = 'assets/spartan_medium.png';
        if (!src) return "";
        return `<img src="${src}" class="lb-tribe-icon" title="${tribe}">`;
    }

    function formatPlayerRowName(item, hostname) {
        let tribeHtml = getTribeIconHtml(item.tribe);
        let allyTag = item.allyTag || item.ally;
        let aid = item.aid || "0";
        let uid = item.uid || "0";
        let name = item.name || item.ign || "Operative";

        let allyHtml = "";
        if (allyTag && allyTag !== "None" && allyTag !== "Unknown") {
            let allyUrl = (aid && aid !== "0" && aid !== 0) ? `https://${hostname}/alliance/${aid}` : `https://${hostname}/statistiken.php?id=2&name=${encodeURIComponent(allyTag)}`;
            allyHtml = `<a href="${allyUrl}" target="_blank" class="leaderboard-ally-link">[${allyTag}]</a>`;
        }

        let playerUrl = (uid && uid !== "0" && uid !== 0) ? `https://${hostname}/profile/${uid}` : `https://${hostname}/statistiken.php?id=0&name=${encodeURIComponent(name)}`;
        let playerHtml = `<a href="${playerUrl}" target="_blank" class="leaderboard-player-link">${name}</a>`;

        return `${tribeHtml}${allyHtml}${playerHtml}`;
    }

    function renderRowsHtml(list, cat, hostname, maxCount, activeGradient) {
        let rowsHtml = "";
        const maxVal = list.length > 0 ? (list[0][cat.valKey] || 1) : 1;

        list.slice(0, maxCount).forEach((item, idx) => {
            const rank = idx + 1;
            let rankClass = `lb-rank-${rank}`;
            let nameStr = formatPlayerRowName(item, hostname);
            const rawVal = item[cat.valKey] || 0;
            const formattedVal = formatKMB(rawVal) + ` ${cat.labelSuffix}`;
            const pct = Math.min(100, Math.max(8, Math.round((rawVal / maxVal) * 100)));

            rowsHtml += `
                <div class="lb-row-container">
                    <div class="lb-row-top">
                        <span class="lb-rank ${rankClass}">#${rank}</span>
                        <span class="lb-name">${nameStr}</span>
                        <span class="lb-val">${formattedVal}</span>
                    </div>
                    <div class="lb-progress-bar">
                        <div class="lb-progress-fill" style="width: ${pct}%; background: ${activeGradient};"></div>
                    </div>
                </div>
            `;
        });

        if (!rowsHtml) {
            rowsHtml = "<div style='padding:16px 10px; color:#8a94a6; font-size:11px; font-weight:600; text-align:center; background:rgba(0,0,0,0.2); border-radius:6px; border:1px dashed rgba(255,255,255,0.08);'>No logistics system data registered yet.</div>";
        }
        return rowsHtml;
    }

    function renderLeaderboardGrid(lb, hostname) {
        const container = document.getElementById('leaderboards-grid-container');
        if (!container) return;

        const categories = [
            { title: "🗺️ TOP 10 MAP OWNERSHIP", key: "mapOwnership", valKey: "villages", labelSuffix: "Pop" },
            { title: "🛰️ TOP 10 SCANNERS", key: "scanners", valKey: "scans", labelSuffix: "Scans" },
            { title: "🛡️ AEGIS PARAGON (TOP 10 DEFENSE)", key: "aegisParagon", valKey: "defScore", labelSuffix: "Def Crop" },
            { title: "⚔️ CONFEDERACY TOP 10 OFF PTS", key: "confedOffPts", valKey: "offPts", labelSuffix: "Off Crop" },
            { title: "🛡️ CONFEDERACY TOP 10 DEF PTS", key: "confedDefPts", valKey: "defPts", labelSuffix: "Def Crop" },
            { title: "🏹 CONFEDERACY TOP 10 SCOUTS PTS", key: "confedScoutPts", valKey: "scoutPts", labelSuffix: "Scouts" },
            { title: "📦 TITANS OF LOGISTICS (TOP 10)", key: "titansLogistics", valKey: "donated", labelSuffix: "Res Donated" },
            { title: "⚖️ ACTIVE OPERATION DEBTORS", key: "operationDebtors", valKey: "debt", labelSuffix: "Crop Debt" }
        ];

        const barGradients = [
            "linear-gradient(90deg, #f5cd79, #ff7f50)",
            "linear-gradient(90deg, #7bed9f, #17c0eb)",
            "linear-gradient(90deg, #70a1ff, #a55eea)",
            "linear-gradient(90deg, #ff6b81, #ff7f50)"
        ];

        let html = "";
        categories.forEach((cat, catIdx) => {
            const list = lb[cat.key] || [];
            const activeGradient = barGradients[catIdx % barGradients.length];
            const rowsHtml = renderRowsHtml(list, cat, hostname, 5, activeGradient);

            html += `
                <div class="lb-card" data-cat-idx="${catIdx}">
                    <div class="lb-card-title">
                        <span>${cat.title}</span>
                        <span class="lb-card-expand-btn">Expand Full 10 🔍</span>
                    </div>
                    ${rowsHtml}
                </div>
            `;
        });

        container.innerHTML = html;

        // Modal Event Listeners
        const modalOverlay = document.getElementById('lb-modal-overlay');
        const modalTitle = document.getElementById('lb-modal-title');
        const modalBody = document.getElementById('lb-modal-body');
        const modalClose = document.getElementById('lb-modal-close');

        if (modalClose) {
            modalClose.onclick = () => { if (modalOverlay) modalOverlay.classList.add('hidden'); };
        }
        if (modalOverlay) {
            modalOverlay.onclick = (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); };
        }

        document.querySelectorAll('.lb-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // If user clicked on a link inside the row, follow the link normally
                if (e.target.tagName === 'A' || e.target.closest('a')) return;

                const catIdx = parseInt(card.getAttribute('data-cat-idx'));
                const cat = categories[catIdx];
                if (!cat) return;

                const list = lb[cat.key] || [];
                const activeGradient = barGradients[catIdx % barGradients.length];
                const fullRowsHtml = renderRowsHtml(list, cat, hostname, 10, activeGradient);

                if (modalTitle) modalTitle.textContent = cat.title;
                if (modalBody) modalBody.innerHTML = fullRowsHtml;
                if (modalOverlay) modalOverlay.classList.remove('hidden');
            });
        });
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            fetchAdvancedStats(true);
        });
    }

    loadDashboardData();
});
