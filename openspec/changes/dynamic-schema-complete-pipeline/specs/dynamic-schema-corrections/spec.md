# Capability: dynamic-schema-corrections

## Purpose

Specifies the three admin-only endpoints that let a frontend read the dynamically-inserted documents and correct them via PATCH. The corrections flow enforces type safety: the PATCH body is validated against the active schema, unknown fields are rejected with HTTP 422, and only the fields present in the schema can be modified. PATCH is for fixing what the LLM got wrong — adding new fields goes through the full pipeline.

## Requirements

### Requirement: GET List Endpoint

The system MUST expose `GET /dynamic-schema/collections/:name?limit=N` returning up to `N` documents from the collection named `name`. The endpoint MUST be admin-only (`@Roles('admin')`). The default `limit` SHALL be `50`; values above `200` MUST be clamped to `200`. Unknown collection names MUST return HTTP 404.

#### Scenario: Admin lists documents

- GIVEN a registered collection `dyn_invoices` with 12 documents and an admin JWT
- WHEN the admin calls `GET /dynamic-schema/collections/dyn_invoices?limit=10`
- THEN the response SHALL be HTTP 200 with a JSON array of up to 10 documents
- AND each document SHALL be a lean object (not a Mongoose `Document` instance)

#### Scenario: Non-admin is forbidden

- GIVEN a non-admin authenticated user
- WHEN the user calls `GET /dynamic-schema/collections/dyn_invoices`
- THEN the response SHALL be HTTP 403

#### Scenario: Anonymous request is rejected

- GIVEN no JWT in the request
- WHEN the request hits `GET /dynamic-schema/collections/dyn_invoices`
- THEN the response SHALL be HTTP 401

#### Scenario: Unknown collection returns 404

- GIVEN no model registered under `dyn_does_not_exist`
- WHEN an admin calls `GET /dynamic-schema/collections/dyn_does_not_exist`
- THEN the response SHALL be HTTP 404

#### Scenario: Limit is clamped

- GIVEN an admin calls `GET /dynamic-schema/collections/dyn_invoices?limit=9999`
- WHEN the controller validates the query
- THEN the effective limit SHALL be 200
- AND the response SHALL contain at most 200 documents

### Requirement: GET Single Document Endpoint

The system MUST expose `GET /dynamic-schema/collections/:name/:id` returning the document with the given `_id` from collection `name`. The endpoint MUST be admin-only. A valid `ObjectId` that does not match any document MUST return HTTP 404; a malformed `ObjectId` MUST return HTTP 400.

#### Scenario: Admin reads a single document

- GIVEN a registered collection `dyn_invoices` and a known document `_id`
- WHEN an admin calls `GET /dynamic-schema/collections/dyn_invoices/<id>`
- THEN the response SHALL be HTTP 200 with the document body

#### Scenario: Admin gets 404 for missing document

- GIVEN a registered collection `dyn_invoices` and a valid ObjectId that is not present
- WHEN an admin calls `GET /dynamic-schema/collections/dyn_invoices/<missingId>`
- THEN the response SHALL be HTTP 404

#### Scenario: Admin gets 400 for malformed id

- GIVEN an admin calls `GET /dynamic-schema/collections/dyn_invoices/not-an-objectid`
- WHEN the controller validates the id
- THEN the response SHALL be HTTP 400

### Requirement: PATCH Endpoint with Schema Validation

The system MUST expose `PATCH /dynamic-schema/collections/:name/:id` that validates the request body against the active schema (the schema currently registered for `name`). The endpoint MUST be admin-only. The validation rule is: every key in the request body MUST correspond to a path in `schema.paths`. Any unknown key returns HTTP 422 with `{ code: 'UNKNOWN_FIELD', field: '<key>' }`. The PATCH MUST use `findByIdAndUpdate(id, body, { new: true, runValidators: true })` so the active schema's validators run and the response includes the updated document.

#### Scenario: Admin patches a known field

- GIVEN a registered schema `{ invoiceNumber: String, amount: Number }` and an existing document
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ amount: 200 }`
- THEN the response SHALL be HTTP 200 with the updated document
- AND the document in Mongo SHALL have `amount: 200`

#### Scenario: Admin patches an unknown field

- GIVEN the same schema and document
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ evil: 'value' }`
- THEN the response SHALL be HTTP 422 with `{ code: 'UNKNOWN_FIELD', field: 'evil' }`
- AND the document SHALL NOT be modified

#### Scenario: Admin patches with a value that fails the schema validator

- GIVEN a schema where `amount: { type: Number, required: true, min: 0 }`
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ amount: -5 }`
- THEN the response SHALL be HTTP 400 (Mongoose validator failure)
- AND the document SHALL NOT be modified

#### Scenario: Admin gets 404 for missing document

- GIVEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<missingId>` with a valid body
- WHEN the update runs
- THEN the response SHALL be HTTP 404
- AND no document SHALL be created

#### Scenario: Non-admin is forbidden

- GIVEN a non-admin authenticated user
- WHEN the user calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>`
- THEN the response SHALL be HTTP 403

### Requirement: PATCH Cannot Add New Fields

The corrections flow MUST NOT allow new fields to be invented. If the agent wants to add a field, the agent MUST re-run `POST /dynamic-schema/pipeline` with the updated artifact. The controller enforces this by comparing every body key against `schema.paths` and rejecting unknown keys. The check happens BEFORE `findByIdAndUpdate` so a rejected request never touches the database.

#### Scenario: PATCH with mixed valid and unknown keys

- GIVEN a schema `{ amount: Number }`
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ amount: 200, newField: 'x' }`
- THEN the response SHALL be HTTP 422 with `{ code: 'UNKNOWN_FIELD', field: 'newField' }`
- AND `amount` SHALL NOT be updated (the entire body is rejected)
- AND the document SHALL remain unchanged

#### Scenario: PATCH with an empty body

- GIVEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{}`
- WHEN the controller validates the body
- THEN the response SHALL be HTTP 200 with the unchanged document
- AND no database write SHALL occur

### Requirement: PATCH Rejects Reserved Keys

The PATCH endpoint MUST reject any body key that is reserved system metadata, regardless of whether the key would otherwise be present in `schema.paths`. The reserved keys are: `_id`, `__v`, `__proto__`, `parsedAt`, `source`, `originalFilename`, `schemaVersion`. A request body containing any of these keys MUST return HTTP 422 with `{ code: 'RESERVED_KEY', field: '<key>' }`. The check happens BEFORE the unknown-fields check; a request that fails both checks SHALL return the `RESERVED_KEY` error (not `UNKNOWN_FIELD`).

**Rationale**: `_id`, `__v`, and `__proto__` are Mongoose internals; `parsedAt`, `source`, `originalFilename`, and `schemaVersion` are seed-metadata fields the pipeline writes. None of these are user-editable through PATCH; allowing an admin to PATCH them would either be silently ignored by Mongoose (noisy) or cause undefined behavior.

#### Scenario: PATCH attempts to overwrite _id

- GIVEN a registered schema and an existing document `_id`
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ _id: 'hijack' }`
- THEN the response SHALL be HTTP 422 with `{ code: 'RESERVED_KEY', field: '_id' }`
- AND the document SHALL remain unchanged (same `_id`)

#### Scenario: PATCH attempts to overwrite seed metadata

- GIVEN a document with `parsedAt: <Date>`, `source: 'pipeline'`, `schemaVersion: 1`
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ parsedAt: null, source: 'manual' }`
- THEN the response SHALL be HTTP 422 with `{ code: 'RESERVED_KEY', field: 'parsedAt' }`
- AND the document SHALL remain unchanged

#### Scenario: PATCH with mixed reserved and unknown keys returns RESERVED_KEY (not UNKNOWN_FIELD)

- GIVEN a schema `{ amount: Number }`
- WHEN an admin calls `PATCH /dynamic-schema/collections/dyn_invoices/<id>` with `{ _id: 'x', evil: 'y' }`
- THEN the response SHALL be HTTP 422 with `{ code: 'RESERVED_KEY', field: '_id' }`
- AND `evil` SHALL NOT be reported in the response (the check is short-circuited on first reserved key)
