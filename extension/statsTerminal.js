// statsTerminal.js

document.addEventListener('DOMContentLoaded', () => {
    const btnRefresh = document.getElementById('btn-refresh');
    const lastUpdatedEl = document.getElementById('last-updated');

    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get('server');

    function safeParseJSON(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }

    function getAllianceProfileLink(tag, aid, hostname) {
        if (!tag || tag === "None") return `<span style="color:#a4b0be;">None</span>`;
        const url = (aid && aid !== "0") ? `https://${hostname}/alliance/${aid}` : `https://${hostname}/statistiken.php?id=2&name=${encodeURIComponent(tag)}`;
        return `<a href="${url}" target="_blank" class="leaderboard-link">[${tag}]</a>`;
    }

    function loadStatsData() {
        chrome.storage.local.get(['statsDataCache', 'statsLastRefresh', 'statsUtcOffset', 'serverData'], (result) => {
            let hostname = serverParam;
            if (!hostname && result.serverData && Object.keys(result.serverData).length > 0) {
                hostname = Object.keys(result.serverData)[0];
            }

            if (result.statsDataCache && result.statsDataCache.hostname === hostname) {
                renderAll(result.statsDataCache);
                if (result.statsLastRefresh && lastUpdatedEl) {
                    const d = new Date(result.statsLastRefresh);
                    lastUpdatedEl.textContent = `Updated: ${d.toLocaleTimeString()}`;
                }
            } else {
                fetchStatsData(hostname);
            }
        });
    }

    function fetchStatsData(hostname) {
        if (!hostname) {
            chrome.tabs.query({ url: "*://*.travian.com/*" }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    const url = new URL(tabs[0].url);
                    fetchStatsDataForHost(url.hostname);
                } else {
                    lastUpdatedEl.textContent = "Error: No active Travian server tab found.";
                }
            });
        } else {
            fetchStatsDataForHost(hostname);
        }
    }

    function fetchStatsDataForHost(hostname) {
        if (lastUpdatedEl) lastUpdatedEl.textContent = "Fetching latest metrics...";

        chrome.storage.local.get(['discordId'], (res) => {
            let payload = [{ action: "stats_get_overview", extVersion: chrome.runtime.getManifest().version, discordId: res.discordId || "unknown" }];
            chrome.runtime.sendMessage({ type: 'FETCH_GAS', hostname: hostname, payload: payload }, (rawText) => {
                if (!rawText) {
                    if (lastUpdatedEl) lastUpdatedEl.textContent = "Error: Connection failed.";
                    return;
                }

                let data = safeParseJSON(rawText);
                if (data && data.status === "ok") {
                    const now = Date.now();
                    if (lastUpdatedEl) lastUpdatedEl.textContent = `Updated: ${new Date(now).toLocaleTimeString()}`;

                    const cache = { ...data, hostname: hostname };
                    chrome.storage.local.set({
                        statsDataCache: cache,
                        statsLastRefresh: now,
                        statsUtcOffset: data.utcOffset || "+01:00"
                    });

                    renderAll(cache);
                } else {
                    if (lastUpdatedEl) lastUpdatedEl.textContent = "Error loading metrics.";
                }
            });
        });
    }

    function renderAll(data) {
        renderConfedOverview(data.confed || {});
        renderFactionBreakdown(data.factions || [], data.hostname);
        renderTop10Comparison(data.top10 || data.top5 || [], data.hostname);
    }

    function renderConfedOverview(c) {
        const el = document.getElementById('confed-overview-content');
        if (!el) return;
        if (!c || c.members === undefined) {
            el.innerHTML = "<div>No overview available.</div>";
            return;
        }
        el.innerHTML = `
            <div class="overview-row"><span>👥 <b>Members:</b></span> <b style="color:#fff;">${(c.members || 0).toLocaleString()}</b></div>
            <div class="overview-row"><span>📈 <b>Total Population:</b></span> <b style="color:#2ecc71;">${(c.totalPop || 0).toLocaleString()}</b></div>
            <div class="overview-row"><span>🏠 <b>Villages:</b></span> <b style="color:#f1c40f;">${(c.villages || 0).toLocaleString()}</b></div>
            <div class="overview-row"><span>📊 <b>Avg Pop/Member:</b></span> <b style="color:#3498db;">${(c.avgPop || 0).toLocaleString()}</b></div>
            <div class="overview-row"><span>🎯 <b>Core Center Coords:</b></span> <b style="color:#fff;">(${c.cx || 0}, ${c.cy || 0})</b></div>
            <div class="overview-row"><span>🕸️ <b>Spreaded Topology:</b></span> <b style="color:#ff4757;">${c.spread || "0.0"} tiles</b></div>
            <div class="overview-row"><span>🏆 <b>Core Server Rank:</b></span> <b style="color:#f1c40f;">#${c.coreRank || 1}</b></div>
        `;
    }

    function renderFactionBreakdown(factions, hostname) {
        const el = document.getElementById('faction-breakdown-content');
        if (!el) return;
        if (!factions || factions.length === 0) {
            el.innerHTML = "<div>No faction data available.</div>";
            return;
        }

        let html = "";
        factions.forEach(f => {
            const allyLink = getAllianceProfileLink(f.tag, f.aid, hostname);
            html += `
                <div class="overview-row">
                    <div>${allyLink}</div>
                    <div style="display:flex; gap:16px;">
                        <span>👥 <b>${(f.members || 0).toLocaleString()}</b></span>
                        <span style="color:#2ecc71;">📈 <b>${(f.pop || 0).toLocaleString()} Pop</b></span>
                        <span>🎯 <b>(${f.cx || 0}, ${f.cy || 0})</b></span>
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    }

    function renderTop10Comparison(topList, hostname) {
        const el = document.getElementById('top5-comparison-content');
        if (!el) return;
        if (!topList || topList.length === 0) {
            el.innerHTML = "<div>No top 10 comparison available.</div>";
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
                <div class="overview-row" style="margin-bottom:8px;">
                    <div style="font-size:14px; font-weight:bold;">${medal} ${allyLink}</div>
                    <div style="display:flex; gap:20px; font-size:12px;">
                        <span style="color:#2ecc71;">📈 <b>${(t.pop || 0).toLocaleString()} Pop</b></span>
                        <span>👤 <b>${(t.avgPop || 0).toLocaleString()} Ø/Usr</b></span>
                        <span>🎯 <b>(${t.cx || 0}, ${t.cy || 0})</b></span>
                        <span>🕸️ <b>${t.spread || "0.0"} tiles</b></span>
                    </div>
                </div>
            `;
        });
        el.innerHTML = html;
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            fetchStatsData(serverParam);
        });
    }

    loadStatsData();
});
