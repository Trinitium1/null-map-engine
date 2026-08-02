# Graph Report - null-map-engine  (2026-08-02)

## Corpus Check
- 16 files · ~41,410 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 298 nodes · 482 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0b7b360`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sidepanel.js
- troopsAnalyzer.js
- logisticsTerminal.js
- manifest.json
- aegisTerminal.js
- background.js
- pvpAnalyzer.js
- popup.js
- render_map
- content.js
- interceptor.js
- NULL Map Engine - Version Logs
- 🚀 What's New in v1.7.0
- sitterTerminal.js
- 🚀 What's New in v1.8.0

## God Nodes (most connected - your core abstractions)
1. `fetchLogisticsData()` - 14 edges
2. `processRawTiles()` - 13 edges
3. `fetchLogisticsData()` - 12 edges
4. `fetchSitterData()` - 12 edges
5. `fetchAegisData()` - 9 edges
6. `applyRefreshTimestamp()` - 9 edges
7. `fetchAegisTop10()` - 9 edges
8. `bindEvents()` - 8 edges
9. `host_permissions` - 8 edges
10. `setRefreshBusy()` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "sidepanel.js"
Cohesion: 0.11
Nodes (42): applyRefreshTimestamp(), fetchAegisTop10(), fetchChronosAlliance(), fetchChronosEvents(), fetchChronosRadar(), fetchLogisticsData(), fetchMapStats(), fetchPveCage() (+34 more)

### Community 1 - "troopsAnalyzer.js"
Cohesion: 0.07
Nodes (38): allianceTbody, allPlayers, chartContainer, dateHeaders, ddDef, ddOff, ddPlayerMeta, ddPlayerName (+30 more)

### Community 2 - "logisticsTerminal.js"
Cohesion: 0.10
Nodes (37): activeGrid, bindEvents(), btnInitiatePush, btnRefresh, detailsBody, detailsCancel, detailsClose, detailsTitle (+29 more)

### Community 3 - "manifest.json"
Cohesion: 0.06
Nodes (31): action, default_icon, default_popup, background, service_worker, content_scripts, 128, description (+23 more)

### Community 4 - "aegisTerminal.js"
Cohesion: 0.11
Nodes (31): aegisData, bindDelegatedCardClicks(), bindEvents(), btnRefresh, closeModal(), currentModalPayload, fetchAegisData(), formatLastUpdated() (+23 more)

### Community 5 - "background.js"
Cohesion: 0.16
Nodes (20): cachedTiles, drawCustomBadge(), evaluateTabForBadge(), extractAnimals(), extractBonuses(), extractOasisType(), extractRegionData(), extractStatus() (+12 more)

### Community 6 - "pvpAnalyzer.js"
Cohesion: 0.19
Nodes (10): NullMapRenderer, executeMapRequest(), generateBasicMapDataset(), _getColorForAlliance(), initPvPAnalyzer(), loadPvPOverview(), pvpRecordings, renderRecordings() (+2 more)

### Community 8 - "render_map"
Cohesion: 0.67
Nodes (3): parse_color(), render_map(), route

### Community 11 - "NULL Map Engine - Version Logs"
Cohesion: 0.22
Nodes (8): NULL Map Engine - Version Logs, V1.0, V1.1, V1.2, 🗺️ V1.3, 🚀 WebStoreRelease V1.4, 🚀 WebStoreRelease V1.5, 🚀 WebStoreRelease V1.6 (Current Release)

### Community 12 - "🚀 What's New in v1.7.0"
Cohesion: 0.25
Nodes (7): 1. Interactive Logistics Command Terminal, 2. Manifest V3 CSP Compliance & UI Polish, 3. Background Network Resilience (`background.js`), 4. Background Notification Auto-Sync, 🌐 NULL Map Engine Extension — Release v1.7.0 (Webstore Candidate), 📦 Release Overview, 🚀 What's New in v1.7.0

### Community 13 - "sitterTerminal.js"
Cohesion: 0.15
Nodes (25): bindEvents(), btnRefresh, fetchSitterData(), filterMatrixTable(), formatLastUpdated(), getTribeIconHtml(), hideLoading(), init() (+17 more)

### Community 14 - "🚀 What's New in v1.8.0"
Cohesion: 0.20
Nodes (9): 1. Interactive Sitters Command Terminal, 2. Standardized Leaderboards & Direct Alliance Links (`/alliance/AID`), 3. Manifest V3 CSP Compliance & UI Hover Styling, 4. Real-Time Debug Logger & Network Status Relay, 5. Extension-Wide JSON Hardening (`safeParseJSON`), 🛠️ Internal Code Changes, 🌐 NULL Map Engine Extension — Release v1.8.0, 📦 Release Overview (+1 more)

## Knowledge Gaps
- **114 isolated node(s):** `aegisData`, `loadingOverlay`, `loadingText`, `btnRefresh`, `tabBtns` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `aegisData`, `loadingOverlay`, `loadingText` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidepanel.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10549645390070922 - nodes in this community are weakly interconnected._
- **Should `troopsAnalyzer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0728744939271255 - nodes in this community are weakly interconnected._
- **Should `logisticsTerminal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10384068278805121 - nodes in this community are weakly interconnected._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `aegisTerminal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._