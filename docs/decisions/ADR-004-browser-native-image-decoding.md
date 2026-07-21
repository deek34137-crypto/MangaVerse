# ADR-004: Browser-Native Image Decoding Pipeline

* **Status:** Accepted  
* **Date:** 2026-07-21  

## Context & Problem Statement
Image decoding on the main thread during fast scroll sessions caused micro-jank and dropped frames.

## Decision Drivers
- Need for asynchronous image decoding before attaching to DOM.
- Cross-browser compatibility constraints.

## Decision Outcome
Chosen Option: **Browser-Native Image Decode Layer (`ImageDecodeLayer`)**.  
Utilizes `createImageBitmap` and `HTMLImageElement.decode()` APIs where available, with graceful fallback to standard `onload` decoding.
