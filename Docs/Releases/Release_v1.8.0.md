# 🌐 NULL Map Engine Extension — Release v1.8.0

## 📦 Release Overview
**Version**: `v1.8.0`  
**Date**: August 2, 2026  
**Target Platform**: Chrome Extension / Manifest V3 (`manifest.json` v1.8)  
**Key Modules**: `sitterTerminal.html`, `sitterTerminal.js`, `sidepanel.js`, `sidepanel.css`, `background.js`, `logisticsTerminal.js`, `pvpAnalyzer.js`  

---

## 🚀 What's New in v1.8.0

### 1. Interactive Sitters Command Terminal
* **24-Hour Active Time Heatmap**: ApexCharts visual rendering of active online hours across all confederacy operatives.
* **Muted Dark-Mode Pastel Palette**: Softened heatmap color scales (`#55efc4` Active Mint, `#ffeaa7` Adjacent Yellow, `#ff7675` Inactive Red) for eye-comfort during long operational sessions.
* **Operative Sitter Matrix**: Roster table with live status badges (`🟢 SECURE`, `🟡 AT_RISK`, `🔴 CRITICAL`, `🛡️ PROXY`).
* **4 Dropdown Relationship Controls**: Live capacity validation displaying open slots (e.g. `PlayerName [ALLY] (1 slot(s) open)`) and disabling full sitters.

### 2. Standardized Leaderboards & Direct Alliance Links (`/alliance/AID`)
* **Unified Top 10 Layout**: Standardized **INTEL** (Map Ownership & Scanners) and **DEF** (Aegis Paragon Top 10) leaderboards:
  $$\text{Rank.} \quad \langle\text{TribeIcon}\rangle \quad \mathbf{[ALLY\_LINK]} \quad \mathbf{IGN\_LINK}$$
* **Direct Alliance URLs**: Corrected link builder to target direct alliance profiles: `https://<hostname>/alliance/<aid>` (e.g. `https://cw.x2.international.travian.com/alliance/19`).

### 3. Manifest V3 CSP Compliance & UI Hover Styling
* **Zero Inline Handler Violations**: Removed all inline `onmouseover` / `onmouseout` attributes to comply with Chrome Extension Manifest V3 Content Security Policy (CSP).
* **CSS Hover Highlights**: Implemented `.leaderboard-link` and `.leaderboard-ally-link` CSS classes with smooth `#00f2fe` hover transitions in `sidepanel.css`.

### 4. Real-Time Debug Logger & Network Status Relay
* **Persistent Log Buffer**: Added an in-memory `logHistory` buffer (up to 150 entries) that populates `#debug-console-logs` automatically when opening **`>_ DEBUG CONSOLE`**.
* **Background Log Relay**: `background.js` forwards background network request status, retries, response payload sizes, and connection drops in real-time to the UI console.

### 5. Extension-Wide JSON Hardening (`safeParseJSON`)
* **Non-JSON & HTML Error Safety**: Replaced raw `JSON.parse(rawText)` with `safeParseJSON` across all extension files to safely digest plain-text status banners or HTML fallback error pages without throwing unhandled `SyntaxError` console exceptions.

---

## 🛠️ Internal Code Changes
* `manifest.json`: Maintained at `"1.8"`.
* `sidepanel.js`:
  * Updated `renderLeaderboardRow` and `renderAegisTop10` with CSP-compliant CSS class links and `/alliance/AID` URLs.
  * Added `safeParseJSON` and in-memory `logHistory` buffer for Debug Console modal.
* `sidepanel.css`: Added `.leaderboard-link` and `.leaderboard-ally-link` hover rules.
* `background.js`: Added `relayLog` function for real-time background service worker log forwarding.
* `logisticsTerminal.js`, `sitterTerminal.js`, `pvpAnalyzer.js`: Applied `safeParseJSON` hardening and cleaned up orphaned `catch` blocks.
