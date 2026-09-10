---
name: commit
description: This skill should be used when the user asks to "commit", "save changes", "create a commit", or mentions git commit. Creates a well-formatted commit with conventional message.
category: development
argument-hint: [message]
---

Create a git commit for the current changes.

## Context

Gather the following before doing anything else:

- Current git status: !`git status`
- Current git diff (staged and unstaged): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits (for style reference): !`git log --oneline -10`

## Steps

1. **Check for changes.** Run `git status`. If the working tree is clean and there are no staged changes, stop and tell the user there is nothing to commit.

2. **Understand the diff.** Run `git diff HEAD` to see every staged and unstaged change. If only untracked files exist (no modifications or staged content), list them and ask the user which ones to include.

3. **Check recent commit style.** Run `git log --oneline -10`. If the project uses conventional commits (`feat:`, `fix:`, `docs:`, etc.), follow that convention. Otherwise write a plain imperative sentence.

4. **Decide the commit message.**
   - If `$ARGUMENTS` is provided, use it verbatim as the commit message.
   - Otherwise, generate a message from the diff:
     - First line: under 72 characters, imperative mood, focusing on **why** the change was made.
     - If the change is non-trivial, add a blank line followed by a body that explains context, motivation, or trade-offs.

5. **Stage files.** Prefer adding specific files by name rather than `git add -A` or `git add .`, which can accidentally include secrets or large binaries. Review untracked files individually before staging.

6. **Never commit secrets.** Before staging, scan for files that likely contain secrets: `.env`, `.env.*`, `credentials.json`, `*.pem`, `*.key`, `token`, or any file with "secret" in its name. If found, skip those files and warn the user.

7. **Create the commit.** Use a HEREDOC so multi-line messages render correctly:
   ```
   git commit -m "$(cat <<'EOF'
   <first line>

   <optional body>
   EOF
   )"
   ```

8. **Show the result.** Run `git log -1` to confirm the commit was created successfully.

## Edge Cases

- **No changes at all:** Tell the user the working tree is clean. Do not create an empty commit.
- **Only untracked files:** List them and ask which to include. Do not blindly `git add -A`.
- **Merge commits:** If `git status` shows a merge in progress, use `git commit` without `-m` flags to preserve the default merge message, unless the user explicitly provides a message.
- **Pre-commit hook failure:** If the commit fails due to a hook, diagnose the error, fix the issue, re-stage, and create a **new** commit. Never use `--no-verify` unless the user explicitly asks.
- **Large diff:** If the diff is very large, focus the message on the high-level intent rather than listing every file.
