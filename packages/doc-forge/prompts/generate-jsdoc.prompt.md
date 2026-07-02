# Prompt: Generate JSDoc/Docstrings

## Input Required

- `{{SRC_DIR}}` — Source directory from hydration
- `{{LANGUAGE}}` — TypeScript, Python, Go, Rust, etc.
- `{{PUBLIC_EXPORTS}}` — List of all public exports WITHOUT docstrings:
  ```
  packages/ai/src/ai.service.ts:42 — class AiService.generateText(provider, prompt, systemPrompt?, options?)
  packages/ai/src/ai.service.ts:78 — class AiService.chat(provider, messages, options?)
  packages/auth/src/strategies/jwt.strategy.ts:15 — class JwtStrategy.validate(payload)
  ```
- `{{EXISTING_JSDOC}}` — List of public exports that ALREADY have docstrings (do not touch these)
- `{{CONVENTION}}` — JSDoc convention from DOCUMENTATION-CONVENTION.md:
  - Required tags: @param, @returns, @throws (or language equivalent)
  - Optional tags: @see, @deprecated, @since, @example
  - Exceptions: what doesn't need docs (private methods, DI constructors)

## Output Format

For each undocumented public export, output the complete docstring:

```{{LANGUAGE}}
/**
 * {{DESCRIPTION}}
 *
{{PARAM_TAGS}}
{{RETURNS_TAG}}
{{THROWS_TAGS}}
{{EXTRA_TAGS}}
 */
{{EXPORT_SIGNATURE}}
```

Grouped by file, with file path headers.

## Prompt

````
You are generating JSDoc/docstring documentation for {{PROJECT_NAME}}.

PROJECT CONTEXT:
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Source directory: {{SRC_DIR}}

CONVENTION:
{{CONVENTION_CONTENT}}

UNDOCUMENTED EXPORTS (these NEED docstrings):
{{UNDOCUMENTED_EXPORTS_LIST}}

ALREADY DOCUMENTED (do NOT modify these):
{{DOCUMENTED_EXPORTS_LIST}}

YOUR TASK:
Generate docstrings for every undocumented public export. Follow these rules:

1. DO NOT MODIFY documented exports. Only add docstrings where they're missing.

2. FOR EACH UNDOCUMENTED EXPORT, write a docstring with:

   a) Description (REQUIRED): One sentence explaining WHAT the function/method/class
      does from the CALLER'S perspective. Not how it's implemented. Use the active voice.
      - GOOD: "Sends an email using the Resend API and returns the delivery status."
      - BAD: "This method calls the Resend client and then parses the response."

   b) @param tags (REQUIRED for each parameter):
      - For each parameter, explain:
        - What it represents (use the SAME name as the function signature)
        - Expected type or shape (e.g., "Object with to, subject, html fields")
        - Optional? Default value?
        - Any constraints (e.g., "must be a valid email address")
      - Format: `@param {{PARAM_NAME}} - {{DESCRIPTION}}`

   c) @returns tag (REQUIRED for non-void functions):
      - What the function returns
      - Type and shape (e.g., "Promise that resolves to { id, recipients, timestamp }")
      - What the return value means (e.g., "null if user not found")
      - Format: `@returns {{DESCRIPTION}}`

   d) @throws tag (REQUIRED if the function throws):
      - What exceptions can be thrown
      - Under what conditions
      - What the caller should do about it
      - Format: `@throws {{ERROR_TYPE}} {{CONDITION}}`
      - Refer to the Error Handling table for this package's error strategy

   e) @see tag (OPTIONAL — add when the function relates to another export):
      - Format: `@see {{RELATED_EXPORT}} for {{RELATED_PURPOSE}}`

   f) @deprecated tag (OPTIONAL — add if the function appears deprecated):
      - Format: `@deprecated Use {{ALTERNATIVE}} instead.`

   g) @example tag (OPTIONAL — add for complex functions):
      - Format: ```{{LANGUAGE}} code block showing real usage

3. LANGUAGE-SPECIFIC FORMATTING:

   {{LANGUAGE_SPECIFIC_INSTRUCTIONS}}

   For TypeScript/JavaScript:
   - Use JSDoc format: `/** ... */`
   - First line: `/**` on its own line
   - Description on the next line
   - Tags indented with one space
   - Closing ` */` on its own line

   For Python:
   - Use Google-style docstrings inside `"""..."""`
   - Args: section for parameters
   - Returns: section for return value
   - Raises: section for exceptions

   For Go:
   - Use `// FunctionName does X.` format
   - First word must be the function name
   - Complete sentences ending with period

   For Rust:
   - Use `///` doc comments
   - `/// # Arguments` section for parameters
   - `/// # Returns` section for return value
   - `/// # Errors` section for Result error types

4. READ THE SOURCE before writing any docstring. You need to understand:
   - What the function actually does (read the implementation)
   - What edge cases it handles
   - What external services it calls
   - What error conditions exist

5. INFER FROM USAGE: Look at how the function is called in the codebase.
   The call sites tell you more about the function than its implementation.
   - What arguments are actually passed?
   - How is the return value used?
   - What error handling wraps the calls?

6. GROUP BY FILE: Output docstrings grouped by source file, with file path headers:
````

### {{FILE_PATH}}

{{DOCSTRING_1}}
{{DOCSTRING_2}}

```

7. SELF-VALIDATE: After generating, verify:
- Every parameter in the signature has a @param tag
- Return type matches @returns description
- @throws covers all throw sites in the implementation
- No @param for parameters that don't exist
- Description is a complete sentence ending with a period
- No implementation details in the description (public API perspective)

OUTPUT all generated docstrings grouped by file.
```

## Usage Context

- **Phase**: Phase 3 (Generate) — parallel to README generation
- **Trigger**: After audit identifies JSDoc coverage below threshold (typically < 70%), or when a new public export is added
- **Depends on**: Phase 1 audit (JSDoc coverage score), CONVENTION.md (docstring format), error-handling.spec.md (throw patterns)
- **Feeds into**: Phase 4 validation (JSDoc dimension), CI doc-check job
- **Re-run frequency**: When new public exports are added, before release if JSDoc coverage drops

## Real Example from nestJs-boilerplate

This prompt was applied to the NestJS 11 monorepo after the audit found JSDoc coverage at 60% (1.2/2.0 on the rubric).

**What was missing**: 42 undocumented public exports across 6 packages.

**Key transformations:**

1. **Auth controllers** (12 exports): `AuthController`, `TwoFactorController`, `PasskeysController` had ZERO Swagger decorators. The prompt added:

   ```typescript
   /**
    * Authenticates a user with email and password.
    * Returns JWT access and refresh tokens.
    * @param dto - Login credentials (email, password)
    * @returns { accessToken, refreshToken, user } on success
    * @throws UnauthorizedException if credentials are invalid
    */
   @Post('login')
   async login(@Body() dto: LoginDto) { ... }
   ```

2. **Database transaction decorators** (4 exports): `@Transaction`, `@TransactionParam`, `TransactionManager`, `TransactionalWrapper` had no docs. The prompt read the transaction source code and produced docstrings explaining the auto-retry behavior and session propagation pattern.

3. **HTTP error classes** (8 exports): `BadRequestError`, `NotFoundError`, etc. had minimal docs. The prompt read each class constructor and documented the factory function `createHttpError` alongside the class hierarchy.

4. **AI service methods** (6 exports): `generateSchemaFromImage`, `generateSchemaFromText`, `embeddings`, `createEmbedding` were undocumented. The prompt traced each method to the provider interface and documented the provider-agnostic API.

**Key pattern observed**: The "read the source before writing" rule was critical for the `@Transaction()` decorator. Its implementation uses `Reflect.getMetadata` and `APPLICATION_WRAPPER_OPTIONS` — a NestJS-specific pattern that the docstring correctly explained as "wraps the method in a MongoDB transaction with automatic retry" without exposing the reflection internals.

**Post-generation**: JSDoc coverage went from 60% to 94%, raising the dimension score from 1.2 to 1.9 out of 2.0.
