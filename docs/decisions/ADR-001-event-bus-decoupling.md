# ADR-001: Event Bus Decoupling for Reader Engine v2

* **Status:** Accepted  
* **Date:** 2026-07-21  

## Context & Problem Statement
Direct component-to-component method invocations between the Reader UI, Download Scheduler, Telemetry Layer, and Network Observer caused high coupling and prevented modular refactoring.

## Decision Drivers
- High coupling between gesture, reader, and prefetch components.
- Need for asynchronous, non-blocking communication across reader subsystems.

## Considered Options
1. Direct method calls / prop drilling.
2. React Context callbacks everywhere.
3. Strongly-typed Categorized Event Bus (`ReaderEventBus`).

## Decision Outcome
Chosen Option: **Option 3 (Categorized Event Bus)**.  
Events are categorized into `Reader`, `Storage`, `Download`, `System`, `Telemetry`, and `Lifecycle` events, enforcing strict payload type safety and complete subsystem decoupling.
