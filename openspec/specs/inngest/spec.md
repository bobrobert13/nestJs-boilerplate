# Inngest Specification

## Purpose

Cola de tareas asíncronas y sistema de eventos basado en Inngest (self-hosted).

Documentación asociada: `packages/inngest/README.md`, `INNGEST_SETUP.md`

## Requirements

### Event-Driven Functions

The system MUST support registering and serving Inngest event-driven functions.

#### Scenario: Register function

- GIVEN an Inngest function definition
- WHEN the function is registered via `InngestModule`
- THEN the system exposes it at `/api/inngest`

### Event Sending

The system MUST send typed events to the Inngest server.

#### Scenario: Send single event

- GIVEN an event name and payload
- WHEN `InngestService.send(eventName, payload)` is called
- THEN the system sends the event to the Inngest server

#### Scenario: Send batch events

- GIVEN multiple event payloads
- WHEN `InngestService.sendBatch(events)` is called
- THEN the system sends all events in a single batch request

### Test Endpoint

The system SHOULD provide a test event endpoint for development.

#### Scenario: Send test event

- GIVEN a running Inngest server
- WHEN POST `/api/inngest-events/hola-inngest` is called
- THEN the system fires a test event to Inngest

## Affected Documentation

- `packages/inngest/README.md`
- `INNGEST_SETUP.md`
- `AGENTS.md` — section 3 (Packages Index)
