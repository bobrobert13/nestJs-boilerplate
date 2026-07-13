# HTTP Specification — DELTA

## ADDED Requirements

### POST Request with JSON Body

The system MUST support POST requests with JSON body serialization using axios
under the hood, while presenting the unified `HttpResponse<T>` shape to callers.

#### Scenario: POST with JSON body

- GIVEN a valid endpoint accepting JSON at `/users`
- WHEN `http.post(''/users'', { name: ''John'', email: ''john@x.com'' })` is called
- THEN the system serializes the body as `application/json`
- AND the system returns `HttpResponse<T>` with the created resource
- AND `status` reflects the HTTP 201 from the target

#### Scenario: POST with custom headers

- GIVEN a protected endpoint requiring authentication
- WHEN `http.post(''/users'', payload, { headers: { Authorization: ''Bearer ...'' } })` is called
- THEN the custom headers are forwarded to the target
- AND the response preserves the same shape

### Error Mapping from Axios

The system MUST convert raw axios errors into structured `HttpError` instances
so callers do not need to depend on the axios library directly.

#### Scenario: Axios 4xx response becomes HttpError

- GIVEN a target endpoint returning HTTP 404
- WHEN `http.get(''/missing'')` is called
- THEN the system throws `HttpError` with `statusCode === 404`
- AND `error.message` contains the upstream reason phrase

#### Scenario: Network error becomes ServiceUnavailableError

- GIVEN a target endpoint that is unreachable (ECONNREFUSED)
- WHEN any HTTP method is called
- THEN the system throws `ServiceUnavailableError`
- AND the original error is attached as `cause`

#### Scenario: Timeout becomes GatewayTimeout

- GIVEN a target endpoint that does not respond within the timeout
- WHEN `http.get(''/slow'', { timeout: 5000 })` is called
- THEN the system throws `GatewayTimeoutError` after 5 seconds

### PUT / PATCH / DELETE Methods

The system MUST support all standard HTTP verbs with the same signature
pattern as GET/POST.

#### Scenario: PUT updates entire resource

- GIVEN an existing resource at `/users/1`
- WHEN `http.put(''/users/1'', { name: ''New'', email: ''new@x.com'' })` is called
- THEN the system sends a PUT request with the full payload
- AND returns the updated resource

#### Scenario: PATCH applies partial update

- GIVEN an existing resource at `/users/1`
- WHEN `http.patch(''/users/1'', { name: ''New'' })` is called
- THEN the system sends only the partial fields
- AND returns the updated resource

#### Scenario: DELETE removes resource

- GIVEN an existing resource at `/users/1`
- WHEN `http.delete(''/users/1'')` is called
- THEN the system sends a DELETE request
- AND returns 204 No Content or a confirmation payload

### Response Normalization

The system MUST normalize axios responses into a consistent shape regardless
of the underlying HTTP method.

#### Scenario: Response shape consistency

- GIVEN any successful HTTP response
- WHEN the call returns
- THEN `response.data` contains the parsed body
- AND `response.status` is a numeric HTTP code
- AND `response.headers` is a plain object (string keys)