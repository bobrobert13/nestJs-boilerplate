# Capability: dynamic-schema-sanitization

## Purpose

Specifies the `SanitizationService` that validates `collectionName` and `field.name` strings at every controller and compiler boundary. The service prevents NoSQL operator injection, schema poisoning, and collision with internal collections. Every entry point that accepts a user-supplied name MUST call the service before any further processing; a failed check throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }` (and `field` for field-name failures).

## Requirements

### Requirement: Collection Name Regex

`SanitizationService.sanitizeCollectionName(raw: string): string` MUST accept a string that matches the regex `^[a-z][a-z0-9_]{2,63}$`. The minimum length is 3 characters; the maximum is 64. The first character MUST be a lowercase letter; the remaining characters MUST be lowercase letters, digits, or underscores. Any other input MUST throw `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`. The method MUST return the input unchanged (no normalization) on success.

#### Scenario: Valid collection name passes through

- GIVEN a raw string `invoices`
- WHEN `sanitizeCollectionName('invoices')` is called
- THEN the method returns `'invoices'`

#### Scenario: Three-character name is accepted

- GIVEN a raw string `abc`
- WHEN `sanitizeCollectionName('abc')` is called
- THEN the method returns `'abc'`

#### Scenario: Name with mixed case is rejected

- GIVEN a raw string `Invoices`
- WHEN `sanitizeCollectionName('Invoices')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Name starting with a digit is rejected

- GIVEN a raw string `1invoices`
- WHEN `sanitizeCollectionName('1invoices')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Name starting with an underscore is rejected

- GIVEN a raw string `_invoices`
- WHEN `sanitizeCollectionName('_invoices')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Two-character name is rejected (too short)

- GIVEN a raw string `ab`
- WHEN `sanitizeCollectionName('ab')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: 65-character name is rejected (too long)

- GIVEN a raw string of 65 lowercase letters
- WHEN `sanitizeCollectionName(<that>)` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Empty string is rejected

- GIVEN a raw string `''`
- WHEN `sanitizeCollectionName('')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Name with hyphen is rejected

- GIVEN a raw string `my-invoices`
- WHEN `sanitizeCollectionName('my-invoices')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Name with dollar sign is rejected (NoSQL operator injection)

- GIVEN a raw string `$where`
- WHEN `sanitizeCollectionName('$where')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Name with dot is rejected (Mongo nested-field access)

- GIVEN a raw string `dyn.system`
- WHEN `sanitizeCollectionName('dyn.system')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

#### Scenario: Name with space is rejected

- GIVEN a raw string `my invoices`
- WHEN `sanitizeCollectionName('my invoices')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }`

### Requirement: Field Name Regex

`SanitizationService.sanitizeFieldName(raw: string): string` MUST accept a string that matches the regex `^[a-zA-Z_][a-zA-Z0-9_]{0,63}$`. The minimum length is 1 character; the maximum is 64. The first character MUST be a letter (uppercase or lowercase) or underscore. The remaining characters MUST be letters, digits, or underscores. Any other input MUST throw `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: <raw> }`. The method MUST also throw if the (case-sensitive) name is in the denylist.

#### Scenario: Valid field name passes through

- GIVEN a raw string `invoiceNumber`
- WHEN `sanitizeFieldName('invoiceNumber')` is called
- THEN the method returns `'invoiceNumber'`

#### Scenario: Single-letter name is accepted

- GIVEN a raw string `a`
- WHEN `sanitizeFieldName('a')` is called
- THEN the method returns `'a'`

#### Scenario: Underscore-prefixed name is accepted

- GIVEN a raw string `_internal`
- WHEN `sanitizeFieldName('_internal')` is called
- THEN the method returns `'_internal'`

#### Scenario: Name with a hyphen is rejected

- GIVEN a raw string `invoice-number`
- WHEN `sanitizeFieldName('invoice-number')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: 'invoice-number' }`

#### Scenario: Name starting with a digit is rejected

- GIVEN a raw string `1amount`
- WHEN `sanitizeFieldName('1amount')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: '1amount' }`

#### Scenario: Empty field name is rejected

- GIVEN a raw string `''`
- WHEN `sanitizeFieldName('')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: '' }`

#### Scenario: 65-character field name is rejected

- GIVEN a raw string of 65 letters
- WHEN `sanitizeFieldName(<that>)` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: <that> }`

#### Scenario: Field name with NoSQL operator is rejected

- GIVEN a raw string `$where`
- WHEN `sanitizeFieldName('$where')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: '$where' }`

### Requirement: Field Name Denylist

The denylist MUST contain exactly `[password, token, secret, __proto__, __v, _id]`. The check is case-sensitive (`Password` is NOT in the denylist; `password` IS). When a name matches, `sanitizeFieldName` MUST throw `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: <raw> }`. The denylist is a hard-coded module-level constant — not configurable per environment.

#### Scenario: `password` is rejected

- GIVEN a raw string `password`
- WHEN `sanitizeFieldName('password')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: 'password' }`

#### Scenario: `token` is rejected

- GIVEN a raw string `token`
- WHEN `sanitizeFieldName('token')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: 'token' }`

#### Scenario: `secret` is rejected

- GIVEN a raw string `secret`
- WHEN `sanitizeFieldName('secret')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: 'secret' }`

#### Scenario: `__proto__` is rejected (prototype pollution)

- GIVEN a raw string `__proto__`
- WHEN `sanitizeFieldName('__proto__')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: '__proto__' }`

#### Scenario: `__v` is rejected (Mongoose version key)

- GIVEN a raw string `__v`
- WHEN `sanitizeFieldName('__v')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: '__v' }`

#### Scenario: `_id` is rejected (Mongoose primary key)

- GIVEN a raw string `_id`
- WHEN `sanitizeFieldName('_id')` is called
- THEN the method throws `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: '_id' }`

#### Scenario: Denylist is case-sensitive

- GIVEN a raw string `Password` (capital P)
- WHEN `sanitizeFieldName('Password')` is called
- THEN the method returns `'Password'` (passes the regex; not on the case-sensitive denylist)

#### Scenario: `apiToken` is NOT in the denylist (substring vs full match)

- GIVEN a raw string `apiToken`
- WHEN `sanitizeFieldName('apiToken')` is called
- THEN the method returns `'apiToken'` (the denylist is exact-match, not substring)

### Requirement: Used at Every Boundary

`SanitizationService` MUST be called at three boundaries, in this order:
1. `DynamicSchemaController` — `POST /pipeline`, `POST /compile`, `PATCH /collections/:name/:id` call `sanitizeCollectionName` on the path/body collection name and `sanitizeFieldName` on every key in the schema or PATCH body.
2. `SchemaCompilerService.compileSchemaAndData` — calls `sanitizeFieldName` on every `field.name` in the `GeneratedSchema` before constructing the Mongoose `Schema`. This is defense-in-depth: if the controller ever forgets, the compiler still rejects.
3. The `dyn_` Mongo collection prefix is applied to the registered collection name. `sanitizeCollectionName` validates the user-supplied portion; the final Mongo name is `dyn_<sanitizedName>`.

#### Scenario: Compiler catches a bad field name even if the controller missed it

- GIVEN a controller bug lets a field name `password` reach the compiler
- WHEN `SchemaCompilerService.compileSchemaAndData` processes the field
- THEN the compiler MUST throw `UnprocessableEntityException` with `{ code: 'INVALID_NAME', field: 'password' }`

#### Scenario: The registered Mongo name is prefixed with `dyn_`

- GIVEN `sanitizeCollectionName('invoices')` returns `'invoices'`
- WHEN the model is registered with Mongoose
- THEN the registered collection name SHALL be `'dyn_invoices'`
- AND the `dynamic_schemas` row SHALL record `collectionName: 'dyn_invoices'`
