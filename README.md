# NULL Map Engine - Version Logs

## 🚀 V1.3 (Current Release)
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