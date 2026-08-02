# Graph Report - .  (2026-08-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 236 nodes · 380 edges · 11 communities (8 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e73044d`
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

## God Nodes (most connected - your core abstractions)
1. `processRawTiles()` - 13 edges
2. `fetchLogisticsData()` - 13 edges
3. `fetchLogisticsData()` - 11 edges
4. `fetchAegisData()` - 9 edges
5. `host_permissions` - 8 edges
6. `fetchAegisTop10()` - 8 edges
7. `bindEvents()` - 7 edges
8. `permissions` - 7 edges
9. `setRefreshBusy()` - 7 edges
10. `applyRefreshTimestamp()` - 7 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 3 thin omitted)

### Community 0 - "sidepanel.js"
Cohesion: 0.11
Nodes (37): applyRefreshTimestamp(), fetchAegisTop10(), fetchChronosAlliance(), fetchChronosEvents(), fetchChronosRadar(), fetchLogisticsData(), fetchMapStats(), fetchPveCage() (+29 more)

### Community 1 - "troopsAnalyzer.js"
Cohesion: 0.07
Nodes (38): allianceTbody, allPlayers, chartContainer, dateHeaders, ddDef, ddOff, ddPlayerMeta, ddPlayerName (+30 more)

### Community 2 - "logisticsTerminal.js"
Cohesion: 0.11
Nodes (36): activeGrid, bindEvents(), btnInitiatePush, btnRefresh, detailsBody, detailsCancel, detailsClose, detailsTitle (+28 more)

### Community 3 - "manifest.json"
Cohesion: 0.06
Nodes (31): action, default_icon, default_popup, background, service_worker, content_scripts, 128, description (+23 more)

### Community 4 - "aegisTerminal.js"
Cohesion: 0.11
Nodes (30): aegisData, bindEvents(), btnRefresh, closeModal(), currentModalPayload, fetchAegisData(), formatLastUpdated(), getTribeMediumIcon() (+22 more)

### Community 5 - "background.js"
Cohesion: 0.17
Nodes (20): cachedTiles, drawCustomBadge(), evaluateTabForBadge(), extractAnimals(), extractBonuses(), extractOasisType(), extractRegionData(), extractStatus() (+12 more)

### Community 6 - "pvpAnalyzer.js"
Cohesion: 0.19
Nodes (9): NullMapRenderer, executeMapRequest(), generateBasicMapDataset(), _getColorForAlliance(), initPvPAnalyzer(), loadPvPOverview(), pvpRecordings, renderRecordings() (+1 more)

### Community 8 - "render_map"
Cohesion: 0.67
Nodes (3): parse_color(), render_map(), route

## Knowledge Gaps
- **89 isolated node(s):** `aegisData`, `loadingOverlay`, `loadingText`, `btnRefresh`, `tabBtns` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `aegisData`, `loadingOverlay`, `loadingText` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidepanel.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10852713178294573 - nodes in this community are weakly interconnected._
- **Should `troopsAnalyzer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0728744939271255 - nodes in this community are weakly interconnected._
- **Should `logisticsTerminal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1066066066066066 - nodes in this community are weakly interconnected._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `aegisTerminal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10967741935483871 - nodes in this community are weakly interconnected._