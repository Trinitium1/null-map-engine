# NULL Map Engine: 3D Tactical Perspective Module (Architecture & Concept)

## 1. Strategic Objective
Develop a standalone, high-fidelity 3D interactive map using React Three Fiber (R3F). It will feature infinite Torus-style scrolling, deterministic procedural generation for biomes, cinematic camera transitions, and a highly targeted, multi-channel tactical alarm system. 

## 2. Technology Stack & Architecture
*   **Core Engine:** React Three Fiber (R3F) & Three.js.
*   **Camera:** `OrthographicCamera` via `@react-three/drei` with `lerp` transitions.
*   **Procedural Generation:** Coordinate-based PRNG (Pseudo-Random Number Generator) seed.
*   **Performance:** `InstancedMesh`, discrete distance-based LOD, WebGL Sprites (for UI), and Frustum Culling.
*   **State & UI:** Zustand, React, Framer Motion.
*   **Data Backend:** GAS Spreadsheet merging real-time `DB_Map` and 24h `DB_World`. Para esta parte siempre leer DB_World, pero si hay alguna informacion reciente < 24 horas entonces completa la informacion de DB_World con los datos actualizados de DB_MAP y toda la informacion adicional que genera DB_MAP.

## 3. Map Generation & Biome Mechanics
### A. Procedural Asset Scattering
*   Mathematical scattering of modular prefabs (trees, rocks, crops) over tiles based on the PRNG seed.
*   **Oasis Blending:** Assets naturally overlap tile borders to create organic, continuous environments.
*   **Biomes (LOD Scalable):** Wood, Crop, Iron, Clay (and x2 variants).
*   **Tactical Borders:** Shader-based colored inner outlines overlaid on the base grass texture, configurable via local/global UI filters.

### B. Player Tile Iconography (Role Tagging)
*   Confederacy villages display compact, semi-transparent 2D Sprites (Billboards) based on Discord roles: ⚔️ Off, 🛡️ Def, 👁️ Scout, ⭐ Veteran, 🧩 Leader.

### C. Graphics & Effects
*   **Settings Panel:** Toggles for FOW, asset LOD levels, texture scaling, and ambient weather.
*   **Interaction:** 
    *   *Left-Click (Extract):* Triggers 5-tile wave ripple shader. Extracts the selected tile upward (Z-axis) with falling dirt particles and opens an HTML data container.
    *   *Right-Click (Command):* Opens a scalable context menu (Ping, Copy Coords).

## 4. Global Tactical Alarm System (Ping Network)
### A. Multi-Channel Webhook Routing
*   Right-click pings send payloads to GAS. GAS routes to specific Discord webhooks.
*   Rich Embed Buttons: `[View in Travian]` and `[View in 3D Map]` (using `chrome-extension://` URL).

### B. Targeted In-App Notifications
*   **JSON Audience Targeting:** Pings logged in GAS contain a `targets` array.
*   **Smart Polling:** Zustand store filters the payload, triggering the notification bell only if the local user matches the `targets` criteria. "Read" states are cached in Local Storage.

## 5. Scalable Repository Structure
/extension/inmersive
├── /assets (models, textures, shaders)
├── /components (canvas, ui, effects)
├── /store (Zustand state)
├── /utils (PRNG Math, Wrapping Module)
└── MapEngineApp.jsx

Separa los archivos de programacion importantes en suficientes archivos modulares, incluyendo las funciones generales que podamos utilizar en Generals.js para que sean funciones que no dependan de un modulo en especifico y que sea probable que usemos mas modulos.

Para mandar a llamar la informacion desde NULL_Legion_Workspace evalua que archivos dejar o si creamos uno nuevo que mande a llamar mas funciones si es necesario para que sea tambien una programacion separada para el modulo de Inmersive y que no este la programacion regada por otros modulos.