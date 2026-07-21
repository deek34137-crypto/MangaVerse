# Reader Engine v2 — Architectural Specification

> **Specification Version:** 2.0  
> **Status:** Production Standard  

---

## 1. Subsystem Architecture

The Reader Engine v2 is architected as a set of decoupled, focused modules under `src/components/reader/engine/`:

```text
Reader Engine v2 Subsystem
├── ReaderController (Main Orchestrator)
├── ReaderEventBus (Decoupled Event Publisher)
├── ReaderPriorityScheduler (CRITICAL > HIGH > MEDIUM > LOW Task Queue)
├── ReaderLifecycleManager (Formal Lifecycle Control)
├── GestureEngine (Touch Tap-Zones & Pinch/Zoom Dispatch)
├── ImageDecodeLayer (Browser-Native createImageBitmap / decode() API)
├── PrefetchManager (Network-Aware Page & Chapter Prefetching)
├── MemoryManager (DOM Eviction Bounds Computation)
├── RecoveryManager (IndexedDB Auto-Saving Session Recovery)
├── DownloadBridge (Client-side Offline Queue Integration)
├── TelemetryBridge (Async Reading Metrics Flusher)
├── ReaderPerformanceMonitor (FPS & Memory Tracker)
└── PerformanceOverlay (Developer Metrics HUD)
```

---

## 2. Browser-Native Image Decoding Pipeline

```text
Network Response
       │
       ▼
Response Validation (MIME & Status Check)
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

## 3. Reader Task Priority Scheduler

| Priority | Allowed Tasks | Execution Strategy |
| :--- | :--- | :--- |
| **CRITICAL** | Visible Page Render, Gesture Events, Current Page Decode | Immediate Main Thread Execution |
| **HIGH** | Next Page Prefetch, Direct Touch Feedback | Immediate Async Microtask |
| **MEDIUM** | Next Chapter Metadata Prefetch, Download Queue Progress | Standard Async Event Loop |
| **LOW** | Telemetry Flushes, Cache Eviction Checks | `requestIdleCallback` Execution |

---

## 4. Formal Reader Lifecycle

```text
INITIALIZE ──► LOAD_SETTINGS ──► RESTORE_SESSION ──► BUILD_RENDERER ──► BEGIN_READING
                                                                             │
                                                                             ▼
DESTROY ◄─── SUSPEND ◄─── RESUME ◄─── BACKGROUND_TASKS ◄─────────────────────┘
```

---

## 5. Explicit Out of Scope / Non-Goals

To prevent feature creep and maintain a clean, ultra-performant core codebase, the following features are **explicitly out of scope**:

- ❌ **Cloud Sync Server Sync**: User reading positions are stored client-side in `IndexedDB`. Multi-device real-time sync is handled by Auth APIs outside the reader engine.
- ❌ **Collaborative Reading & Chat**: Live synchronized reading or chat overlays inside the reader.
- ❌ **DRM / Encryption Layer**: Hardened digital rights management or custom media decryption layers.
- ❌ **Native Desktop/Mobile Binary Wrappers**: Electron / React Native wrappers (web platform standard APIs are strictly enforced).
- ❌ **Server-Side Image Transcoding**: Real-time server-side image scaling on reader scroll.

---

## 6. Development Metrics Dashboard Overlay

In development mode (`process.env.NODE_ENV !== 'production'`), `<PerformanceOverlay />` renders a floating HUD displaying:
- Real-time FPS (target $\ge 55$ FPS)
- JS Heap Memory Usage (MB)
- Current Hardware Tier (`TIER_A` through `TIER_D`)
- Network Tier & Adaptive Image Quality Mode (`2g`/`3g`/`4g`/`wifi`)
- Cumulative Dropped Frame Counter
