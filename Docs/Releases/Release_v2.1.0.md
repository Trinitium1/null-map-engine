# Release V2.1 (includes V2.0) - The God Mode Architecture

## V2.0: The Graphics Architecture Overhaul
- **PBR Removal:** Completely removed the experimental PBR Environment/HDRI components that caused fatal memory leaks and `CONTEXT_LOST_WEBGL` errors.
- **Dynamic Cascaded Shadow Maps (CSM):** Integrated a dual-cascade shadow mapping system natively into the React Three Fiber pipeline.
- **Dual Sun System:** Implemented a Near Cascade (High Resolution for close zoom) and a Far Cascade (Low Resolution for wide map view).
- **Post-Processing Engine:** Integrated `@react-three/postprocessing` providing ACES Filmic Tone Mapping, Color Grading (Brightness, Contrast, Saturation, Hue), Bloom (Glow), and Vignette.

## V2.1: The God Mode Panel
- **Unified Engine Store:** Centralized all graphics logic into `engineConfig` within `mapStore.js`, replacing localized `lil-gui` logic.
- **God Mode UI (OwnerPanel):** Built a 100% native React/Tailwind-styled floating tactical panel exclusively for the "Owner" role.
- **Tabs & Granular Controls:** Split configurations into Lighting, Post-Proc, and Scenarios tabs.
- **High-Precision Sliders:** Customized HTML range inputs with `step=0.01` and `0.001` for pixel-perfect adjustments and fixed the React event propagation to allow smooth dragging over the 3D Canvas.
- **Advanced Shadow Engineering:** Restored advanced shadow frustum controls (Near, Far, Bias) with forced `updateProjectionMatrix()` recalculations on every frame for instant visual feedback.
- **Hot-Reload Scenario Presets:** Added a "Scenarios" tab that loads JSON presets dynamically (like `Scenario_1_Noon`) and applies them to the entire engine instantly with zero latency.
