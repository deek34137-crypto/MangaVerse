# ADR-005: Task Priority Scheduler & Starvation Prevention

* **Status:** Accepted  
* **Date:** 2026-07-21  

## Context & Problem Statement
Heavy background prefetching and telemetry flushes competed with main-thread rendering, threatening frame rates during continuous scroll.

## Decision Drivers
- Priority ordering: Rendering > Prefetch > Telemetry.
- Prevention of task starvation for low-priority tasks.

## Decision Outcome
Chosen Option: **Priority Task Scheduler with Task Aging (`ReaderPriorityScheduler`)**.  
Tasks are classified into `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`. `LOW` tasks waiting $>30\text{s}$ are automatically promoted to prevent starvation.

## Operational Claim
*Prioritizes rendering-critical tasks over background work to reduce the likelihood of dropped frames and improve scrolling responsiveness.*
