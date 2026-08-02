# Graph Report - null-map-engine  (2026-08-01)

## Corpus Check
- 23 files · ~88,629 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1223 nodes · 2778 edges · 90 communities (73 shown, 17 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 163 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92acd804`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- troopsAnalyzer.js
- sidepanel.js
- manifest.json
- aegisTerminal.js
- background.js
- pvpAnalyzer.js
- popup.js
- render_map
- content.js
- interceptor.js
- NULL Map Engine - Version Logs
- rules/graphify.md
- workflows/graphify.md
- constructor
- createRow
- logisticsTerminal.js
- dispose
- add
- get
- t
- splice
- e
- fire
- sl
- i
- keydown
- vi
- push
- handleMouseDown
- setScrollDimensions
- _setCursor
- getWidth
- _reveal
- charAttributes
- refresh
- refreshRows
- scroll
- _sliderPointerDown
- preventDefault
- r
- warn
- open
- _getCyclicIndex
- _handleMouseUp
- _handleMouseMove
- _moveCursor
- _refreshDecorations
- antigravity-cli-sidebar/manifest.json
- handleResize
- O
- _reflowSmaller
- scrollLines
- Ne
- _step
- ns
- render
- acceptStandardWheelEvent
- charProperties
- getWindowId
- emitMany
- _refreshComputedValues
- _log
- loadSettings
- addDecoration
- update
- windowOptions
- _setDprAndFireIfDiffers
- _setOrReportSpecialColor
- areSelectionValuesReversed
- spawn
- createInstance
- _handleSelectionChange
- execute
- _handleColorEvent
- _setCellUnderline
- _sanitizeAndValidateOption
- _removeListener
- registerOscHandler
- _batchedMemoryCleanup
- compositionupdate
- emit
- _equalEvents
- fromCharData
- isFgPalette
- markRangeDirty
- _measure
- Vo
- toPromise

## God Nodes (most connected - your core abstractions)
1. `constructor()` - 197 edges
2. `e()` - 51 edges
3. `t()` - 48 edges
4. `get()` - 48 edges
5. `push()` - 41 edges
6. `i()` - 38 edges
7. `r()` - 30 edges
8. `createRow()` - 28 edges
9. `refresh()` - 24 edges
10. `_register()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `fetchAegisData()` --indirect_call--> `e()`  [INFERRED]
  extension/aegisTerminal.js → .obsidian/plugins/antigravity-cli-sidebar/main.js
- `drawCustomBadge()` --indirect_call--> `e()`  [INFERRED]
  extension/background.js → .obsidian/plugins/antigravity-cli-sidebar/main.js
- `processRawTiles()` --indirect_call--> `e()`  [INFERRED]
  extension/background.js → .obsidian/plugins/antigravity-cli-sidebar/main.js
- `runVerificationSweep()` --indirect_call--> `e()`  [INFERRED]
  extension/background.js → .obsidian/plugins/antigravity-cli-sidebar/main.js
- `fetchLogisticsData()` --indirect_call--> `e()`  [INFERRED]
  extension/logisticsTerminal.js → .obsidian/plugins/antigravity-cli-sidebar/main.js

## Import Cycles
- None detected.

## Communities (90 total, 17 thin omitted)

### Community 0 - "troopsAnalyzer.js"
Cohesion: 0.07
Nodes (38): allianceTbody, allPlayers, chartContainer, dateHeaders, ddDef, ddOff, ddPlayerMeta, ddPlayerName (+30 more)

### Community 1 - "sidepanel.js"
Cohesion: 0.11
Nodes (37): applyRefreshTimestamp(), fetchAegisTop10(), fetchChronosAlliance(), fetchChronosEvents(), fetchChronosRadar(), fetchLogisticsData(), fetchMapStats(), fetchPveCage() (+29 more)

### Community 2 - "manifest.json"
Cohesion: 0.06
Nodes (31): action, default_icon, default_popup, background, service_worker, content_scripts, 128, description (+23 more)

### Community 3 - "aegisTerminal.js"
Cohesion: 0.11
Nodes (30): aegisData, bindEvents(), btnRefresh, closeModal(), currentModalPayload, fetchAegisData(), formatLastUpdated(), getTribeMediumIcon() (+22 more)

### Community 4 - "background.js"
Cohesion: 0.17
Nodes (20): cachedTiles, drawCustomBadge(), evaluateTabForBadge(), extractAnimals(), extractBonuses(), extractOasisType(), extractRegionData(), extractStatus() (+12 more)

### Community 5 - "pvpAnalyzer.js"
Cohesion: 0.19
Nodes (9): NullMapRenderer, executeMapRequest(), generateBasicMapDataset(), _getColorForAlliance(), initPvPAnalyzer(), loadPvPOverview(), pvpRecordings, renderRecordings() (+1 more)

### Community 7 - "render_map"
Cohesion: 0.67
Nodes (3): parse_color(), render_map(), route

### Community 10 - "NULL Map Engine - Version Logs"
Cohesion: 0.22
Nodes (8): NULL Map Engine - Version Logs, V1.0, V1.1, V1.2, 🗺️ V1.3, 🚀 WebStoreRelease V1.4, 🚀 WebStoreRelease V1.5, 🚀 WebStoreRelease V1.6 (Current Release)

### Community 14 - "constructor"
Cohesion: 0.03
Nodes (67): addEncoding(), addProtocol(), _afterResize(), bell(), ca(), carriageReturn(), _checkReadonlyOptions(), clearListener() (+59 more)

### Community 15 - "createRow"
Cohesion: 0.07
Nodes (42): a(), _addStyle(), _applyMinimumContrast(), createRow(), el(), Fi(), Ga(), getBgColor() (+34 more)

### Community 16 - "logisticsTerminal.js"
Cohesion: 0.11
Nodes (36): activeGrid, bindEvents(), btnInitiatePush, btnRefresh, detailsBody, detailsCancel, detailsClose, detailsTitle (+28 more)

### Community 17 - "dispose"
Cohesion: 0.07
Nodes (36): addLineToLink(), addMarker(), [(ao = Symbol.iterator, lo = Symbol.toStringTag, ao)](), _cancelCallback(), clear(), clearAllMarkers(), clearMarkers(), delete() (+28 more)

### Community 18 - "add"
Cohesion: 0.07
Nodes (30): add(), _announceCharacters(), _applyScrollModifier(), _askForLink(), bindMouse(), _checkLinkProviderResult(), _clearCurrentLink(), compositionstart() (+22 more)

### Community 19 - "get"
Cohesion: 0.13
Nodes (33): addCodepointToCell(), backspace(), Ce(), deleteCells(), deleteChars(), deleteColumns(), deleteLines(), _eraseAttrData() (+25 more)

### Community 20 - "t"
Cohesion: 0.13
Nodes (20): addRefreshCallback(), co(), coalesce(), computeLeakingDisposables(), findFirst(), findLast(), findLastMaxBy(), findLastMonotonous() (+12 more)

### Community 21 - "splice"
Cohesion: 0.12
Nodes (18): addCsiHandler(), addDcsHandler(), addEscHandler(), Bs(), clearCsiHandler(), clearDcsHandler(), clearEscHandler(), _enableWindowsWrappingHeuristics() (+10 more)

### Community 22 - "e"
Cohesion: 0.18
Nodes (18): appendChild(), buffer(), _createArrow(), _createSlider(), e(), modifyColors(), onblur(), onchange() (+10 more)

### Community 23 - "fire"
Cohesion: 0.14
Nodes (17): combine(), _createDeadline(), _deliver(), _deliverQueue(), end(), enqueue(), fire(), hook() (+9 more)

### Community 24 - "sl"
Cohesion: 0.23
Nodes (17): _2(), c(), _createSelectionElement(), d(), h2(), handleSelectionChanged(), k(), l() (+9 more)

### Community 25 - "i"
Cohesion: 0.12
Nodes (16): activate(), forEach(), i(), _innerWrite(), input(), loadAddon(), onMultipleOptionChange(), onSpecificOptionChange() (+8 more)

### Community 26 - "keydown"
Cohesion: 0.15
Nodes (17): _bindKeys(), cancel(), compositionend(), _finalizeComposition(), _handleAnyTextareaChanges(), _handleTextAreaFocus(), Il(), _inputEvent() (+9 more)

### Community 27 - "vi"
Cohesion: 0.12
Nodes (16): clearAndLeak(), Cn(), deleteAndLeak(), fr(), getDisposableData(), getRootParent(), getTrackedDisposables(), kl() (+8 more)

### Community 28 - "push"
Cohesion: 0.16
Nodes (14): addTarget(), getPositionOfChildWindowRelativeToAncestorWindow(), getSameOriginWindowChain(), Gn(), identToString(), ignoreTarget(), ll(), pa() (+6 more)

### Community 29 - "handleMouseDown"
Cohesion: 0.19
Nodes (14): _getMouseBufferCoords(), getWrappedRangeForLine(), _handleDoubleClick(), _handleIncrementalClick(), handleMouseDown(), _handleSingleClick(), _handleTripleClick(), hasWidth() (+6 more)

### Community 30 - "setScrollDimensions"
Cohesion: 0.17
Nodes (13): Aa(), acceptScrollDimensions(), as(), equals(), _initAnimation(), _initAnimations(), ka(), _performSmoothScrolling() (+5 more)

### Community 31 - "_setCursor"
Cohesion: 0.15
Nodes (13): activateAltBuffer(), activateNormalBuffer(), charPosAbsolute(), cursorCharAbsolute(), cursorPosition(), hVPosition(), linePosAbsolute(), resetModePrivate() (+5 more)

### Community 32 - "getWidth"
Cohesion: 0.23
Nodes (13): Al(), _convertViewportColToCharacterIndex(), getAsCharData(), getChars(), getCodePoint(), getTrimmedLength(), getWidth(), _getWordAt() (+5 more)

### Community 33 - "_reveal"
Cohesion: 0.18
Nodes (13): _applyVisibilitySetting(), ensureVisibility(), _hide(), _onDragEnd(), _onDragStart(), _reveal(), _scheduleHide(), setClassName() (+5 more)

### Community 34 - "charAttributes"
Cohesion: 0.27
Nodes (13): charAttributes(), clone(), _createHyperlink(), _extractColor(), _finishHyperlink(), _getCurrentLinkId(), getSubParams(), hasSubParams() (+5 more)

### Community 35 - "refresh"
Cohesion: 0.20
Nodes (12): _addMouseDownListeners(), _checkProposedApi(), clearSelection(), deregisterCharacterJoiner(), disable(), _dragScroll(), _handleBufferActivate(), handleTrim() (+4 more)

### Community 36 - "refreshRows"
Cohesion: 0.23
Nodes (12): clearTextureAtlas(), entries(), _fireOnCanvasResize(), _fullRefresh(), handleCharSizeChanged(), handleDevicePixelRatioChange(), _handleOptionsChanged(), _injectCss() (+4 more)

### Community 37 - "scroll"
Cohesion: 0.18
Nodes (12): copyFrom(), getBg(), getFg(), getJoinedCharacters(), _getJoinedRanges(), getString(), _mergeRanges(), repeatPrecedingCharacter() (+4 more)

### Community 38 - "_sliderPointerDown"
Cohesion: 0.21
Nodes (12): delegatePointerDown(), _domNodePointerDown(), Fo(), getDesiredScrollPositionFromDelta(), getScrollPosition(), _onPointerDown(), _pointerDownRelativePosition(), _setDesiredScrollPositionNow() (+4 more)

### Community 39 - "preventDefault"
Cohesion: 0.33
Nodes (11): _arrowPointerDown(), dispatchEvent(), inertia(), newGestureEvent(), onTouchEnd(), onTouchMove(), onTouchStart(), preventDefault() (+3 more)

### Community 40 - "r"
Cohesion: 0.24
Nodes (11): cancelAndSet(), emitOne(), filter(), forEachDecorationAtCell(), fromPromises(), ie(), map(), merge() (+3 more)

### Community 41 - "warn"
Cohesion: 0.18
Nodes (11): check(), create(), event(), getMostFrequentStack(), _logSlowResolvingAsync(), Ol(), parse(), _preserveStack() (+3 more)

### Community 42 - "open"
Cohesion: 0.20
Nodes (11): _createRenderer(), _handleScreenReaderModeOptionChange(), _handleTextAreaBlur(), hasSelection(), _initGlobal(), Mn(), onCursorMove(), onResize() (+3 more)

### Community 43 - "_getCyclicIndex"
Cohesion: 0.18
Nodes (11): _flushInserted(), _getCyclicIndex(), _insert(), maxLength(), pop(), recycle(), _remove(), set() (+3 more)

### Community 44 - "_handleMouseUp"
Cohesion: 0.22
Nodes (10): _areCoordsInSelection(), Ec(), _fireEventIfSelectionChanged(), _fireOnSelectionChange(), _handleMouseUp(), _isCellInSelection(), _isClickInSelection(), _removeMouseDownListeners() (+2 more)

### Community 45 - "_handleMouseMove"
Cohesion: 0.28
Nodes (9): Ci(), getCoords(), _getMouseEventScrollAmount(), getMouseReportCoords(), _handleMouseMove(), _positionFromMouseEvent(), _selectToWordAt(), window() (+1 more)

### Community 46 - "_moveCursor"
Cohesion: 0.22
Nodes (9): cursorBackward(), cursorDown(), cursorForward(), cursorNextLine(), cursorPrecedingLine(), cursorUp(), hPositionRelative(), _moveCursor() (+1 more)

### Community 47 - "_refreshDecorations"
Cohesion: 0.22
Nodes (9): _doRefreshDecorations(), _queueRefresh(), _refreshCanvasDimensions(), _refreshColorZonePadding(), _refreshDecorations(), _refreshDrawConstants(), _refreshDrawHeightConstants(), _renderColorZone() (+1 more)

### Community 48 - "antigravity-cli-sidebar/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 49 - "handleResize"
Cohesion: 0.29
Nodes (8): _alignRowWidth(), _createAccessibilityTreeNode(), focus(), _handleBoundaryFocus(), handleResize(), _refreshRowDimensions(), _refreshRowElements(), _refreshRowsDimensions()

### Community 50 - "O"
Cohesion: 0.25
Nodes (3): Ba(), O, Oa()

### Community 51 - "_reflowSmaller"
Cohesion: 0.36
Nodes (8): copyCellsFrom(), fillViewportRows(), getBlankLine(), getNullCell(), _reflow(), _reflowLarger(), _reflowLargerAdjustViewport(), _reflowSmaller()

### Community 52 - "scrollLines"
Cohesion: 0.32
Nodes (8): registerMarker(), scrollLines(), scrollPages(), scrollToBottom(), scrollToLine(), scrollToTop(), selectLines(), _verifyIntegers()

### Community 53 - "Ne"
Cohesion: 0.29
Nodes (7): delegateScrollFromMouseWheelEvent(), isPhysicalMouseWheel(), Ne(), _onMouseWheel(), _setListeningToMouseWheel(), updateOptions(), updateScrollbarSize()

### Community 54 - "_step"
Cohesion: 0.29
Nodes (7): digest(), Ia(), ko(), rs(), _step(), wi(), _wrapUp()

### Community 55 - "ns"
Cohesion: 0.57
Nodes (6): Ea(), je(), ns(), Po(), Sa(), Ta()

### Community 56 - "render"
Cohesion: 0.38
Nodes (7): onDidScroll(), _onElementScrollPosition(), _onElementScrollSize(), _onElementSize(), render(), _renderDomNode(), _updateSlider()

### Community 57 - "acceptStandardWheelEvent"
Cohesion: 0.33
Nodes (6): accept(), acceptStandardWheelEvent(), _computeScore(), getZoomFactor(), _isAlmostInt(), mo()

### Community 58 - "charProperties"
Cohesion: 0.40
Nodes (6): cc(), charProperties(), extractShouldJoin(), extractWidth(), getStringCellWidth(), wcwidth()

### Community 59 - "getWindowId"
Cohesion: 0.47
Nodes (6): getWindowId(), getZoomLevel(), isFullscreen(), setFullscreen(), setZoomFactor(), setZoomLevel()

### Community 60 - "emitMany"
Cohesion: 0.40
Nodes (5): addParam(), addSubParam(), emitMany(), fromArray(), fromPromise()

### Community 61 - "_refreshComputedValues"
Cohesion: 0.40
Nodes (5): _computeValues(), _refreshComputedValues(), setScrollPosition(), setScrollSize(), setVisibleSize()

### Community 62 - "_log"
Cohesion: 0.40
Nodes (5): debug(), _evalLazyOptionalParams(), info(), _log(), trace()

### Community 63 - "loadSettings"
Cohesion: 0.50
Nodes (4): activateView(), loadSettings(), onload(), saveSettings()

### Community 64 - "addDecoration"
Cohesion: 0.50
Nodes (4): addDecoration(), _addLineToZone(), _lineAdjacentToZone(), _lineIntersectsZone()

### Community 65 - "update"
Cohesion: 0.50
Nodes (4): Ao(), is(), Lo(), update()

### Community 66 - "windowOptions"
Cohesion: 0.50
Nodes (4): bl(), setIconName(), setTitle(), windowOptions()

### Community 67 - "_setDprAndFireIfDiffers"
Cohesion: 0.67
Nodes (4): _setDprAndFireIfDiffers(), setWindow(), _setWindowResizeListener(), _updateDpr()

### Community 68 - "_setOrReportSpecialColor"
Cohesion: 0.50
Nodes (4): setOrReportBgColor(), setOrReportCursorColor(), setOrReportFgColor(), _setOrReportSpecialColor()

### Community 69 - "areSelectionValuesReversed"
Cohesion: 0.67
Nodes (3): areSelectionValuesReversed(), finalSelectionEnd(), finalSelectionStart()

### Community 70 - "spawn"
Cohesion: 0.67
Nodes (3): cleanup(), onData(), spawn()

### Community 71 - "createInstance"
Cohesion: 0.67
Nodes (3): createInstance(), sort(), Xs()

### Community 72 - "_handleSelectionChange"
Cohesion: 0.67
Nodes (3): error(), getSelection(), _handleSelectionChange()

### Community 73 - "execute"
Cohesion: 0.67
Nodes (3): execute(), Lt(), Nl()

### Community 74 - "_handleColorEvent"
Cohesion: 0.67
Nodes (3): _handleColorEvent(), Hs(), ml()

### Community 75 - "_setCellUnderline"
Cohesion: 0.67
Nodes (3): _handleLinkHover(), _handleLinkLeave(), _setCellUnderline()

### Community 76 - "_sanitizeAndValidateOption"
Cohesion: 0.67
Nodes (3): _sanitizeAndValidateOption(), sc(), _setupOptions()

## Knowledge Gaps
- **105 isolated node(s):** `id`, `name`, `version`, `minAppVersion`, `description` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `e()` connect `e` to `sidepanel.js`, `aegisTerminal.js`, `background.js`, `pvpAnalyzer.js`, `main.js`, `constructor`, `logisticsTerminal.js`, `dispose`, `t`, `splice`, `fire`, `sl`, `i`, `vi`, `handleMouseDown`, `getWidth`, `refresh`, `r`, `_refreshDecorations`, `scrollLines`, `addDecoration`, `emit`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `fetchLogisticsData()` connect `sidepanel.js` to `e`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `n()` connect `r` to `troopsAnalyzer.js`, `scroll`, `warn`, `open`, `_handleMouseUp`, `main.js`, `constructor`, `add`, `get`, `t`, `e`, `sl`, `i`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `constructor()` (e.g. with `c()` and `e()`) actually correct?**
  _`constructor()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `e()` (e.g. with `fetchAegisData()` and `drawCustomBadge()`) actually correct?**
  _`e()` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `t()` (e.g. with `addRefreshCallback()` and `c()`) actually correct?**
  _`t()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get()` (e.g. with `l()` and `o2()`) actually correct?**
  _`get()` has 2 INFERRED edges - model-reasoned connections that need verification._