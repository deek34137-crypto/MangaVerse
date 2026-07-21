# ADR-003: Partitioned IndexedDB Storage Architecture

* **Status:** Accepted  
* **Date:** 2026-07-21  

## Context & Problem Statement
Storing sessions, downloaded chapter blobs, search cache, and telemetry inside a single unpartitioned storage object created data corruption risks and high query latency.

## Decision Drivers
- High volume of offline chapter binary data.
- Rapid reading position auto-saves every 2 seconds.
- Storage quota metering requirements.

## Decision Outcome
Chosen Option: **Partitioned IndexedDB Stores (`mangahub_partitioned_v1`)**.  
Data is segregated into `sessions`, `downloads`, `cache`, `settings`, and `telemetry` object stores with versioning and migration fallbacks.
