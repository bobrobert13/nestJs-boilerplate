# Spec: AGENTS.md Reference Audit

## Scenario: Phantom package removed
Given AGENTS.md references `@common/inngest` across §3, §4, §6, §12, §13
When the audit change is applied
Then all references to `@common/inngest` are removed from those sections
And the directory listing in §3 no longer includes `inngest/spec.md`
And the tsconfig paths in §6 no longer include `@common/inngest`

## Scenario: Phantom auth module references removed
Given AGENTS.md §11 references `apps/nominas/src/modules/auth/src/two-factor/README.md`
And AGENTS.md §13 references `apps/nominas/src/modules/auth/README.md`
When the audit change is applied
Then both references are removed from their respective sections

## Scenario: Broken link removed
Given AGENTS.md §4 contains a link to `packages/inngest/README.md`
When the audit change is applied
Then the link is removed from the package matrix

## Scenario: Undocumented modules added
Given the project contains `apps/nominas/src/modules/scraper/` with a README
And the project contains `apps/nominas/src/modules/health/`
When the audit change is applied
Then both modules appear in §4, §12, and §13

## Scenario: Spec directory listing is complete
Given `openspec/specs/` contains `common/`, `documentation/`, and `dynamic-schema/`
When the audit change is applied
Then the directory listing in §3 includes these three specs

## Scenario: Git hooks anchor fixed
Given AGENTS.md §1 has a reference to `#issues-conocidos` which has no matching anchor
When the audit change is applied
Then the reference points to a valid section anchor

## Scenario: Clean formatting
Given §9 has leftover blank lines after CHANGELOG section removal
When the audit change is applied
Then extraneous blank lines are removed

## Scenario: Inngest env var markers corrected
Given `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are marked as `⚠️ REQUIRED` in §6
But the code in `env.validation.ts` treats them as warnings, not required
When the audit change is applied
Then the markers are changed to `✓ optional` with a note about the warning
