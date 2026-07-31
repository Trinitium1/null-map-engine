# NULL Map Engine - Version Logs

## 🚀 WebStoreRelease V1.6 (Current Release)
*Deploy Date: July 2026*

**🛡️ Aegis Command Terminal & Sidebar Updates**
- **Aegis Top 10 Redesign**: Reorganized the Top 10 Aegis Paragon leaderboard to properly align Vanguard, Sentinel, and Total scores in three sortable columns.
- **Super Thin Tactical Radar**: Implemented super thin, high-density summary cards in the sidebar for Incomings and Standing Defense alerts.
- **Tribe & Alliance Integration**: Injected dynamic Tribe icons and Alliance tags into the sidebar widgets alongside clickable profile hyperlinks.
- **Smart Refresh & Notification Bubbles**: Def App button now correctly displays notification bubbles for active incoming attacks and standing defense requests, overlapping the shield icon smoothly.

**🔐 Access Control & Connection Stability**
- **Tri-Factor Auth UI**: Server status card now surfaces specific denial reasons (`NOT_REGISTERED`, `NOT_CONFEDERATION`, `NOT_VERIFIED`) instead of a generic unregistered label.
- **Auto Re-Verification**: Opening the sidepanel or switching Travian tabs now re-validates access automatically; status no longer stays stale until a manual MAP refresh.
- **Unified Panel Refresh**: MAP and DEF headers share the same refresh logic — `Updated HH:MM (UTC±…)` is tied to the last successful fetch, with green/orange/red freshness coloring.
- **Discord Auth Fix**: OAuth redirect is intercepted via `webNavigation` to close the auth tab instantly (no more ~20s DNS hang after Authorize).
- **Kill Switch UX**: Obsolete/blocked installs now offer **Contact Support** (Discord) and **Update from Chrome Web Store** instead of a Discord download CTA.

---

## 🚀 WebStoreRelease V1.5
*Deploy Date: July 2026*

**⚔️ Troops Analyzer (Next-Gen UI)**
- **Full-Screen Dashboard**: Added a new full-screen interface exclusively for troop analysis, accessible via the new `TROOPS` icon in the Map Terminal.
- **ApexCharts Integration**: Implemented dynamic time-series charts (ApexCharts) to visualize offensive and defensive crop evolution over time for every player.
- **Advanced Sorting & Filtering**: The alliance table now supports real-time searching and dynamic sorting across all columns (Offensive Power, Defensive Power, Operative Name).
- **JSON Payload Shift**: Migrated the data fetch architecture from a rigid row-per-village Google Sheet format to a highly flexible, time-series JSON format per player, vastly improving render speeds and data consistency.
- **Discord Auth Overhaul (Android Support)**: Refactored the Discord authentication flow to open a new tab instead of a popup, utilizing a background interception script. This ensures full compatibility with mobile browsers (like Kiwi Browser on Android) while bypassing standard MV3 constraints.
- **Offline CSP Enforcement**: Migrated ApexCharts from a CDN to a local bundle (`apexcharts.min.js`), complying strictly with Chrome Extension Manifest V3 Content Security Policies.

---

## 🚀 WebStoreRelease V1.4
*Deploy Date: July 2026*

**📊 Alliance Matrix Upgrades**
- **Table Redesign**: The Matrix now looks and feels like a real table, with clean cell borders making reading rows and columns a breeze.
- **Smart Filtering**: Added an interactive filter menu on the `Player` column. You can now search by name, check/uncheck specific players, and perfectly customize your view!
- **Accurate Sorting**: The table now automatically sorts players from highest to lowest based on their **Total** growth across the whole timeframe, not just the last day.

**🐘 PvE Animal Analytics**
- **Exact Defense Values**: The math for calculating the Defense from cages is now hyper-accurate! The engine detects the exact mix of creatures you capture (e.g., catching bears and tigers before reaching your target elephants) and calculates the *real* total Defense gained.
- **Clean UI Icons**: Added visual icons (🪖 for Infantry, 🐎 for Cavalry) to make it easier to read at a glance, along with better number formatting.

**🎨 Dashboard Aesthetics & Bug Fixes**
- **Neon Dashboard Button**: The extension popup now features a premium glowing Dashboard button, and the old sidebar has been removed for a cleaner experience.
- **Crop Finder Fix**: Fixed a bug where certain 15-croppers (like Rubidia IV) were incorrectly labeled as 6c. The engine mapping logic is now 100% accurate regardless of the database row order.

---

## 🗺️ V1.3
*Deploy Date: July 2026*

**🗺️ Tactical Map Overhaul**
- **Unified Visuals**: The extension's map has been completely redesigned to look exactly like the tactical maps you see on Discord.
- **Dynamic Identification**: Friendly alliances are now easily identifiable in cyan, while enemies and specific targets are assigned their unique colors automatically.

**🎨 Aesthetic Upgrades**
- **Premium Dark Mode**: The map now features a sleek dark background (`#16171a`) that matches the Discord theme, along with a fainter tactical grid for less visual clutter.
- **Null Watermark**: All exported maps now include the official NULL watermark, giving your screenshots a professional tactical finish.

**🛡️ Stability & Bug Fixes**
- **Gallery Fix**: Fixed a bug that prevented the image gallery (Lightbox) from opening when clicking on a generated map. You can now expand and view your maps flawlessly.
- **Loading Improvements**: Resolved an issue where maps would occasionally fail to render their final elements.

---

### V1.2
*Deploy Date: July 2026*

**⚙️ Chronos System Evolution**
- **Dynamic Coordinate Mapping:** Completely refactored the historical diff engines (`World Events`, `Sector Radar`, `Tactical Events`). The engine now builds deterministic `(X,Y)` virtual maps to compare village data across 24-72 hours. This perfectly eliminates the row-shifting corruption bug caused by server-wide village creations or destructions.
- **UI Refinement:** Enhanced the Side Panel interface with sleek neon-accented slider controls for scan radiuses and compacted the HUD margins for a cleaner, premium viewing experience.

---

### V1.1

**👁️ Live HUD (Heads-Up Display)**
- **Real-Time Telemetry:** Injected a live, floating HUD directly into the Travian Map page (`karte.php`). Operatives can monitor their scanning progress without leaving the game or keeping the extension popup open.
- **Memory Optimization:** The engine now intercepts tile data in real-time, computing the sum of flushed tiles and current cached tiles entirely in RAM. It broadcasts this total instantly to the HUD, providing live visual feedback without triggering premature API calls to the Google Apps Script backend.
- **Picture-in-Picture Mode:** Added a dedicated `⧉` button in the extension popup. Clicking it seamlessly transitions the data stream into the draggable on-page HUD. Includes strict error handling to ensure operatives are actively on the map before deployment.

**⚙️ Core Engine & Network Architecture**
- **Asynchronous Dispatch Corrections:** Resolved a critical race condition within the extension's popup UI where `window.close()` would terminate the Chrome runtime thread before asynchronous `chrome.tabs.sendMessage` payloads could successfully dispatch to the active tab.
- **Strict Parsing Tolerance:** Fixed a lowercase parsing bug where the Google Apps Script responded with `{"status": "ok"}` but the Service Worker expected `"OK"`, ensuring automated leaderboard refreshes trigger flawlessly upon data flush.
- **Session State Persistance:** Corrected behavior to correctly hook the `beforeunload` event, ensuring all cached map tiles are successfully transmitted to the `DB_Map` database when closing the tab or navigating away from the map.

---

### V1.0
*Deploy Date: July 2026*

**🗺️ Passive Map Sniffer (Core Launch)**
- **Isolated Interceptor:** Deployed an isolated World script (`interceptor.js`) to seamlessly hook the `XMLHttpRequest` object. It passively captures all incoming JSON map data directly from the Travian servers.
- **Background Service Worker:** Engineered an asynchronous queue that caches map packets locally to preserve browser memory and prevent server API rate limits.
- **Server Verification System:** Automated Discord ID linking. Validates the operative's identity against the Master Engine `DB_Members` database.
- **Live Leaderboard UI:** Integrated a dynamic extension popup that displays the Top 10 Scanners and Top 10 Map Ownership directly from the server in real-time.

Privacy Policy for NULL Map Engine The NULL Map Engine extension collects Discord User IDs for authentication purposes and reads map data from travian.com to provide tactical analytics for the user's alliance. We do not collect passwords. We do not sell, rent, or share any personal information with third parties. All data is sent securely to a private Google Apps Script database solely for the stated purpose of the extension.