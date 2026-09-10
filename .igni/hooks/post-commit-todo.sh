#!/bin/bash
# .igni/hooks/post-commit-todo.sh
# Hook: PostToolUse (matcher: Bash, background: true)
#
# After a git commit, feeds the commit context to the AI so it can
# intelligently update .igni/TODO.md — crossing out completed items
# and adding new ones based on what the commit actually did.

payload=$(cat)
cmd=$(echo "$payload" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//;s/"$//')

# Only act on commit commands
case "$cmd" in
  *"git commit"*) ;;
  *) echo '{"continue": true}'; exit 0 ;;
esac

# Only if TODO.md exists
if [[ ! -f ".igni/TODO.md" ]]; then
  echo '{"continue": true}'
  exit 0
fi

# Gather commit context
commit_msg=$(git log -1 --pretty=format:"%s" 2>/dev/null)
files_changed=$(git diff HEAD~1..HEAD --stat 2>/dev/null | head -30)
diff_preview=$(git diff HEAD~1..HEAD 2>/dev/null | head -200)

# Build the system message
msg="A git commit was just made. Review it and update .igni/TODO.md:\n"
msg+="- Mark completed items as done (change '- [ ]' to '- [x]')\n"
msg+="- Add new items if the commit introduced incomplete work\n"
msg+="- Remove items that are no longer relevant\n\n"
msg+="Commit: ${commit_msg}\n\n"
msg+="Files changed:\n${files_changed}\n\n"
msg+="Diff preview:\n${diff_preview}"

# Use python to safely JSON-encode the message
escaped=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$msg")

echo "{\"continue\": true, \"systemMessage\": ${escaped}}"
exit 0
