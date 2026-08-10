# Release v2.2.0

## Resumen
Esta actualización (V2.2) se enfoca en resolver los conflictos de los controles del ratón, perfeccionar las animaciones de desprendimiento de terreno y pulir las lógicas de interacción del jugador para una experiencia completamente responsiva, táctica y fluida. 

## Cambios Principales (Changelog)

### Interacción y Controles (UX/UI)
* **Controles Base Restaurados:**
  * **Click Izquierdo:** Hace un teletransporte (salto) rápido de la cámara hacia la coordenada seleccionada.
  * **Click Derecho (Arrastrar):** Mueve/panea libremente el mapa.
  * **Click Derecho (Pulsación):** Abre limpia e inmediatamente el menú contextual, sin interpretar falsos "arrastres".
* **Aislamiento de Clicks en el Tile Flotante:**
  * Ahora el click sobre el bloque levantado intercepta los eventos. Ya no es posible que un click accidental (ya sea derecho o izquierdo) sobre el bloque, lo cancele o lo baje bruscamente de regreso al piso. 
* **Precisión en Tiles Vecinos (Raycast Filtering):**
  * Se deshabilitó el interceptor de clicks para todos los componentes decorativos que sobresalían (Aldeas, resplandores tácticos, biomas de los oasis, etc.). De esta manera el click en los tiles contiguos funciona con precisión milimétrica sin ser bloqueado por los "bordes invisibles" del modelo 3D.
* **Navegación con Flechas Reparada:**
  * Se desacopló la lógica de movimiento programado de la lógica del mouse, permitiendo que la navegación por teclado vuelva a funcionar y que, además, la cámara se anime fluidamente siguiendo los inputs de teclado.

### Efectos Visuales (VFX)
* **Animación y Altura del Bloque (AnimatedTile):**
  * La altura de levitación se incrementó a `1.5x` respecto a su valor original (ahora sube a `0.525` y fluctúa orgánicamente desde esa cota).
* **Partículas de Tierra (TileParticles):**
  * Se reposicionó el emisor estrictamente en la base (`y = -0.1`) de forma que el desprendimiento parezca nacer desde las raíces del trozo de tierra.
  * **Lluvia Orgánica:** La caída de las partículas se extendió (hasta `y = -4.0`), dando un rastro mucho más notable antes de resetearse. 
  * Se implementó un "Tope Máximo" matemático (`Math.min`) para que las partículas se mantengan formadas a medida que caen, sin crecer desproporcionadamente.

### Optimizaciones
* **Panel de Owner:** 
  * Ahora el panel de configuraciones (`ScenePresetsPanel`) inicia contraído por defecto en lugar de tapar la pantalla, desplegándose sólo cuando se le da click.
* **Saneamiento del Store:**
  * Se eliminó un comportamiento defectuoso en `InstancedGrid` que invocaba el evento global `onPointerMissed`, el cual reseteaba el tile seleccionado constantemente si tu ratón no tocaba la rejilla.
