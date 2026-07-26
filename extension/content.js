// content.js
// This script runs in the isolated world of the page.
// It injects interceptor.js into the main world to hook network requests.

const script = document.createElement('script');
script.src = chrome.runtime.getURL('interceptor.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script (interceptor.js)
window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data.type) {
        return;
    }

    if (event.data.type === 'TRAVIAN_MAP_DATA') {
        chrome.storage.local.get(['engineActive', 'killSwitch'], (result) => {
            if (result.killSwitch || result.engineActive === false) {
                return; // Do nothing if killed or paused
            }

            // Forward to the Service Worker (background.js)
            chrome.runtime.sendMessage({
                type: 'PROCESS_MAP_DATA',
                payload: event.data.payload,
                ign: event.data.ign,
                hostname: window.location.hostname
            });
        });
    }
});

// Hook for when the user navigates away or closes the tab to trigger the flush
window.addEventListener('beforeunload', () => {
    chrome.storage.local.get(['engineActive', 'killSwitch'], (result) => {
        if (!result.killSwitch && result.engineActive !== false) {
            chrome.runtime.sendMessage({ 
                type: 'FLUSH_CACHE',
                hostname: window.location.hostname
            });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_HUD') {
        let hud = document.getElementById('null-map-hud');
        if (hud) {
            hud.remove();
        } else {
            createHUD();
        }
        sendResponse({status: "ok"});
    }
    if (message.action === 'updateTiles') {
        let countEl = document.getElementById('null-hud-count');
        if (countEl) {
            countEl.textContent = message.count.toLocaleString();
        }
        sendResponse({status: "ok"});
    }
});

function createHUD() {
    const hud = document.createElement('div');
    hud.id = 'null-map-hud';
    hud.style.position = 'fixed';
    hud.style.top = '10px';
    hud.style.right = '10px';
    hud.style.zIndex = '999999';
    hud.style.backgroundColor = '#2f3542';
    hud.style.color = '#ffffff';
    hud.style.border = '2px solid #eccc68';
    hud.style.borderRadius = '8px';
    hud.style.padding = '10px 15px';
    hud.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
    hud.style.fontFamily = 'Arial, sans-serif';
    hud.style.display = 'flex';
    hud.style.alignItems = 'center';
    hud.style.gap = '15px';
    hud.style.cursor = 'move';

    // Make it draggable
    let isDragging = false;
    let offsetX, offsetY;
    hud.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - hud.getBoundingClientRect().left;
        offsetY = e.clientY - hud.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        hud.style.left = (e.clientX - offsetX) + 'px';
        hud.style.top = (e.clientY - offsetY) + 'px';
        hud.style.right = 'auto'; // Disable right anchoring when dragged
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Content
    const title = document.createElement('div');
    title.innerHTML = '<strong>NULL Map Engine</strong><br><span style="font-size:12px; color:#a4b0be;">Tiles Scanned:</span> <span id="null-hud-count" style="color:#eccc68; font-weight:bold;">0</span>';
    
    // Initial value
    chrome.storage.local.get(['sessionTiles'], (result) => {
        if (result.sessionTiles) {
            document.getElementById('null-hud-count').textContent = result.sessionTiles.toLocaleString();
        }
    });

    const closeBtn = document.createElement('div');
    closeBtn.textContent = '✖';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#ff4757';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.addEventListener('click', () => hud.remove());

    hud.appendChild(title);
    hud.appendChild(closeBtn);
    document.body.appendChild(hud);
}
