class NullMapRenderer {
    constructor(canvasId) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.ctx = this.canvas.getContext('2d');
        this.scale = 400 / 400; // 400px for 400 units (-200 to 200)
    }

    _coordToPixel(x, y) {
        return {
            px: (x + 200) * this.scale,
            py: (200 - y) * this.scale // Invert Y for canvas
        };
    }

    _parseColor(c) {
        if (!c) return 'white';
        if (c.startsWith('rgba') || c.startsWith('#')) return c;
        if (c.startsWith('hsla')) {
            // Simplified, canvas accepts hsla natively!
            return c;
        }
        return c;
    }

    render(datasets) {
        return new Promise((resolve) => {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Background
            ctx.fillStyle = '#16171a'; // Match Discord's dark theme
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Watermark (if available locally in extension context)
            const logo = new Image();
            logo.src = chrome.runtime.getURL("assets/icon128.png");
            
            const drawMap = () => {
                // Grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; // Fainter grid
                ctx.lineWidth = 0.5;
                // ctx.setLineDash([2, 4]); // Optional dashed lines
                ctx.beginPath();
                for (let i = -150; i <= 150; i += 50) {
            let p1 = this._coordToPixel(i, -200);
            let p2 = this._coordToPixel(i, 200);
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);

            let p3 = this._coordToPixel(-200, i);
            let p4 = this._coordToPixel(200, i);
            ctx.moveTo(p3.px, p3.py);
            ctx.lineTo(p4.px, p4.py);
        }
        ctx.stroke();

        // Draw Axes Labels
        ctx.fillStyle = '#DDDDDD';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let val of [-150, -100, -50, 0, 50, 100, 150]) {
            let p = this._coordToPixel(val, -195);
            ctx.fillText(val, p.px, p.py);
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (let val of [-150, -100, -50, 0, 50, 100, 150]) {
            let p = this._coordToPixel(-195, val);
            ctx.fillText(val, p.px, p.py);
        }

        // Corner Labels
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        let tr = this._coordToPixel(197, 197);
        ctx.fillText("200", tr.px, tr.py);
        
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        let tl = this._coordToPixel(-197, 197);
        ctx.fillText("200", tl.px, tl.py);
        
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        let bl = this._coordToPixel(-197, -197);
        ctx.fillText("-200", bl.px, bl.py);

        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        let br = this._coordToPixel(197, -197);
        ctx.fillText("-200", br.px, br.py);

        // Sort datasets by z-order
        let zSorted = [...datasets].sort((a, b) => {
            let zA = 3; if (a.label === 'World') zA = 1; else if (a.label && (a.label.includes('OUTLIER') || a.label.includes('FRONTIER') || a.label.includes('Target') || a.label.includes('Vanguard'))) zA = 4;
            let zB = 3; if (b.label === 'World') zB = 1; else if (b.label && (b.label.includes('OUTLIER') || b.label.includes('FRONTIER') || b.label.includes('Target') || b.label.includes('Vanguard'))) zB = 4;
            if (a.label && a.label.includes('CENTROID')) zA = 5;
            if (b.label && b.label.includes('CENTROID')) zB = 5;
            return zA - zB;
        });

        for (let ds of zSorted) {
            let pts = ds.data || [];
            if (pts.length === 0) continue;

            let color = this._parseColor(ds.backgroundColor || 'white');
            let borderColor = this._parseColor(ds.borderColor || 'none');
            let txtColor = ds.customLabelColor || '#FFFFFF';

            // Lines
            if (ds.type === 'line') {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                let started = false;
                for (let p of pts) {
                    if (p.x === undefined || p.y === undefined) continue;
                    let {px, py} = this._coordToPixel(p.x, p.y);
                    if (!started) { ctx.moveTo(px, py); started = true; }
                    else { ctx.lineTo(px, py); }
                }
                ctx.stroke();
                continue;
            }

            // Centroids (Flags)
            if (ds.label && ds.label.includes('CENTROID')) {
                let allyName = ds.label.replace(' CENTROID', '').replace('[', '').replace(']', '');
                let flagTxtColor = txtColor === '#FFFFFF' ? 'white' : 'black';
                let solidColor = borderColor;

                for (let p of pts) {
                    let {px, py} = this._coordToPixel(p.x, p.y);
                    let pyTop = this._coordToPixel(p.x, p.y + 12).py; // Taller flag pole for canvas

                    // Pole
                    ctx.strokeStyle = '#AAAAAA';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, pyTop);
                    ctx.stroke();

                    // Cross
                    ctx.strokeStyle = '#FF3333';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(px - 3, py - 3); ctx.lineTo(px + 3, py + 3);
                    ctx.moveTo(px - 3, py + 3); ctx.lineTo(px + 3, py - 3);
                    ctx.stroke();

                    // Flag Box
                    ctx.font = 'bold 8px Arial';
                    let textWidth = ctx.measureText(allyName).width;
                    ctx.fillStyle = solidColor;
                    let boxX = px + 4;
                    let boxY = pyTop - 4;
                    ctx.fillRect(boxX, boxY, textWidth + 4, 10);
                    
                    ctx.fillStyle = flagTxtColor;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(allyName, boxX + 2, boxY + 1);
                }
                continue;
            }

            // Points
            for (let p of pts) {
                if (p.x === undefined || p.y === undefined) continue;
                let {px, py} = this._coordToPixel(p.x, p.y);
                let radius = (p.r || 2) * 1.2; 
                
                ctx.fillStyle = color;
                ctx.beginPath();
                
                if (ds.pointStyle === 'crossRot') {
                    // Draw X
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(px - radius, py - radius); ctx.lineTo(px + radius, py + radius);
                    ctx.moveTo(px - radius, py + radius); ctx.lineTo(px + radius, py - radius);
                    ctx.stroke();
                } else if (ds.pointStyle === 'triangle') {
                    ctx.moveTo(px, py - radius);
                    ctx.lineTo(px - radius, py + radius);
                    ctx.lineTo(px + radius, py + radius);
                    ctx.closePath();
                    ctx.fill();
                    if (borderColor !== 'none') { ctx.strokeStyle = borderColor; ctx.lineWidth = 0.5; ctx.stroke(); }
                } else {
                    ctx.arc(px, py, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    if (borderColor !== 'none') { ctx.strokeStyle = borderColor; ctx.lineWidth = 0.5; ctx.stroke(); }
                }

                // Text labels
                let txt = p.outlierId || p.clashId || p.radarId;
                if (txt) {
                    ctx.fillStyle = txtColor;
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Stroke for visibility
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 2;
                    ctx.strokeText(txt, px, py);
                    ctx.fillText(txt, px, py);
                }
            }
        } // Missing closing brace for zSorted loop

        resolve(this.canvas.toDataURL("image/png"));
    };

        if (logo.complete) {
            if (logo.width > 0) {
                ctx.globalAlpha = 0.15; // Translúcido
                ctx.drawImage(logo, this.canvas.width - 60, 10, 50, 50);
                ctx.globalAlpha = 1.0;
            }
            drawMap();
        } else {
            logo.onload = () => {
                ctx.globalAlpha = 0.15; // Translúcido
                ctx.drawImage(logo, this.canvas.width - 60, 10, 50, 50);
                ctx.globalAlpha = 1.0;
                drawMap();
            };
            logo.onerror = () => {
                drawMap();
            };
        }
    });
    }
}
