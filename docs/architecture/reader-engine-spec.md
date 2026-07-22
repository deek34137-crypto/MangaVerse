# Reader Engine v2 — Architectural Specification

Version: 2.0  
Last Updated: 2026-07-22  
Related Phase: Phase 13  
Related Components:  
- ReaderStateMachine  
- ReaderPriorityScheduler  
- PrefetchManager  
- GestureEngine  
- MemoryManager  
- ChapterReaderWrapper  

---

## 1. Overview & Architecture

The Reader Engine v2 is a state-driven, decoupled reading platform under `src/components/reader/engine/` designed for high-performance rendering of Webtoon and traditional manga page layouts.

```text
Reader Engine v2 Subsystem
├── ReaderController (Main Orchestrator & State Container)
├── ReaderEventBus (Decoupled Event Publisher/Subscriber)
├── ReaderPriorityScheduler (CRITICAL > HIGH > MEDIUM > LOW Task Queue)
├── ReaderLifecycle (Lifecycle Hooks & Transition State Machine)
├── GestureEngine (Touch Tap-Zones, Swipe, Pinch-to-Zoom & Drag)
├── ImageDecodeLayer (Browser-Native createImageBitmap / img.decode() Fallback)
├── PrefetchManager (Adaptive Connection-Aware Page & Chapter Prefetcher)
├── MemoryManager (LRU Eviction & DOM Node Windowing Bounds)
├── RecoveryManager (IndexedDB Auto-Saving Reading Progress & Scroll Position)
├── DownloadBridge (Client-side Offline Queue Integration)
├── TelemetryBridge (Async Performance Metrics Flusher)
├── ReaderPerformanceMonitor (FPS & Memory Tracker)
└── PerformanceOverlay (Development Metrics HUD)
```

---

## 2. Core Architectural Features

### 2.1 Reader State Machine (`ReaderStateMachine`)
Enforces deterministic state transitions governing reading modes (Webtoon / Single Page / Double Page), page navigation events, loading states, and error recovery transitions:
$$\text{IDLE} \to \text{LOADING_MANIFEST} \to \text{FETCHING_PAGES} \to \text{READY} \to \text{READING} \rightleftharpoons \text{PREFETCHING}$$

### 2.2 Reader Priority Task Scheduler (`ReaderPriorityScheduler`)

| Priority | Task Type | Execution Target |
| :--- | :--- | :--- |
| **CRITICAL** | Visible Page Render, Gesture Events, Current Page Decode | Immediate Main Thread Execution |
| **HIGH** | Next Page Prefetch, Direct Touch Feedback | Immediate Async Microtask |
| **MEDIUM** | Next Chapter Metadata Prefetch, Download Progress | Standard Async Event Loop |
| **LOW** | Telemetry Flushes, LRU Cache Eviction Checks | `requestIdleCallback` Execution |

### 2.3 Progressive Loading & Intelligent Prefetching (`PrefetchManager`)
- Adaptively computes prefetch window ($N$ pages ahead) based on network conditions (`navigator.connection.effectiveType`).
- Enforces request deduplication and generation guards to cancel stale prefetch requests when users jump rapidly between chapters.

### 2.4 Virtualized Rendering & Memory Bounds (`MemoryManager`)
- Virtualized viewport rendering maintains minimal active DOM node count (< 50 nodes) during continuous scrolling of long Webtoon chapters (>100 pages).
- In-memory LRU image cache pool dynamically evicts off-screen decoded image bitmaps beyond the buffer window.

### 2.5 Scroll Position Restoration & Progress Tracking (`RecoveryManager`)
- Continuously syncs scroll position and reading progress to `IndexedDB` with debounced persistence.
- Auto-restores exact reading position and page index upon chapter re-entry or browser refreshes.

---

## 3. Browser-Native Image Decoding Pipeline

```text
Network Response
       │
       ▼
Response Validation (MIME & Status Check via Image Proxy)
       │
       ▼
Image Decode Layer (createImageBitmap / img.decode() Fallback)
       │
       ▼
Memory Cache (LRU Image Eviction Pool)
       │
       ▼
Virtualization Engine (Visible Viewport + Buffer Window)
       │
       ▼
Layout Engine (Aspect-Ratio Placeholder Calculation)
       │
       ▼
DOM Renderer (Strict <50 Node Count Limit)
       │
       ▼
Compositor & Viewport (GPU Accelerated Scroll & Scale)
```

---

## 4. Touch Gesture Engine (`GestureEngine`)

Supports touch-first mobile interactions across viewports:
- **Tap Zones**: Configurable left/right/center tap zones for page turns and UI toggle overlays.
- **Double Tap**: Instant zoom toggle to $2.0\times$ scale at focal point.
- **Pinch-to-Zoom**: Fluid multi-touch scaling ($1.0\times$ to $4.0\times$) with transform-origin tracking.
- **Drag Panning**: Accelerated drag panning when zoomed in.

---

## 5. Development Metrics Overlay

In non-production environments (`process.env.NODE_ENV !== 'production'`), `<PerformanceOverlay />` renders a real-time HUD displaying:
- Real-time FPS (Target $\ge 55$ FPS)
- JS Heap Memory Usage (MB)
- Active Network Tier (`2g`/`3g`/`4g`/`wifi`)
- Cumulative Dropped Frame Counter
