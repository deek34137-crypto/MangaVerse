# ADR-002: Virtualized Page Rendering & DOM Eviction Window

* **Status:** Accepted  
* **Date:** 2026-07-21  

## Context & Problem Statement
Long Webtoon manga chapters (100+ high-resolution vertical pages) caused mobile devices to allocate over 500MB of RAM and crash the browser tab due to unbounded DOM node accumulation.

## Decision Drivers
- Mobile RAM constraints ($\le 2\text{GB}$ on budget devices).
- 60/120 FPS scrolling requirement.
- Target DOM node count limit $<50$ active nodes.

## Decision Outcome
Chosen Option: **Virtualized Page DOM Eviction Window**.  
Only pages within the eviction buffer window `[currentPage - buffer, currentPage + buffer]` are rendered as full DOM image nodes. Offscreen pages are replaced with fixed aspect-ratio placeholder elements, guaranteeing stable memory usage.
