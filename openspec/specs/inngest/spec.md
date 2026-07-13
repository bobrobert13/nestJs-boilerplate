# Inngest Specification

## Purpose

Cola de tareas asincrona y sistema de eventos basado en Inngest (self-hosted). Provee `InngestService` con envio de eventos individuales/lotes, un endpoint `serveHandler` para sincronizacion con el servidor Inngest, y un helper `sendHolaInngest()` para testing.

Documentacion asociada: `packages/inngest/README.md`, `INNGEST_SETUP.md`, `AGENTS.md` (seccion 4).

## Requirements

### Event-Driven Functions

The system MUST support registering and serving Inngest event-driven functions via `serve()` from `inngest/express`.

#### Scenario: Register function via serveHandler

- GIVEN functions defined in `packages/inngest/src/functions/`
- WHEN `inngest.serveHandler` is mounted as an Express handler
- THEN the system exposes the functions at `/api/inngest`

### Event Sending

The system MUST send typed events to the Inngest server using typed payloads (`ScrappingEventName`).

#### Scenario: Send single event

- GIVEN an event name and payload
- WHEN `InngestService.sendEvent(payload)` is called
- THEN the system calls `client.send(payload)`
  - AND logs the event name at debug level

#### Scenario: Send batch events

- GIVEN an array of payloads
- WHEN `sendEvents(payloads)` is called
- THEN the system sends all events in a single batch request
  - AND logs `"Batch events sent: N"`

#### Scenario: Send failure logs and rethrows

- GIVEN the Inngest server is unreachable
- WHEN `sendEvent(payload)` is called
- THEN the system logs `"Failed to send event: <name>"`
  - AND throws the underlying error

### Initialization

The system MUST initialize the Inngest client during `onModuleInit` and warn on missing keys.

#### Scenario: Missing keys emits warning

- GIVEN `INNGEST_EVENT_KEY` or `INNGEST_SIGNING_KEY` is not set
- WHEN `onModuleInit()` runs
- THEN the system logs a warning
  - AND does NOT throw

#### Scenario: Keys present logs success

- GIVEN both `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set
- WHEN `onModuleInit()` runs
- THEN the system logs `"Inngest client initialized with base URL: ..."`

### Configuration

The system MUST read configuration from `ConfigService` with sensible defaults.

#### Scenario: Default base URL

- GIVEN `INNGEST_BASE_URL` is not configured
- WHEN `InngestService` is instantiated
- THEN `_baseUrl` defaults to `"https://inngest.treborjs-dev.online/"`

#### Scenario: Custom base URL

- GIVEN `INNGEST_BASE_URL = "http://localhost:8288"`
- WHEN `InngestService` is instantiated
- THEN `_baseUrl` is `"http://localhost:8288"`

### Test Helper

The system MUST provide a `sendHolaInngest()` shortcut for sending the canonical test event.

#### Scenario: sendHolaInngest with default message

- GIVEN no message argument
- WHEN `sendHolaInngest()` is called
- THEN it sends `{ name: "scrapping/hola-inngest", data: { message: "HOLA INNGEST", timestamp: <ISO> } }`

#### Scenario: sendHolaInngest with custom message

- GIVEN `sendHolaInngest("hello world")`
- WHEN called
- THEN it sends `data.message = "hello world"`

### Client Accessor

The system MUST expose the underlying `Inngest` client via a getter for advanced usage.

#### Scenario: Access client

- GIVEN an `InngestService` instance
- WHEN `inngest.client` is accessed
- THEN it returns the underlying `Inngest` instance

## Affected Documentation

- `packages/inngest/README.md`
- `INNGEST_SETUP.md`
- `AGENTS.md` — section 4 (Packages Index)
