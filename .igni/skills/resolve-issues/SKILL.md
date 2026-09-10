---
name: resolve-issues
description: This skill should be used when the user asks to "resolve issues", "fix what CodeIndex flagged", "fix the issues in my branch", or otherwise wants the issues already detected by CodeIndex on their recent changes to be applied. Pulls issues from CodeIndex (not GitHub/GitLab APIs) and fixes them. After fixing, replies on the matching PR/MR review threads with the resolution narrative.
category: review
argument-hint: [base-branch]
---

Resolve the issues CodeIndex has already flagged on the files changed in the current branch, then reply on the matching PR/MR review threads with what was done.

This skill never calls `gh pr reviews` or the GitLab notes API to **fetch** issue text — CodeIndex already has the same findings and is the source of truth. The GH/GL APIs are used only to **post replies** back on the PR/MR threads that the CodeIndex bot opened, so the person reviewing sees "resolved by …" inline next to the original comment.

## Pre-flight Checks

1. **Confirm CodeIndex is current for HEAD.** Look at the `CodeIndex` status-bar badge:
   - `CodeIndex ✓` — indexed and ready to query.
   - `CodeIndex syncing` — wait for the sync to finish, then re-run.
   - `CodeIndex not indexed` — tell the user to open `/codeindex` and press `S`, then retry.
   - `CodeIndex uninstalled` / `inactive` / `!err` — CodeIndex isn't usable; surface the badge state to the user and stop. Do **not** fall back to scanning the diff manually.

2. **Detect the platform and the open PR/MR.**
   - Read `git remote -v`. If the remote host is `github.com` (or a GitHub Enterprise host the user has configured `gh` for), use `gh`. If it's `gitlab.com` (or a self-hosted GitLab), use `glab`.
   - Find the PR/MR for the current branch:
     - GitHub: `gh pr view --json number,state,url -q '.number'`
     - GitLab: `glab mr view -F json | jq -r '.iid'`
   - If there's no open PR/MR, that's fine — fixes still get applied locally and the chat-output summary becomes the only artifact. Note this up front so the user knows no replies will be posted.

3. **Determine the diff scope.** Use `$ARGUMENTS` as the base branch if provided; otherwise use the PR/MR's base ref, or fall back to `main` / `master`. Surface which base you're using before the next step.

4. **List changed paths.** Run `git diff --name-only "$BASE...HEAD"`. If empty, tell the user there's nothing to resolve and stop.

## Gather Findings

5. **Ask CodeIndex for the findings on those paths.** You do not query the graph
   yourself — `codeindex_cypher` is the only agent-facing CodeIndex surface and it
   lives on the **`data-architect`** specialist. Spawn it with a task naming:

   - the changed paths from step 4,
   - the severities you want — default `moderate` + `severe`, add `minor` only if
     the user asked to include nits,
   - that you want the `issues` section per item, with the item id, file path and
     reported line range,
   - a per-path cap (20 items is plenty).

   `data-architect` authors the Cypher against the documented graph schema and
   returns the findings. Notes:
   - If a path comes back with nothing, it may be brand-new and not yet indexed —
     say so and continue rather than treating it as clean.
   - CodeIndex analysis can lag a commit; step 9 re-confirms each finding against
     the file before changing anything.

6. **(Optional) Narrow by named issue category.** If the user called out a specific
   category (e.g. null-pointer dereference), pass that to `data-architect` as part
   of the same task so it filters in the query rather than you filtering after.

7. **Deduplicate** by item id — the same item can appear under multiple path prefixes if the user edited nested folders.

## Resolve

8. **Present a short plan** before editing: which files have findings, what categories, and the order you'll tackle them (severe before moderate; public API before internals).

9. **For each finding:**
   - Read the file at the reported location.
   - Confirm the issue is actually present (CodeIndex analysis can lag a commit; if the user has since fixed it, mark resolved and move on).
   - Make the fix. Keep the change minimal — fix only what was flagged, not nearby cleanup.
   - Re-read the file to confirm the fix didn't introduce a regression.
   - **Do not** sprinkle resolution comments into the source code (`// added error handling`, `# fix for review comment #123`). Source-level comments that reference a fix or a task rot quickly; this project's policy is to leave the WHAT to the code itself. The narrative belongs on the PR thread (step 10) and in the chat output (step 12), not in the file.

## Post Replies on the PR / MR

10. **Match each fix to the open review thread on the PR/MR**, then post a reply.

    Matching strategy:
    - Pull the list of open review comments once (this is the *only* GH/GL fetch this skill performs, and it's for thread IDs, not issue text):
      - GitHub: `gh api repos/{owner}/{repo}/pulls/{pr}/comments`
      - GitLab: `glab api projects/:id/merge_requests/{iid}/discussions`
    - For each fix, find the thread whose `path` + `line` (or `position.new_line` on GitLab) matches the resolved finding's location. Prefer threads authored by the CodeIndex bot account; if the bot username isn't obvious, match by file+line alone.
    - If multiple threads match, pick the most recent one and link the rest as "see also" in the reply body.
    - If no thread matches (the line moved, or the bot hasn't posted yet), skip the reply and record this in the "Unposted replies" section of the chat output so the user can decide.

11. **Write each reply in human prose**, 1–3 sentences, in the voice of the author of the change. The reply should let the reviewer understand the fix without reading the diff. Examples of the tone:

    > Added retry-with-backoff around the `connect()` call so a transient network blip no longer surfaces as a hard failure. Caps at 3 attempts, then re-raises `ConnectionError` so upstream code can decide.

    > Wrapped the token-decode call in a `try/except` returning a typed `InvalidToken` instead of letting `jwt.DecodeError` leak. Matches the error-handling pattern already used in `verify.py`.

    Avoid telegraphic phrasing like "error handling added" — the goal is that the reviewer reads the reply and knows the resolution without needing to look at the file.

    Post the reply:
    - GitHub: `gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -f body=<text>`
    - GitLab: `glab api projects/:id/merge_requests/{iid}/discussions/{discussion_id}/notes -f body=<text>`

    If the platform supports resolving the thread, mark it resolved (`gh api ... -X PATCH -f resolved=true` for some setups; GitLab supports `PUT .../discussions/{id} -f resolved=true`). If the user is on a GH plan without resolution APIs, skip silently.

## Re-verify

12. **Run the project's lint / format / test commands** (look at `Makefile`, `package.json`, `pyproject.toml`). If anything broke, fix it before declaring done.

## Output Format

Mirror what got posted on the PR/MR in the chat, plus a verification section. Use the same human-prose tone as the PR replies.

### Resolved

For each finding, a `**path:line**` heading followed by 1–3 sentences (the same text you posted as the PR reply). Adding it to the chat lets the user audit the replies without opening the PR.

### Unposted replies

Findings you resolved locally but couldn't link to a PR thread (line moved, no matching comment, no PR yet). One sentence each, naming the file and explaining why the reply didn't go out.

### Skipped

Anything you couldn't safely fix, each as a sentence. Example:

- **src/agent/team.py:88** — Left as-is. CodeIndex flagged the unbounded retry loop as a performance issue, but it's behind a feature flag that's off in production; the right fix changes behaviour the user might rely on, so this needs a human decision.

### Index lag

Files where the index hadn't caught up. One sentence each.

### Verification

Which commands you ran and whether they passed (`make lint`, `make test`, `pnpm test`, etc.). Note any pre-existing failures you didn't cause.

This skill doesn't open a PR. PR creation is the separate `pr` skill.

## Edge Cases

- **No CodeIndex available.** Surface the badge state and stop. Do not fall back to manual diff scanning — the user explicitly asked for CodeIndex-sourced findings.
- **No open PR/MR yet.** Apply fixes, skip the reply step, and tell the user up front that no replies will be posted. The chat output is the only artifact.
- **Neither `gh` nor `glab` is installed.** Apply fixes, surface "couldn't post replies — please install gh/glab", and put everything in the chat output.
- **Large diff (>50 files).** Ask the user to scope: a different base branch, a single subdirectory, or higher severity only.
- **Findings reference a file the user just renamed.** The index still has the old path. Fix at the new path, and in the PR reply mention that the location has moved so the reviewer can re-anchor.
- **CodeIndex flags an issue the user disagrees with.** Skip it — list it in "Skipped" with the reason — and do not post a reply on the PR thread for it (silence is better than arguing).
