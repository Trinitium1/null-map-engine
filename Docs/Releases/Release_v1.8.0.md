# 🌐 NULL Map Engine Extension — Release v1.8.0

## 📦 Release Overview
**Version**: `v1.8.0`  
**Date**: August 2, 2026  
**Target Platform**: Chrome Web Store / Manifest V3 (`manifest.json` v1.8)  
**Key Modules**: `sitterTerminal.html`, `sitterTerminal.js`, `sidepanel.js`, `sidepanel.css`, `manifest.json`  

---

## 🚀 What's New in v1.8.0

### 1. Interactive Sitters Command Terminal
* **24-Hour Active Time Heatmap**: ApexCharts visual rendering of active online hours across all confederacy operatives.
* **Muted Dark-Mode Pastel Palette**: Softened heatmap color scales (`#55efc4` Active Mint, `#ffeaa7` Adjacent Yellow, `#ff7675` Inactive Red) for eye-comfort during long operational sessions.
* **Operative Sitter Matrix**: Roster table with live status badges (`🟢 SECURE`, `🟡 AT_RISK`, `🔴 CRITICAL`, `🛡️ PROXY`).

### 2. 4 Sitter Relationship Dropdown Controls
* **My Sitters (Who sits my account)**:
  * Dropdown controls for **My Sitter 1** and **My Sitter 2**.
  * Live slot capacity validation displaying open slots e.g., `PlayerName [ALLY] (1 slot(s) open)` and disabling full sitters e.g., `PlayerName [ALLY] (FULL - 2/2 slots used)`.
* **Accounts I Sit (Accounts I sit for)**:
  * Dropdown controls for **Account I Sit 1** and **Account I Sit 2**.

### 3. Sitter Match % Algorithm
* **Tactical Pairing**: Measures how well candidate operatives cover **your specific offline/inactive hours**.
* **Formula**:
  $$\text{Match \%} = \left(\frac{\text{Candidate Active Hours during Your Inactive Hours}}{\text{Your Total Inactive Hours}}\right) \times 100$$
* **Match Badges**: `🎯 88% (7/8h)` (Pastel Mint), `⚡ 50% (4/8h)` (Pastel Amber), `🔴 25% (2/8h)` (Pastel Red).

### 4. Interactive Column Sorting & Hyperlinks
* **Header Sorting**: Clickable table headers with visual sort indicators (`▲`, `▼`, `⇅`).
* **Profile Links**: `[ALLY]` alliance tags link to `/allianzen.php?tag=...` and `IGN` player names link to `/profile/...`.

---

## 🛠️ Internal Code Changes
* `manifest.json`: Version bumped to `"1.8"`.
* `sitterTerminal.html` & `sitterTerminal.js`:
  * Built 4 dropdown selectors and slot validation logic.
  * Added `Sitter Match %` column and sort handler.
  * Updated ApexCharts heatmap configuration to dark-mode pastels.
* `sidepanel.js`:
  * Fixed refresh timestamp milliseconds subtraction logic (`diffMs = Date.now() - ts.getTime()`), restoring green refresh button indicators upon successful data fetch.
