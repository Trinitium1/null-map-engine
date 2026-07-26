// interceptor.js
// This script runs in the context of the main Travian webpage.
(function() {
    console.log("[NULL Map Engine] Sniffer injected successfully.");
    
    // Attempt to extract the player's IGN
    function getIGN() {
        let ign = "Unknown";
        try {
            // Travian usually has the player name in the side panel or a global variable.
            // .playerName is a common class for the player's name in Travian's UI.
            const playerNode = document.querySelector('.playerName'); 
            if (playerNode) {
                ign = playerNode.innerText.trim();
            } else if (window.TravianDefaults && window.TravianDefaults.user) {
                 ign = window.TravianDefaults.user.name || "Unknown";
            }
        } catch(e) {}
        return ign;
    }

    // Overwrite XMLHttpRequest to sniff map tiles
    const originalXHR = window.XMLHttpRequest;
    function newXHR() {
        const realXHR = new originalXHR();
        realXHR.addEventListener("readystatechange", function() {
            if (realXHR.readyState === 4 && realXHR.status === 200) {
                if (realXHR.responseURL.includes("position") || realXHR.responseURL.includes("cmd=mapPositionData")) {
                    try {
                        const jsonResponse = JSON.parse(realXHR.responseText);
                        if (jsonResponse.tiles) {
                            window.postMessage({
                                type: 'TRAVIAN_MAP_DATA',
                                payload: jsonResponse.tiles,
                                ign: getIGN()
                            }, '*');
                        }
                    } catch (e) {}
                }
            }
        });
        return realXHR;
    }
    window.XMLHttpRequest = newXHR;

    // Overwrite fetch just in case modern map engines use it
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        
        if (url.includes('position') || url.includes('cmd=mapPositionData')) {
            response.clone().json().then(data => {
                if (data.tiles) {
                    window.postMessage({
                        type: 'TRAVIAN_MAP_DATA',
                        payload: data.tiles,
                        ign: getIGN()
                    }, '*');
                }
            }).catch(e => {});
        }
        return response;
    };
})();
