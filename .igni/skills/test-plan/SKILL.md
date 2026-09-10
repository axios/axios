---
name: test-plan
description: This skill should be used when the user asks to "create a test plan", "plan tests", "what should we test", or wants a structured test strategy for a feature or change.
category: planning
argument-hint: [description-or-file]
agent: qa
context: fork
---

Generate a structured test plan for `$ARGUMENTS`.

## Understand the Target

1. **Parse the input.** `$ARGUMENTS` could be:
   - A file path — read the file, understand its public API, side effects, and dependencies
   - A feature description — identify boundaries, inputs, outputs, and dependencies
   - A directory — scan for key modules and their interactions

2. **Read project testing conventions.** Check for `igni.md`, `conftest.py`, `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `pyproject.toml [tool.pytest]`. Understand:
   - Test framework in use
   - Naming conventions (test files, test functions)
   - Fixture/factory patterns
   - Test directory structure

3. **Find existing test patterns.** Use `rg --files -g` to find test files. Read 2-3 to understand the project's test style: assertion style, mocking approach, setup/teardown patterns.

## Generate the Test Plan

4. **Identify test categories** for the target:

   **Happy Path** (Priority: MUST)
   - Core functionality works as expected with valid inputs
   - Expected outputs are produced

   **Boundary Cases** (Priority: MUST)
   - Empty inputs, maximum values, minimum values
   - Single item vs. many items
   - Unicode, special characters, long strings

   **Error Handling** (Priority: MUST)
   - Invalid inputs produce appropriate errors
   - Missing dependencies are handled
   - Network/IO failures are handled (if applicable)

   **Edge Cases** (Priority: SHOULD)
   - Concurrent access (if applicable)
   - State transitions, ordering dependencies
   - Null/None/undefined handling

   **Integration** (Priority: SHOULD)
   - Interactions with adjacent modules
   - Database operations (if applicable)
   - External API calls (if applicable)

   **Security** (Priority: SHOULD for public-facing code)
   - Input sanitization
   - Authentication/authorization boundaries
   - Injection prevention

5. **For each test case, specify:**
   - **Name** — following the project's naming convention
   - **Category** — happy path / boundary / error / edge / integration / security
   - **Priority** — MUST / SHOULD / NICE-TO-HAVE
   - **Description** — what is being tested and why
   - **Setup** — fixtures, mocks, test data needed
   - **Expected outcome** — specific assertion or behavior

6. **Suggest mocking strategy:**
   - What should be mocked (external services, slow dependencies)
   - What should use real implementations (core logic, database if integration tests)
   - Match the project's existing mocking approach

7. **Suggest test file location** following the project's directory structure.

## Output Format

Output a markdown checklist that can be used as a tracking document:

```markdown
# Test Plan: [target name]

## Scope
[What is being tested and why]

## Conventions
- Framework: [detected]
- Location: [suggested test file path]
- Naming: [detected pattern]

## Test Cases

### Happy Path (MUST)
- [ ] `test_name` — description (setup: ...)
- [ ] `test_name` — description

### Boundary Cases (MUST)
- [ ] `test_name` — description

### Error Handling (MUST)
- [ ] `test_name` — description

### Edge Cases (SHOULD)
- [ ] `test_name` — description

### Integration (SHOULD)
- [ ] `test_name` — description

## Mocking Strategy
[What to mock and why]

## Notes
[Any special considerations]
```

## Edge Cases

- **No test framework configured:** Suggest the most common framework for the detected language and note that setup is needed.
- **Large feature (>10 files):** Break into phases. Phase 1: unit tests for core logic. Phase 2: integration tests. Phase 3: edge cases.
- **Existing tests found:** Note what's already covered and focus the plan on gaps.
