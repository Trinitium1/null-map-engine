# Graph Report - null-map-engine  (2026-08-09)

## Corpus Check
- 45 files · ~1,245,397 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1044 nodes · 1906 edges · 62 communities (43 shown, 19 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ffe92b5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sidepanel.js
- troopsAnalyzer.js
- logisticsTerminal.js
- manifest.json
- aegisTerminal.js
- background.js
- pvpAnalyzer.js
- popup.js
- render_map
- content.js
- interceptor.js
- NULL Map Engine - Version Logs
- 🚀 What's New in v1.7.0
- sitterTerminal.js
- 🚀 What's New in v1.8.0
- statsTerminal.js
- 3dmap.bundle.js
- draco_wasm_wrapper.js
- MapEngineApp
- useMapStore
- "node_modules/@react-three/fiber/dist/events-156d8d12.esm.js"
- earcutLinked
- warn
- "node_modules/three/build/three.core.js"
- draco_decoder.js
- WebGLProgram
- getCache
- arraysEqual
- ExceptionInfo
- NULL Map Engine: 3D Tactical Perspective Module (Architecture & Concept)
- getBinary
- 🌐 NULL Map Engine Extension — Release v1.9.0
- flatten
- callRuntimeCallbacks
- ha
- loadingFn
- "node_modules/maath/dist/index-0332b2ed.esm.js"
- createColorManagement
- CubicBezier
- _getCommonVertexShader
- Release V2.1 (includes V2.0) - The God Mode Architecture
- QuadraticBezier
- emscripten_realloc_buffer
- bilinear
- j
- "node_modules/n8ao/dist/N8AO.js"
- parseKeyframeTrack
- "node_modules/suspend-react/index.js"
- setValueT1
- addUniform
- checkGeometryIntersection
- convertArray
- createAttributesKey
- createCanvasElement
- createEvents
- getByteLength
- getShaderErrors
- "node_modules/zustand/esm/react.mjs"
- "node_modules/zustand/esm/traditional.mjs"
- ShadowUniformsCache
- toJSON
- wrapPointer

## God Nodes (most connected - your core abstractions)
1. `useMapStore` - 35 edges
2. `"node_modules/three/build/three.core.js"()` - 29 edges
3. `warn()` - 25 edges
4. `WebGLProgram()` - 22 edges
5. `getCache()` - 21 edges
6. `A()` - 20 edges
7. `w()` - 19 edges
8. `arraysEqual()` - 17 edges
9. `copyArray()` - 17 edges
10. `"node_modules/@react-three/fiber/dist/events-156d8d12.esm.js"()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `InstancedGrid()` --indirect_call--> `TerritoryBorders()`  [INFERRED]
  extension/3dmap.bundle.js → extension/3dmapengine/components/canvas/InstancedGrid.jsx
- `integrateEffect()` --indirect_call--> `n()`  [INFERRED]
  extension/3dmap.bundle.js → extension/3dmapengine/assets/draco/gltf/draco_wasm_wrapper.js
- `ha()` --indirect_call--> `ke()`  [INFERRED]
  extension/3dmapengine/assets/draco/gltf/draco_decoder.js → extension/3dmap.bundle.js
- `ha()` --indirect_call--> `Me()`  [INFERRED]
  extension/3dmapengine/assets/draco/gltf/draco_decoder.js → extension/3dmap.bundle.js
- `q()` --indirect_call--> `Q()`  [INFERRED]
  extension/3dmapengine/assets/draco/gltf/draco_wasm_wrapper.js → extension/3dmap.bundle.js

## Import Cycles
- None detected.

## Communities (62 total, 19 thin omitted)

### Community 0 - "sidepanel.js"
Cohesion: 0.09
Nodes (51): applyRefreshTimestamp(), createLogCardElement(), fetchAegisTop10(), fetchChronosAlliance(), fetchChronosEvents(), fetchChronosRadar(), fetchLogisticsData(), fetchMapStats() (+43 more)

### Community 1 - "troopsAnalyzer.js"
Cohesion: 0.07
Nodes (38): allianceTbody, allPlayers, chartContainer, dateHeaders, ddDef, ddOff, ddPlayerMeta, ddPlayerName (+30 more)

### Community 2 - "logisticsTerminal.js"
Cohesion: 0.10
Nodes (37): activeGrid, bindEvents(), btnInitiatePush, btnRefresh, detailsBody, detailsCancel, detailsClose, detailsTitle (+29 more)

### Community 3 - "manifest.json"
Cohesion: 0.06
Nodes (33): action, default_icon, default_popup, background, service_worker, content_scripts, content_security_policy, extension_pages (+25 more)

### Community 4 - "aegisTerminal.js"
Cohesion: 0.11
Nodes (31): aegisData, bindDelegatedCardClicks(), bindEvents(), btnRefresh, closeModal(), currentModalPayload, fetchAegisData(), formatLastUpdated() (+23 more)

### Community 5 - "background.js"
Cohesion: 0.17
Nodes (21): cachedTiles, drawCustomBadge(), evaluateTabForBadge(), extractAnimals(), extractBonuses(), extractOasisType(), extractRegionData(), extractStatus() (+13 more)

### Community 6 - "pvpAnalyzer.js"
Cohesion: 0.19
Nodes (10): NullMapRenderer, executeMapRequest(), generateBasicMapDataset(), _getColorForAlliance(), initPvPAnalyzer(), loadPvPOverview(), pvpRecordings, renderRecordings() (+2 more)

### Community 8 - "render_map"
Cohesion: 0.67
Nodes (3): parse_color(), render_map(), route

### Community 11 - "NULL Map Engine - Version Logs"
Cohesion: 0.22
Nodes (8): NULL Map Engine - Version Logs, V1.0, V1.1, V1.2, 🗺️ V1.3, 🚀 WebStoreRelease V1.4, 🚀 WebStoreRelease V1.5, 🚀 WebStoreRelease V1.6 (Current Release)

### Community 12 - "🚀 What's New in v1.7.0"
Cohesion: 0.25
Nodes (7): 1. Interactive Logistics Command Terminal, 2. Manifest V3 CSP Compliance & UI Polish, 3. Background Network Resilience (`background.js`), 4. Background Notification Auto-Sync, 🌐 NULL Map Engine Extension — Release v1.7.0 (Webstore Candidate), 📦 Release Overview, 🚀 What's New in v1.7.0

### Community 13 - "sitterTerminal.js"
Cohesion: 0.15
Nodes (25): bindEvents(), btnRefresh, fetchSitterData(), filterMatrixTable(), formatLastUpdated(), getTribeIconHtml(), hideLoading(), init() (+17 more)

### Community 14 - "🚀 What's New in v1.8.0"
Cohesion: 0.20
Nodes (9): 1. Interactive Sitters Command Terminal, 2. Standardized Leaderboards & Direct Alliance Links (`/alliance/AID`), 3. Manifest V3 CSP Compliance & UI Hover Styling, 4. Real-Time Debug Logger & Network Status Relay, 5. Extension-Wide JSON Hardening (`safeParseJSON`), 🛠️ Internal Code Changes, 🌐 NULL Map Engine Extension — Release v1.8.0, 📦 Release Overview (+1 more)

### Community 15 - "statsTerminal.js"
Cohesion: 0.22
Nodes (18): applyRefreshTimestamp(), fetchAdvancedStats(), formatKMB(), formatPlayerRowName(), getTribeIconHtml(), hideLoadingOverlay(), loadDashboardData(), openKpiModal() (+10 more)

### Community 17 - "draco_wasm_wrapper.js"
Cohesion: 0.06
Nodes (36): c(), e0(), h(), i(), l(), "node_modules/its-fine/dist/index.js"(), useBridge(), W() (+28 more)

### Community 18 - "MapEngineApp"
Cohesion: 0.06
Nodes (51): "3dmap.jsx"(), advance(), AnimatedTile(), BiomeScatter(), CameraController(), Canvas(), CanvasImpl(), createRoot() (+43 more)

### Community 19 - "useMapStore"
Cohesion: 0.08
Nodes (37): container, root, Atmosphere(), BiomeScatter(), NOTE: This will trigger a 404 in the Chrome network tab if the files are…, CameraController(), centerVec, DynamicSun() (+29 more)

### Community 20 - ""node_modules/@react-three/fiber/dist/events-156d8d12.esm.js""
Cohesion: 0.08
Nodes (36): appendChild(), applyProps(), attach(), calculateDpr(), createInstance(), createReconciler(), detach(), diffProps() (+28 more)

### Community 21 - "earcutLinked"
Cohesion: 0.10
Nodes (34): area(), compareXYSlope(), createNode(), cureLocalIntersections(), earcut(), earcutLinked(), eliminateHole(), eliminateHoles() (+26 more)

### Community 22 - "warn"
Cohesion: 0.08
Nodes (26): "3dmapengine/store/mapStore.js"(), "3dmapengine/utils/AssetManager.js"(), addMorphTargets(), addPrimitiveAttributes(), assignExtrasToUserData(), computeBounds(), ContextMenu(), CubicPoly() (+18 more)

### Community 23 - ""node_modules/three/build/three.core.js""
Cohesion: 0.07
Nodes (31): ceilPowerOfTwo(), clamp(), cloneUniforms(), damp(), degToRad(), denormalize(), euclideanModulo(), floorPowerOfTwo() (+23 more)

### Community 24 - "draco_decoder.js"
Cohesion: 0.08
Nodes (8): addRunDependency(), createWasm(), ensureString(), intArrayFromString(), lengthBytesUTF8(), stringToUTF8Array(), UTF8ArrayToString(), UTF8ToString()

### Community 25 - "WebGLProgram"
Cohesion: 0.08
Nodes (22): filterEmptyLine(), generateCubeUVSize(), generateDefines(), generateEnvMapBlendingDefine(), generateEnvMapModeDefine(), generateEnvMapTypeDefine(), generatePrecision(), generateShadowMapTypeDefine() (+14 more)

### Community 26 - "getCache"
Cohesion: 0.10
Nodes (20): AttributeOctahedronTransform(), AttributeQuantizationTransform(), AttributeTransformData(), Decoder(), DecoderBuffer(), destroy(), DracoFloat32Array(), DracoInt16Array() (+12 more)

### Community 27 - "arraysEqual"
Cohesion: 0.21
Nodes (19): allocTexUnits(), arraysEqual(), copyArray(), setValueM2(), setValueM3(), setValueM4(), setValueT1Array(), setValueT2DArrayArray() (+11 more)

### Community 29 - "NULL Map Engine: 3D Tactical Perspective Module (Architecture & Concept)"
Cohesion: 0.17
Nodes (11): 1. Strategic Objective, 2. Technology Stack & Architecture, 3. Map Generation & Biome Mechanics, 4. Global Tactical Alarm System (Ping Network), 5. Scalable Repository Structure, A. Multi-Channel Webhook Routing, A. Procedural Asset Scattering, B. Player Tile Iconography (Role Tagging) (+3 more)

### Community 30 - "getBinary"
Cohesion: 0.25
Nodes (8): abort(), assert(), getBinary(), getBinaryPromise(), intArrayFromBase64(), isDataURI(), isFileURI(), tryParseAsDataURI()

### Community 31 - "🌐 NULL Map Engine Extension — Release v1.9.0"
Cohesion: 0.29
Nodes (6): 1. UIverse Custom Back Navigation Engine, 2. Right-Docked Header Controls (`margin-left: auto`), 🛠️ Code Changes, 🌐 NULL Map Engine Extension — Release v1.9.0, 📦 Release Overview, 🚀 What's New in v1.9.0

### Community 32 - "flatten"
Cohesion: 0.29
Nodes (7): flatten(), setValueM2Array(), setValueM3Array(), setValueM4Array(), setValueV2fArray(), setValueV3fArray(), setValueV4fArray()

### Community 33 - "callRuntimeCallbacks"
Cohesion: 0.29
Nodes (7): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), initRuntime(), postRun(), preRun(), run()

### Community 34 - "ha"
Cohesion: 0.40
Nodes (6): He(), Q(), Ve(), ha(), l(), p()

### Community 35 - "loadingFn"
Cohesion: 0.40
Nodes (5): buildGraph(), extensions(), loadingFn(), "node_modules/@react-three/drei/core/Gltf.js"(), useLoader()

### Community 36 - ""node_modules/maath/dist/index-0332b2ed.esm.js""
Cohesion: 0.40
Nodes (5): _classCallCheck(), _defineProperty(), lcgRandom(), "node_modules/maath/dist/index-0332b2ed.esm.js"(), normalizeSeed()

### Community 37 - "createColorManagement"
Cohesion: 0.40
Nodes (5): createColorManagement(), LinearToSRGB(), SRGBToLinear(), warnOnce(), WebGLExtensions()

### Community 38 - "CubicBezier"
Cohesion: 0.40
Nodes (5): CubicBezier(), CubicBezierP0(), CubicBezierP1(), CubicBezierP2(), CubicBezierP3()

### Community 39 - "_getCommonVertexShader"
Cohesion: 0.40
Nodes (5): _getBlurShader(), _getCommonVertexShader(), _getCubemapMaterial(), _getEquirectMaterial(), _getGGXShader()

### Community 40 - "Release V2.1 (includes V2.0) - The God Mode Architecture"
Cohesion: 0.50
Nodes (3): Release V2.1 (includes V2.0) - The God Mode Architecture, V2.0: The Graphics Architecture Overhaul, V2.1: The God Mode Panel

### Community 41 - "QuadraticBezier"
Cohesion: 0.50
Nodes (4): QuadraticBezier(), QuadraticBezierP0(), QuadraticBezierP1(), QuadraticBezierP2()

### Community 42 - "emscripten_realloc_buffer"
Cohesion: 0.50
Nodes (4): emscripten_realloc_buffer(), _emscripten_resize_heap(), getHeapMax(), updateMemoryViews()

### Community 43 - "bilinear"
Cohesion: 0.67
Nodes (3): bilinear(), lerp22(), "node_modules/postprocessing/build/index.js"()

### Community 44 - "j"
Cohesion: 0.67
Nodes (3): E(), g(), j()

### Community 45 - ""node_modules/n8ao/dist/N8AO.js""
Cohesion: 0.67
Nodes (3): fill(), "node_modules/n8ao/dist/N8AO.js"(), $parcel$interopDefault()

### Community 46 - "parseKeyframeTrack"
Cohesion: 0.67
Nodes (3): flattenJSON(), getTrackTypeForValueTypeName(), parseKeyframeTrack()

### Community 47 - ""node_modules/suspend-react/index.js""
Cohesion: 1.00
Nodes (3): "node_modules/suspend-react/index.js"(), query(), shallowEqualArrays()

## Knowledge Gaps
- **140 isolated node(s):** `container`, `root`, `groundPlane`, `centerVec`, `mapCenterVec` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ha()` connect `ha` to `draco_decoder.js`, `draco_wasm_wrapper.js`, `MapEngineApp`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `InstancedGrid()` connect `"node_modules/three/build/three.core.js"` to `3dmap.bundle.js`, `MapEngineApp`, `useMapStore`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `TerritoryBorders()` connect `useMapStore` to `"node_modules/three/build/three.core.js"`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `"node_modules/three/build/three.core.js"()` (e.g. with `ceilPowerOfTwo()` and `clamp()`) actually correct?**
  _`"node_modules/three/build/three.core.js"()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `container`, `root`, `groundPlane` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidepanel.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09350649350649351 - nodes in this community are weakly interconnected._
- **Should `troopsAnalyzer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0728744939271255 - nodes in this community are weakly interconnected._