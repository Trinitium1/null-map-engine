from flask import Flask, request, send_file
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import io
import urllib.request
from PIL import Image
import re
import colorsys
import numpy as np

app = Flask(__name__)

# Convierte colores HSLA (Javascript) y RGBA a formato que Matplotlib entiende
def parse_color(c):
    if isinstance(c, str):
        if c.startswith('rgba'):
            vals = re.findall(r'[\d.]+', c)
            return (float(vals[0])/255, float(vals[1])/255, float(vals[2])/255, float(vals[3]))
        elif c.startswith('hsla'):
            vals = re.findall(r'[\d.]+', c)
            h = float(vals[0])/360.0
            s = float(vals[1])/100.0
            l = float(vals[2])/100.0
            a = float(vals[3])
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
        
        # 1. Crear el lienzo negro espacial
        fig, ax = plt.subplots(figsize=(10, 10), dpi=100)
        fig.patch.set_facecolor('#1e1e24')
        ax.set_facecolor('#1e1e24')
        
        legend_handles = []

        # 2. Dibujar las capas de datos
        for ds in datasets:
            pts = ds.get('data', [])
            if not pts: continue
            
            label = ds.get('label', '')
            color = parse_color(ds.get('backgroundColor', 'white'))
            edgecolor = parse_color(ds.get('borderColor', 'none'))
            linewidth = ds.get('borderWidth', 0)
            point_style = ds.get('pointStyle', 'circle')

            # --- DIBUJAR LÍNEAS TÁCTICAS (TELARAÑAS) ---
            if ds.get('type') == 'line':
                xs = [p['x'] if p.get('x') is not None else np.nan for p in pts]
                ys = [p['y'] if p.get('y') is not None else np.nan for p in pts]
                ax.plot(xs, ys, color=edgecolor, linewidth=linewidth)
                continue

            # --- DIBUJAR MARCADORES ESPECIALES ---
            marker = 'o'
            if point_style == 'crossRot': marker = 'X'
            elif point_style == 'rectRot': marker = 'D'
            elif point_style == 'triangle': marker = '^'

            xs = [p['x'] for p in pts if 'x' in p]
            ys = [p['y'] for p in pts if 'y' in p]
            
            # Escala matemática de burbujas
            sizes = []
            for p in pts:
                r = p.get('r', 2)
                if marker == 'D': sizes.append((r * 8)**2) # Diamantes más grandes
                else: sizes.append((r * 5)**2)

            scatter = ax.scatter(xs, ys, s=sizes, c=[color]*len(xs), edgecolors=[edgecolor]*len(xs), linewidths=linewidth, marker=marker, zorder=3 if marker != 'o' else 2)

            # Agregar a la Leyenda (Omitimos Mundo y Redes Tácticas)
            if show_legend and label and label not in ['World', '[TACTICAL_NET]']:
                patch = mpatches.Patch(color=color, label=label)
                legend_handles.append(patch)

            # --- DIBUJAR ETIQUETAS DE TEXTO (Números, Estrellas) ---
            txt_color = ds.get('customLabelColor', '#FFFFFF')
            if 'CENTROID' in label: txt_color = '#000000'

            for p in pts:
                txt = None
                if 'rank' in p: txt = f"★ {p['rank']}"
                elif 'outlierId' in p: txt = str(p['outlierId'])
                elif 'clashId' in p: txt = str(p['clashId'])
                elif 'radarId' in p: txt = str(p['radarId'])

                if txt:
                    ax.text(p['x'], p['y'], txt, color=txt_color, fontsize=10, ha='center', va='center', fontweight='bold', zorder=4)

        # 3. Configurar Cuadrícula y Leyenda
        ax.set_xlim(-200, 200)
        ax.set_ylim(-200, 200)
        ax.grid(color='white', alpha=0.05)
        ax.tick_params(colors='#555555')

        if show_legend and legend_handles:
            # Hacer espacio arriba para la leyenda
            box = ax.get_position()
            ax.set_position([box.x0, box.y0, box.width, box.height * 0.9])
            # Colocar la infografía
            ax.legend(handles=legend_handles, loc='upper center', bbox_to_anchor=(0.5, 1.12), ncol=5, frameon=False, labelcolor='white', fontsize=9)
        
        # 4. Guardar gráfico en RAM
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor(), pad_inches=0.1)
        plt.close(fig)
        buf.seek(0)
        
        img = Image.open(buf).convert("RGBA")
        
        # 5. Pegar Sello de la Legión (Redimensionado al 15% y con Transparencia)
        if data.get('watermark'):
            req = urllib.request.urlopen("https://i.ibb.co/35dnG0Lc/5519632.png")
            wm = Image.open(req).convert("RGBA")
            
            # Redimensionar al 15% del mapa
            wm_width = int(img.width * 0.15)
            aspect_ratio = wm.height / wm.width
            wm_height = int(wm_width * aspect_ratio)
            wm = wm.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
            
            # Ajustar opacidad al 25%
            wm_with_alpha = wm.copy()
            alpha = wm_with_alpha.split()[3]
            alpha = alpha.point(lambda p: p * 0.25)
            wm_with_alpha.putalpha(alpha)
            
            # Pegar en la esquina superior derecha
            img.paste(wm_with_alpha, (img.width - wm_width - 20, 20), wm_with_alpha)
            
        final_buf = io.BytesIO()
        img.save(final_buf, format="PNG")
        final_buf.seek(0)
        
        return send_file(final_buf, mimetype='image/png')
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
