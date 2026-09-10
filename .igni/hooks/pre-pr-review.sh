#!/bin/bash
# .igni/hooks/pre-pr-review.sh
# Hook: PreToolUse (matcher: Bash)
#
# Early warning before push/PR: detects TODOs, debug statements, and
# console.log in staged changes. Informs the AI so it can fix them
# before the push proceeds.

# Read payload from stdin
payload=$(cat)
cmd=$(echo "$payload" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//;s/"$//')

# Only check push/PR commands
case "$cmd" in
  *"git push"*|*"gh pr create"*|*"gh pr"*) ;;
  *) echo '{"continue": true}'; exit 0 ;;
esac

# Check for leftover debug/TODO in staged changes
diff_output=$(git diff --cached 2>/dev/null || git diff HEAD 2>/dev/null)
issues=()

todo_count=$(echo "$diff_output" | grep "^+" | grep -c -i "TODO\|FIXME\|HACK\|XXX" || true)
todo_count=$(echo "$todo_count" | tr -d '[:space:]')
[[ "$todo_count" -gt 0 ]] 2>/dev/null && issues+=("$todo_count TODO/FIXME comment(s)")

debug_count=$(echo "$diff_output" | grep "^+" | grep -c "console\.log\|debugger\|breakpoint()\|import pdb\|print(" || true)
debug_count=$(echo "$debug_count" | tr -d '[:space:]')
[[ "$debug_count" -gt 0 ]] 2>/dev/null && issues+=("$debug_count debug statement(s)")

if [[ ${#issues[@]} -eq 0 ]]; then
  echo '{"continue": true}'
  exit 0
fi

msg=$(IFS=", "; echo "${issues[*]}")
echo "{\"continue\": true, \"systemMessage\": \"Before pushing: found ${msg} in your changes. Review and fix these issues before proceeding with the push.\"}"
exit 0
