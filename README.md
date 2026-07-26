# NULL Map Engine - Version Logs

## 🚀 V1.1 (Current Release)
*Deploy Date: July 2026*

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
