---
name: oss-release-notes
description: >
  Generates polished, structured Markdown release notes for open source GitHub repositories.
  Use this skill whenever a user wants to write, generate, draft, or create release notes,
  a changelog entry, or a version summary for a software project. Also trigger when the user
  says things like "write up the release", "document what changed", "generate the changelog
  for this version", "what went into this release", or "summarise the PRs for this tag".
  Also trigger on `/oss-release-notes`.
  Always use this skill when a version tag or release is mentioned alongside any request to
  document, summarise, or communicate changes — even if the user doesn't say "release notes"
  explicitly. Requires the GitHub CLI (gh) and must be run inside a GitHub-backed repository.
---

# OSS Release Notes

Generates structured, technical Markdown release notes for an open source GitHub repository
by fetching merged PRs between two tags using the GitHub CLI.

---

## Step 1 — Gather Inputs

Ask the user for the following if not already provided:

1. **Base tag** — the previous release tag (e.g. `v1.2.2`)
2. **Head tag** — the new release tag (e.g. `v1.2.3`)
3. **Release date** — default to today's date if not provided

Detect the repo automatically:

```bash
gh repo view --json nameWithOwner -q ".nameWithOwner"
```

---

## Step 2 — Fetch Merged PRs

Fetch all PRs merged between the two tags. Use the commit SHAs to bound the range:

```bash
# Get the commit range between the two tags
git log --oneline <base-tag>..<head-tag>

# Get PR numbers from merge commits in range
gh pr list \
  --state merged \
  --base <default-branch> \
  --json number,title,body,labels,author,mergedAt,url \
  --limit 200 \
  | jq '[.[] | select(.mergedAt >= "<base-tag-date>" and .mergedAt <= "<head-tag-date>")]'
```

A more reliable approach — extract PR numbers directly from merge commits:

```bash
# List merge commits between tags
git log <base-tag>..<head-tag> --merges --oneline

# For each merge commit, extract PR number from commit message (e.g. "Merge pull request #1234")
# Then fetch full PR details:
gh pr view <number> --json number,title,body,labels,author,url,isDraft
```

**Filter out:**

- Draft PRs (`isDraft: true`)
- Any PR with no merge commit in the tag range

---

## Step 3 — Categorise Each PR

For each PR, determine its category by:

1. **Checking labels first** — map known labels to sections (see label map below)
2. **Reading the PR title and body** — use judgement to assign if labels are missing or ambiguous

### Label → Section Map

| Label(s)                                                  | Section                 |
| --------------------------------------------------------- | ----------------------- |
| `security`, `vulnerability`, `cve`                        | 🔒 Security Fixes       |
| `breaking`, `breaking-change`                             | ⚠️ Important Changes    |
| `deprecation`, `deprecated`                               | ⚠️ Important Changes    |
| `feature`, `enhancement`, `feat`                          | 🚀 New Features         |
| `bug`, `fix`, `bugfix`                                    | 🐛 Bug Fixes            |
| `dependencies`, `deps`, `dependabot`                      | 🔧 Maintenance & Chores |
| `chore`, `ci`, `refactor`, `docs`, `test`, `housekeeping` | 🔧 Maintenance & Chores |

> If a PR has no label, read the title and body carefully and assign to the best-fit section.
> If it does not fit any group, list it solo under the most relevant section.

---

## Step 4 — Identify New Contributors

A **new contributor** is any PR author who has **no prior merged PRs** in the repository before the base tag.

Check using:

```bash
gh pr list \
  --state merged \
  --author <username> \
  --json number,mergedAt \
  --limit 5
```

If their only merged PRs fall within this release range → they are a new contributor.

---

## Step 5 — Group Related PRs

Within each section, group PRs that share a **common theme** into a single bullet:

- Read PR titles and bodies to identify thematic clusters (e.g. multiple CI hardening PRs → one "CI Security" bullet)
- Write a **bold sub-label** summarising the group (e.g. `**CI Security:**`)
- List all PR numbers for the group inline: `(__#10618__, __#10619__, __#10627__)`
- Write a concise, neutral description synthesised from the grouped PRs' content

If a PR does not fit any group, write it as a **solo bullet** with its own bold label.

### Dependency PRs

Always collapse **all dependency update PRs** into a single bullet regardless of how many there are:

```
* **Dependencies:** Bumped `pkg-a`, `pkg-b`, and `pkg-c` to latest versions. (__#101__, __#102__, __#103__)
```

---

## Step 6 — Write the Release Notes

Assemble the final Markdown output using this structure:

```markdown
## v{version} — {Month DD, YYYY}

{One neutral, descriptive headline sentence summarising the most significant changes in this release.}

## ⚠️ Breaking Changes & Deprecations

- **{Label}:** {Description}. (**{#PR}**)

## 🔒 Security Fixes

- **{Label}:** {Description}. (**{#PR}**)

## 🚀 New Features

- **{Label}:** {Description}. (**{#PR}**, **{#PR}**)

## 🐛 Bug Fixes

- **{Label}:** {Description}. (**{#PR}**)

## 🔧 Maintenance & Chores

- **{Label}:** {Description}. (**{#PR}**, **{#PR}**)

## 🌟 New Contributors

We are thrilled to welcome our new contributors. Thank you for helping improve {project name}:

- **{@handle}** (**{#PR}**)

[Full Changelog](https://github.com/{owner}/{repo}/compare/{base-tag}...{head-tag})
```

### Section rules

- **⚠️ Breaking Changes & Deprecations** — always appears **first** if it has any content
- All other sections follow the order shown above
- **Omit any section entirely** if it has no PRs — do not include empty section headers
- **🌟 New Contributors** — omit if there are none
- **[Full Changelog]** link — always include at the very bottom

### Headline sentence

- Write one sentence only
- Neutral and descriptive — no hype, no marketing language
- Name the most significant themes: security patches, new features, notable maintenance work
- Example: _"This release delivers two critical security patches, adds runtime support for Deno and Bun, and includes significant CI hardening and dependency updates."_

### Bullet writing style

- Start with a **bold label** that names the sub-area: `**Proxy Handling:**`, `**CI Security:**`
- Follow with a concise, plain-English description drawn from the PR body
- Use technical terminology where appropriate — this audience is developers
- Keep bullets to 1–3 sentences maximum
- PR numbers go at the end in bold italics with double underscores: `(__#1234__)` or `(__#1234__, __#1235__)`

---

## Step 7 — Output

Print the final Markdown to the terminal / chat so the user can copy it directly.

Do **not** write it to a file unless the user asks.

---

## Quality Checklist

Before outputting, verify:

- [ ] Breaking changes section appears first (if present)
- [ ] No empty sections included
- [ ] All dependency PRs collapsed into one bullet
- [ ] Draft PRs excluded
- [ ] New contributors correctly identified (first-timers only)
- [ ] PR numbers bold-italicised with double underscores
- [ ] Full Changelog link uses correct compare URL
- [ ] Headline is one sentence, neutral, and accurate
- [ ] Version heading matches format: `## v1.2.3 — April 12, 2026`
