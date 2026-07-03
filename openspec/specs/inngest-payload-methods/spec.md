# Capability: inngest-payload-methods

## Purpose

The `InngestService` (`packages/inngest/src/inngest.service.ts`) is the single
entry point for emitting scrapping-lifecycle events to the Inngest queue. Its
public API MUST expose synchronous payload-constructor methods for every
event in `ScrappingEvents` so that feature code can build type-safe payloads
without re-declaring event names or data shapes. These methods are the
producers consumed by the inngest functions registered in
`functions/index.ts`.

## Requirements

### Requirement: Create Job Started Payload

The system MUST provide `createJobStartedPayload(jobId, strategyName)` on
`InngestService` that returns a payload with `name` equal to
`'scrapping/job.started'` and `data` containing `jobId`, `strategyName`, and
`timestamp` set to the current time in ISO 8601 format.

#### Scenario: Valid Job And Strategy Produce Started Event

- **GIVEN** a `jobId: string` and a `strategyName: string`
- **WHEN** `createJobStartedPayload(jobId, strategyName)` is called
- **THEN** it returns `{ name: 'scrapping/job.started', data: { jobId, strategyName, timestamp } }`

#### Scenario: Timestamp Is ISO 8601

- **GIVEN** a payload returned by `createJobStartedPayload`
- **WHEN** `payload.data.timestamp` is parsed
- **THEN** it is a valid ISO 8601 string (round-trips through `new Date(timestamp)`)

### Requirement: Create Job Completed Payload

The system MUST provide `createJobCompletedPayload(jobId, strategyName, resultCount?)`
on `InngestService` that returns a payload with `name` equal to
`'scrapping/job.completed'` and `data` containing `jobId`, `strategyName`,
`success: true`, an optional `resultCount` (omitted or `undefined` when not
supplied), and `timestamp` in ISO 8601 format.

#### Scenario: All Three Arguments Produce Completed Event With Result Count

- **GIVEN** a `jobId: string`, a `strategyName: string`, and a `resultCount: number`
- **WHEN** `createJobCompletedPayload(jobId, strategyName, resultCount)` is called
- **THEN** the returned payload has `name: 'scrapping/job.completed'`, `data.success === true`, and `data.resultCount === resultCount`

#### Scenario: Two Arguments Produce Completed Event Without Result Count

- **GIVEN** a `jobId: string` and a `strategyName: string` (no `resultCount` argument)
- **WHEN** `createJobCompletedPayload(jobId, strategyName)` is called
- **THEN** the returned payload has `data.success === true` and `data.resultCount` is `undefined` or omitted

### Requirement: Create Job Failed Payload

The system MUST provide `createJobFailedPayload(jobId, strategyName, error)`
on `InngestService` that returns a payload with `name` equal to
`'scrapping/job.failed'` and `data` containing `jobId`, `strategyName`, the
`error` string, and `timestamp` in ISO 8601 format.

#### Scenario: Error String Is Propagated In Failed Event

- **GIVEN** a `jobId: string`, a `strategyName: string`, and an `error: string`
- **WHEN** `createJobFailedPayload(jobId, strategyName, error)` is called
- **THEN** the returned payload has `name: 'scrapping/job.failed'` and `data.error === error`

### Requirement: Create Chapter Processed Payload

The system MUST provide `createChapterProcessedPayload(jobId, chapterId, chapterTitle, pagesScraped)`
on `InngestService` that returns a payload with `name` equal to
`'scrapping/chapter.processed'` and `data` containing `jobId`, `chapterId`,
`chapterTitle`, `pagesScraped`, and `timestamp` in ISO 8601 format.

#### Scenario: All Four Arguments Produce Chapter Processed Event

- **GIVEN** a `jobId: string`, a `chapterId: string`, a `chapterTitle: string`, and a `pagesScraped: number`
- **WHEN** `createChapterProcessedPayload(jobId, chapterId, chapterTitle, pagesScraped)` is called
- **THEN** the returned payload has `name: 'scrapping/chapter.processed'` and `data` includes all four fields plus `timestamp`
