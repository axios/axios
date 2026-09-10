---
name: pr
description: This skill should be used when the user asks to "create a PR", "open a pull request", "submit for review", or wants to push and open a PR with an AI-generated summary and checklist.
category: operations
argument-hint: [base-branch]
---

Create a pull request with an AI-generated summary and AI usage checklist.

## Pre-flight

1. **Check for uncommitted changes.** Run `git status`. If there are unstaged or staged changes that haven't been committed, suggest running `/commit` first. Do not proceed with uncommitted changes.

2. **Determine the base branch.** If `$ARGUMENTS` provides a branch name, use it. Otherwise, detect the default branch: try `git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'`, then fall back to `main`, then `master`. Verify the base branch exists.

3. **Determine the current branch.** Run `git branch --show-current`. If on the base branch, tell the user to create a feature branch first.

4. **Check for existing PR.** Run `gh pr view --json number,state,url 2>/dev/null`. If an open PR already exists for this branch, show its URL and ask if the user wants to update it or create a new one.

## Gather Context

5. **Get the full diff.** Run `git diff $BASE...HEAD` to see all changes that will be in the PR.

6. **Get the commit history.** Run `git log $BASE..HEAD --oneline` to understand the logical progression of changes.

7. **Read project guidelines.** Check for `igni.md`, `CONTRIBUTING.md`, or PR template at `.github/pull_request_template.md`. If a template exists, follow its structure.

## Generate PR Content

8. **Write the PR title.** Under 70 characters, imperative mood. Summarize the high-level intent, not the implementation details.

9. **Write the PR body** with these sections:

```markdown
## Summary
<!-- 1-3 sentences: what changed and why -->

## Changes
<!-- Bullet list of logical changes, grouped by area -->

## AI Usage
- [ ] AI-generated code has been reviewed by a human
- [ ] Tests cover AI-generated logic
- [ ] No hallucinated imports or dependencies
- [ ] Security-sensitive code manually verified
<!-- Check all that apply: -->
- [ ] AI was used for implementation
- [ ] AI was used for test generation
- [ ] AI was used for code review
- [ ] AI was used for documentation

## Test Plan
<!-- How was this tested? What commands to run? -->
```

10. **Infer the test plan** from the changes. If test files were modified, reference them. If not, note what should be tested.

## Create the PR

11. **Check for `gh` CLI.** Run `which gh`. If not installed:
    - Output the complete PR title and body as markdown
    - Tell the user to create the PR manually with this content
    - Stop here

12. **Push the branch.** Run `git push -u origin HEAD`.

13. **Create the PR.** Run:
    ```
    gh pr create --title "<title>" --body "<body>" --base <base-branch>
    ```
    Use a HEREDOC for the body to preserve formatting.

14. **Show the result.** Display the PR URL.

## Edge Cases

- **No commits on branch:** Tell the user there are no changes to submit.
- **Branch already up on remote with open PR:** Ask whether to update the existing PR description or create a new one.
- **Very large diff (>50 files):** Focus the summary on the most impactful changes. Note the PR is large and recommend splitting if feasible.
- **Draft PR:** If the user says "draft" in arguments, add `--draft` flag.
- **No `gh` CLI:** Degrade gracefully — output the PR content as markdown for manual creation.
