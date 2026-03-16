# ==========================================
# NULL LEGION - HOLOGRAPHIC RENDER ENGINE 
# V32.0 - TACTICAL LAYOUT OPTIMIZATION (Legend & Scale)
# ==========================================

from flask import Flask, request, send_file
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import io
import urllib.request
from PIL import Image
import re
import colorsys
import numpy as np
from matplotlib import patheffects # Necesario para el efecto de borde en texto

app = Flask(__name__)

# Convierte colores HSLA y RGBA de Javascript a formato Matplotlib
def parse_color(c):
    if isinstance(c, str):
        if c.startswith('rgba'):
            vals = re.findall(r'[\d.]+', c)
            # 🛡️ FIX: Mayor transparencia base (cambiamos float(vals[3]) a float(vals[3])*0.7 para mayor transparencia)
            return (float(vals[0])/255, float(vals[1])/255, float(vals[2])/255, float(vals[3])*0.7)
        elif c.startswith('hsla'):
            vals = re.findall(r'[\d.]+', c)
            h = float(vals[0])/360.0
            s = float(vals[1])/100.0
            l = float(vals[2])/100.0
            # 🛡️ FIX: Mayor transparencia base
            a = float(vals[3])*0.7
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
        
        # 🛡️ FIX: CANVAS OPTIMIZATION - Eliminamos el padding superior y acercamos los límites
        fig, ax = plt.subplots(figsize=(10, 10), dpi=100)
        fig.patch.set_facecolor('#1e1e24')
        ax.set_facecolor('#1e1e24')
        
        # Ajustamos los límites de la gráfica para que toquen el borde del canvas
        # left, bottom, right, top (en fracción de 0 a 1)
        plt.subplots_adjust(left=0.01, bottom=0.01, right=0.99, top=0.99)

        legend_handles = []

        for ds in datasets:
            pts = ds.get('data', [])
            if not pts: continue
            
            label = ds.get('label', '')
            color = parse_color(ds.get('backgroundColor', 'white'))
            edgecolor = parse_color(ds.get('borderColor', 'none'))
            # 🛡️ FIX: Minimizar grosor de borde (linewidth=0.5)
            linewidth = 0.5 if edgecolor != 'none' else 0
            point_style = ds.get('pointStyle', 'circle')

            if ds.get('type') == 'line':
                xs = [p['x'] if p.get('x') is not None else np.nan for p in pts]
                ys = [p['y'] if p.get('y') is not None else np.nan for p in pts]
                ax.plot(xs, ys, color=edgecolor, linewidth=linewidth)
                continue

            marker = 'o'
            if point_style == 'crossRot': marker = 'X'
            elif point_style == 'rectRot': marker = 'D'
            elif point_style == 'triangle': marker = '^'

            xs = [p['x'] for p in pts if 'x' in p]
            ys = [p['y'] for p in pts if 'y' in p]
            
            # 🛡️ FIX: TACTICAL BUBBLE SCALING
            # Matplotlib usa área, no radio. La matemática debe ajustarse.
            # Travian pop: 0 a ~2500+. Queremos ponderación para evitar saturación.
            # Usaremos el radio r matemático (sqrt(pop)/4) y reduciremos el multiplicador de área.
            sizes = []
            for p in pts:
                # Obtenemos el r matemático calculado en GAS
                r = p.get('r', 2)
                # Reducimos drásticamente el multiplicador de área de (r*5)^2 a (r*2.5)^2
                if marker == 'D': sizes.append((r * 5)**2) # Diamantes de núcleo más visibles
                else: sizes.append((r * 2.5)**2) # Burbujas de aldea mucho más controladas

            ax.scatter(xs, ys, s=sizes, c=[color]*len(xs), edgecolors=[edgecolor]*len(xs), linewidths=linewidth, marker=marker, zorder=3 if marker != 'o' else 2)

            if show_legend and label and label not in ['World', '[TACTICAL_NET]']:
                patch = mpatches.Patch(color=color, label=label)
                legend_handles.append(patch)

            # --- ETIQUETAS DE TEXTO ---
            txt_color = ds.get('customLabelColor', '#FFFFFF')
            if 'CENTROID' in label: txt_color = '#000000'

            # Efecto de borde para legibilidad sobre cualquier color
            path_effects_config = [patheffects.withStroke(linewidth=2, foreground='rgba(0,0,0,0.5)')]

            for p in pts:
                txt = None
                if 'rank' in p: txt = f"★ {p['rank']}"
                elif 'outlierId' in p: txt = str(p['outlierId'])
                elif 'clashId' in p: txt = str(p['clashId'])
                elif 'radarId' in p: txt = str(p['radarId'])

                if txt:
                    # Aplicamos zorder alto y efecto de borde
                    ax.text(p['x'], p['y'], txt, color=txt_color, fontsize=10, ha='center', va='center', fontweight='bold', zorder=4, path_effects=path_effects_config)

        # 3. Configurar Cuadrícula y Límites (Área Táctica Estándar Travian)
        ax.set_xlim(-200, 200)
        ax.set_ylim(-200, 200)
        ax.grid(color='white', alpha=0.05)
        
        # 🛡️ FIX: COORDINATES INSIDE & RESALTADAS
        # Turn off standard ticks
        ax.set_xticks([])
        ax.set_yticks([])
        
        # Draw custom labels *inside* the plot area with stroke effect
        coord_style = dict(size=14, color='#888888', fontweight='bold', path_effects=[patheffects.withStroke(linewidth=2, foreground='black')])
        
        # X-axis labels
        for x_val in [-150, -100, -50, 0, 50, 100, 150]:
            ax.text(x_val, -195, str(x_val), ha='center', va='bottom', **coord_style)
            
        # Y-axis labels
        for y_val in [-150, -100, -50, 0, 50, 100, 150]:
            ax.text(-195, y_val, str(y_val), ha='left', va='center', **coord_style)

        # 🛡️ FIX: INTERNAL LEGEND
        # Dibujamos la leyenda *sobre* el mapa, en la parte superior central
        if show_legend and legend_handles:
            # bbox_to_anchor coloca la leyenda relativa a los límites del eje
            ax.legend(handles=legend_handles, loc='upper center', bbox_to_anchor=(0.5, 0.99), ncol=5, frameon=True, facecolor='black', framealpha=0.6, edgecolor='none', labelcolor='white', fontsize=10, fontweight='bold')
        
        # 4. Guardar gráfico en RAM
        buf = io.BytesIO()
        plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        
        img = Image.open(buf).convert("RGBA")
        
        # 5. Sello de la Legión (Watermark) - Redimensionado y Transparente
        if data.get('watermark'):
            req = urllib.request.urlopen("https://i.ibb.co/35dnG0Lc/5519632.png")
            wm = Image.open(req).convert("RGBA")
            # Redimensionar al 15% del ancho del canvas táctico
            wm_width = int(img.width * 0.15)
            aspect_ratio = wm.height / wm.width
            wm_height = int(wm_width * aspect_ratio)
            wm = wm.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
            # Ajustar opacidad al 25%
            wm_with_alpha = wm.copy()
            alpha = wm_with_alpha.split()[3]
            alpha = alpha.point(lambda p: p * 0.25)
            wm_with_alpha.putalpha(alpha)
            # Pegar arriba a la derecha
            img.paste(wm_with_alpha, (img.width - wm.width - 20, 20), wm_with_alpha)
            
        final_buf = io.BytesIO()
        img.save(final_buf, format="PNG")
        final_buf.seek(0)
        
        return send_file(final_buf, mimetype='image/png')
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
