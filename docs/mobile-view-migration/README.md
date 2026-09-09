# Mobile View Migration

This folder contains the architecture review, implementation plan, and working notes for the mobile-only New&Old redesign.

## Documents

- [Architecture Review](ARCHITECTURE_REVIEW.md) - Current application behavior and proposed mobile mapping
- [Migration Plan](MIGRATION_PLAN.md) - Incremental implementation phases and acceptance checks
- [Change Tracker](CHANGE_TRACKER.md) - Consultation-ready implementation history, validation, risks, and feedback template
- [Working Notes](WORKING_NOTES.md) - Decisions, constraints, risks, and validation log

## Scope

The migration adds a modern mobile presentation while preserving existing application behavior, APIs, data semantics, permissions, and desktop layout.

Primary mobile destinations:

1. Home
2. Songs
3. More

Song Preview remains the main performance surface opened from Songs. Setlists, recommendations, transpose, and rhythm/loop controls are focused drawers or panels rather than additional primary navigation destinations.

## Guardrails

- Do not change the recommendation algorithm.
- Do not change personal transpose semantics.
- Do not change setlist semantics or permissions.
- Do not replace the active rhythm/loop engine.
- Do not perform a backend synchronization rewrite.
- Keep the desktop interface unchanged unless a shared fix is required.
- Preserve existing single-song actions while adding mobile multi-selection where needed.
