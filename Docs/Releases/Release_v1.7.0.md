# 🌐 NULL Map Engine Extension — Release v1.7.0 (Webstore Candidate)

## 📦 Release Overview
**Version**: `v1.7.0`  
**Date**: August 2, 2026  
**Target Platform**: Chrome Web Store / Manifest V3  
**Key Modules**: `logisticsTerminal.html`, `logisticsTerminal.js`, `sidepanel.js`, `sidepanel.css`, `background.js`  

---

## 🚀 What's New in v1.7.0

### 1. Interactive Logistics Command Terminal
* **Logistics Push Requisitions**: Complete Kanban board supporting `Pending Approval` (Leader view) and `Active Pushes` (Alliance view).
* **Dropdown Village Selector**: Automatic dropdown populating target villages with exact coordinates `(X, Y)` for requisition entry.
* **Inline Shipment Confirmations**: Active Push Kanban cards render incoming shipment reports (`Confirm` / `Reject`) inline with real-time progress bars.

### 2. Manifest V3 CSP Compliance & UI Polish
* **Inline Event Handler Elimination**: Replaced inline `onmouseover`/`onmouseout` event attributes with standard `.travian-player-link` and `.travian-ally-link` CSS pseudo-classes to comply strictly with Manifest V3 `script-src 'self'` policy.
* **Standardized Profiling Links**: Player links use `spieler.php?uid={uid}` and Alliance tags use `allianz.php?aid={aid}`. Format standardized to `TRIBE` + `[ALLY]` + `IGN`.

### 3. Background Network Resilience (`background.js`)
* **Redirect Follow Support**: Added explicit `redirect: 'follow'` to Google Apps Script `fetch` calls.
* **Automatic Request Retries**: Implemented exponential 500ms single-retry fallback to prevent Service Worker wake-up timeouts and `TypeError: Failed to fetch` errors.

### 4. Background Notification Auto-Sync
* **Live Badge Updates**: 30-second silent background polling (`setInterval`) updates DEF and Logistics badge counters across sidepanel icons without requiring manual refresh clicks.
