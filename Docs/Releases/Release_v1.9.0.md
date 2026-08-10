# 🌐 NULL Map Engine Extension — Release v1.9.0

## 📦 Release Overview
**Version**: `v1.9.0`  
**Date**: August 3, 2026  
**Target Platform**: Chrome Extension / Manifest V3 (`manifest.json` v1.9)  
**Key Modules**: `sidepanel.html`, `sidepanel.css`, `popup.css`, `statsTerminal.js`, `statsTerminal.html`, `pvpAnalyzer.js`  

---

## 🚀 What's New in v1.9.0

### 1. UIverse Custom Back Navigation Engine
* **Reversed Arrow Direction ($\leftarrow$)**: Customized arrow geometry so the arrow head points **LEFT** (`←`) with right-to-left glide animation (`transform: translate(-0.45rem, 0)`).
* **Dynamic Text Slide Transition**: 
  * **Default State**: Displays active module title (`STATISTICS & METRICS`, `MAP TERMINAL`, `AEGIS TERMINAL`, `LOGISTICS TERMINAL`, `SITTERS TERMINAL`, `PVP ANALYZER`).
  * **Hover State**: The active module title slides up out of view (`translateY(-100%)`) while **`BACK TO HOME`** slides up into view glowing in neon cyan (`#00f2fe`).
* **Absolute Background Pill Expansion**: `circle` background pill expands absolutely (`z-index: 1`) behind the text layer (`z-index: 2`) inside a compact `max-width: 200px` container, preventing text overflow or stretching.

### 2. Right-Docked Header Controls (`margin-left: auto`)
* **Header Alignment Fix**: Added `margin-left: auto;` to all submodule timestamp containers (`#map-last-updated`, `#aegis-last-updated`, `#logistics-last-updated`, `#sitters-last-updated`, `#stats-last-updated`).
* **Right Docking**: Restored right alignment for timestamp labels and green/purple/orange refresh buttons.

---

## 🛠️ Code Changes
* `manifest.json`: Version bumped to `"1.9"`.
* `sidepanel.css` & `popup.css`: Added `.btn-back-uiverse` button styles with reverse arrow geometry, text slide transitions, and absolute background expansion.
* `sidepanel.html`: Replaced legacy icon back buttons across all 6 module headers (`btn-stats-back`, `btn-back-home`, `btn-def-back`, `btn-logistics-back`, `btn-sitters-back`, `btn-pvp-sub-back`).
