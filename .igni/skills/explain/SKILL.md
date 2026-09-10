---
name: explain
description: This skill should be used when the user asks to "explain", "how does X work", "what does X do", or wants a deep-dive explanation of code.
category: development
argument-hint: [file-or-directory]
user-invocable: true
---

Explain `$ARGUMENTS` in depth by tracing the actual source code.

## Methodology

Follow this trace sequence — do not guess or summarize from memory. Read every file you reference.

1. **Locate the target.** Resolve `$ARGUMENTS` to a concrete file or directory.
   - If it is a file path, read it.
   - If it is a directory, list its contents and identify the main entry point(s) (index file, main module, `__init__.py`, etc.). Explain the module as a whole.
   - If it is a concept or function name (not a path), use `rg` to find where it is defined, then `cat` that file.
   - If nothing is found, tell the user the target could not be located and ask for clarification.

2. **Identify entry points.** Find the public API, exported functions, CLI entry point, or route handler — wherever external callers interact with this code.

3. **Trace call chains.** Starting from each entry point, follow the execution path inward:
   - What functions are called, in what order?
   - What data is passed between them?
   - Where does branching or error handling occur?

4. **Map data flow.** Track how inputs are transformed into outputs:
   - What are the input types/shapes?
   - What intermediate transformations happen?
   - What is returned or emitted?

5. **Catalog dependencies.** List every import, external library call, or service interaction. For each one, note what role it plays. Stop tracing when you hit external library internals or framework plumbing — describe what the external call does, not how it is implemented.

6. **Identify design decisions.** Note architectural choices, patterns (factory, observer, middleware, etc.), and any non-obvious trade-offs. If something looks unusual, explain why it might have been done that way.

## Output Format

Structure the explanation as follows:

### Purpose
One to three sentences: what this code does and why it exists.

### How It Works
Step-by-step walkthrough of the execution flow. Use numbered steps. Reference specific functions and files by name.

### Key Dependencies
Bullet list of libraries, services, or internal modules this code depends on, and what each provides.

### Design Decisions
Notable architectural choices, trade-offs, or patterns — and the likely reasoning behind them.

### File References
List every file that is essential for understanding this code, with absolute paths. This lets the reader navigate directly to the relevant source.

## Depth Guidance

- Trace until you reach external libraries, framework internals, or standard library calls. Describe what those do; do not trace into their source.
- If the target is large (many files, deep call trees), prioritize the main execution path first, then cover secondary paths.
- If the target has tests, reference them — they often clarify intended behavior.

## Edge Cases

- **File does not exist:** Tell the user and suggest similar files if any match partially.
- **Directory given:** Explain the module/package as a whole — purpose, structure, key files, and how they relate.
- **Vague target (e.g., "the auth system"):** Use `rg` to find relevant files, then explain the subsystem.
- **Very large codebase target:** Focus on the top-level architecture and main flow. Offer to drill deeper into specific parts.
