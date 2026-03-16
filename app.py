from flask import Flask, request, send_file
import matplotlib.pyplot as plt
import io
import urllib.request
from PIL import Image
import re

app = Flask(__name__)

def parse_color(c):
    if isinstance(c, str) and c.startswith('rgba'):
        vals = re.findall(r'[\d.]+', c)
        return (float(vals[0])/255, float(vals[1])/255, float(vals[2])/255, float(vals[3]))
    return c

@app.route('/render', methods=['POST'])
def render_map():
    try:
        data = request.json
        datasets = data.get('datasets', [])
        
        # 1. Crear el lienzo negro espacial
        fig, ax = plt.subplots(figsize=(8, 8), dpi=100)
        fig.patch.set_facecolor('#1e1e24')
        ax.set_facecolor('#1e1e24')
        
        # 2. Dibujar todas las aldeas
        for ds in datasets:
            pts = ds.get('data', [])
            if not pts: continue
            
            xs = [p['x'] for p in pts if 'x' in p]
            ys = [p['y'] for p in pts if 'y' in p]
            sizes = [(p.get('r', 2) * 5)**2 for p in pts] # Escala matemática de burbujas
            
            color = parse_color(ds.get('backgroundColor', 'white'))
            edgecolor = parse_color(ds.get('borderColor', 'none'))
            linewidth = ds.get('borderWidth', 0)
            
            ax.scatter(xs, ys, s=sizes, c=[color]*len(xs), edgecolors=[edgecolor]*len(xs), linewidths=linewidth)

        ax.set_xlim(-200, 200)
        ax.set_ylim(-200, 200)
        ax.axis('off')
        
        # 3. Guardar gráfico en RAM
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor(), pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        
        img = Image.open(buf).convert("RGBA")
        
        # 4. Pegar Sello de la Legión (Watermark)
        if data.get('watermark'):
            req = urllib.request.urlopen("https://i.ibb.co/35dnG0Lc/5519632.png")
            wm = Image.open(req).convert("RGBA")
            wm.thumbnail((140, 140))
            # Ajustar opacidad al 30%
            wm_with_alpha = wm.copy()
            alpha = wm_with_alpha.split()[3]
            alpha = alpha.point(lambda p: p * 0.3)
            wm_with_alpha.putalpha(alpha)
            # Pegar arriba a la derecha
            img.paste(wm_with_alpha, (img.width - wm.width - 10, 10), wm_with_alpha)
            
        final_buf = io.BytesIO()
        img.save(final_buf, format="PNG")
        final_buf.seek(0)
        
        return send_file(final_buf, mimetype='image/png')
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
