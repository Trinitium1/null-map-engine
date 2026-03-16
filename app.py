# ==========================================
# NULL LEGION - HOLOGRAPHIC RENDER ENGINE 
# V33.0 - EXTREME COORDINATE CALIBRATION
# ==========================================

from flask import Flask, request, send_file
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import io
import urllib.request
from PIL import Image
import re
import colorsys
import numpy as np
import matplotlib.patheffects as patheffects

app = Flask(__name__)

def parse_color(c):
    if isinstance(c, str):
        if c.startswith('rgba'):
            vals = re.findall(r'[\d.]+', c)
            # Transparencia base del 65%
            return (float(vals[0])/255, float(vals[1])/255, float(vals[2])/255, float(vals[3]) * 0.65)
        elif c.startswith('hsla'):
            vals = re.findall(r'[\d.]+', c)
            h = float(vals[0])/360.0
            s = float(vals[1])/100.0
            l = float(vals[2])/100.0
            a = float(vals[3]) * 0.65
            rgb = colorsys.hls_to_rgb(h, l, s)
            return (rgb[0], rgb[1], rgb[2], a)
        elif c.startswith('#'):
            return c
    return c

@app.route('/render', methods=['POST'])
def render_map():
    try:
        data = request.json
        datasets = data.get('datasets', [])
        show_legend = data.get('showLegend', False)
        
        fig, ax = plt.subplots(figsize=(10, 10), dpi=100)
        fig.patch.set_facecolor('#1e1e24')
        ax.set_facecolor('#1e1e24')
        
        # Márgenes mínimos absolutos
        plt.subplots_adjust(left=0.01, bottom=0.01, right=0.99, top=0.99)

        legend_handles = []

        for ds in datasets:
            pts = ds.get('data', [])
            if not pts: continue
            
            label = ds.get('label', '')
            color = parse_color(ds.get('backgroundColor', 'white'))
            edgecolor = parse_color(ds.get('borderColor', 'none'))
            linewidth = 0.3 if edgecolor != 'none' else 0
            point_style = ds.get('pointStyle', 'circle')

            z_order = 3
            if label == 'World': z_order = 1
            elif 'CENTROID' in label: z_order = 5
            elif 'OUTLIER' in label or 'FRONTIER' in label or 'Target' in label or 'Vanguard' in label: z_order = 4

            if ds.get('type') == 'line':
                xs = [p['x'] if p.get('x') is not None else np.nan for p in pts]
                ys = [p['y'] if p.get('y') is not None else np.nan for p in pts]
                ax.plot(xs, ys, color=edgecolor, linewidth=0.8, zorder=2)
                continue

            marker = 'o'
            if point_style == 'crossRot': marker = 'X'
            elif point_style == 'rectRot': marker = 'D'
            elif point_style == 'triangle': marker = '^'

            xs = [p['x'] for p in pts if 'x' in p]
            ys = [p['y'] for p in pts if 'y' in p]
            
            # Ponderación suavizada de burbujas
            sizes = []
            for p in pts:
                r = p.get('r', 2)
                if marker == 'D': sizes.append((r * 3)**2) 
                else: sizes.append((r * 1.6)**2) 

            ax.scatter(xs, ys, s=sizes, c=[color]*len(xs), edgecolors=[edgecolor]*len(xs), linewidths=linewidth, marker=marker, zorder=z_order)

            if show_legend and label and label not in ['World', '[TACTICAL_NET]']:
                patch = mpatches.Patch(color=color, label=label)
                legend_handles.append(patch)

            txt_color = ds.get('customLabelColor', '#FFFFFF')
            if 'CENTROID' in label: txt_color = '#000000'

            for p in pts:
                txt = None
                if 'rank' in p: txt = f"★ {p['rank']}"
                elif 'outlierId' in p: txt = str(p['outlierId'])
                elif 'clashId' in p: txt = str(p['clashId'])
                elif 'radarId' in p: txt = str(p['radarId'])

                if txt:
                    pe = [patheffects.withStroke(linewidth=1.5, foreground='rgba(0,0,0,0.6)')] if txt_color == '#FFFFFF' else []
                    ax.text(p['x'], p['y'], txt, color=txt_color, fontsize=9, ha='center', va='center', fontweight='bold', zorder=6, path_effects=pe)

        ax.set_xlim(-200, 200)
        ax.set_ylim(-200, 200)
        
        ax.grid(color='white', alpha=0.08, linestyle='-', linewidth=0.5)
        ax.tick_params(labelbottom=False, labelleft=False, length=0) 

        # Configuración de estilo para coordenadas
        pe_coords = [patheffects.withStroke(linewidth=2.5, foreground='#000000')]
        coord_style = dict(size=11, color='#DDDDDD', fontweight='bold', path_effects=pe_coords, zorder=7)

        # 1. Dibujar coordenadas normales internas (sin las esquinas)
        for val in [-150, -100, -50, 0, 50, 100, 150]:
            ax.text(val, -195, str(val), ha='center', va='bottom', **coord_style) # X abajo
            ax.text(-195, val, str(val), ha='left', va='center', **coord_style)  # Y izquierda

        # 🛡️ FIX: DIBUJAR COORDENADAS EXTREMAS (200/-200) ROTADAS EN LAS ESQUINAS
        corner_style = dict(size=12, color='#FFFFFF', fontweight='bold', path_effects=pe_coords, zorder=8)
        
        # Esquina Superior Derecha (200, 200) - Rotado -45
        ax.text(197, 197, "200", rotation=-45, ha='right', va='top', **corner_style)
        
        # Esquina Superior Izquierda (-200, 200) - Rotado 45 (para el eje Y)
        ax.text(-197, 197, "200", rotation=45, ha='left', va='top', **corner_style)
        
        # Esquina Inferior Izquierda (-200, -200) - Rotado -45
        ax.text(-197, -197, "-200", rotation=-45, ha='left', va='bottom', **corner_style)
        
        # Esquina Inferior Derecha (200, -200) - Rotado 45 (para el eje X)
        ax.text(197, -197, "-200", rotation=45, ha='right', va='bottom', **corner_style)

        # Leyenda Interna Flotante
        if show_legend and legend_handles:
            ax.legend(handles=legend_handles, loc='upper center', bbox_to_anchor=(0.5, 0.99), ncol=4, frameon=True, facecolor='#1e1e24', framealpha=0.7, edgecolor='none', labelcolor='white', fontsize=10)
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        
        img = Image.open(buf).convert("RGBA")
        
        # Sello de la Legión (Watermark) - 15% Absoluto
        if data.get('watermark'):
            req = urllib.request.urlopen("https://i.ibb.co/35dnG0Lc/5519632.png")
            wm = Image.open(req).convert("RGBA")
            wm_width = int(img.width * 0.15)
            wm_height = int(wm_width * (wm.height / wm.width))
            wm = wm.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
            
            wm_with_alpha = wm.copy()
            alpha = wm_with_alpha.split()[3]
            alpha = alpha.point(lambda p: p * 0.3)
            wm_with_alpha.putalpha(alpha)
            
            img.paste(wm_with_alpha, (img.width - wm.width - 15, 15), wm_with_alpha)
            
        final_buf = io.BytesIO()
        img.save(final_buf, format="PNG")
        final_buf.seek(0)
        
        return send_file(final_buf, mimetype='image/png')
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
