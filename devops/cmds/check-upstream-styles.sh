#!/bin/bash

# Checks campus for new SiteFarm style changes, and prints a plain-English summary of
# everything not yet merged into main. Safe to run at any time: it only adds commits
# to the upstream-styles branch, and never changes main or your working files.
# Usage: ./devops/cmds/check-upstream-styles.sh [branch-or-tag]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/upstream-styles.sh"
require_git_version
cd "$ROOT_DIR"

RANGE="$MAIN_BRANCH...$VENDOR_BRANCH"

# Prints a heading for a report section.
heading() {
  printf '\n== %s ==\n\n' "$1"
}

# Prints each line of stdin indented, or "(none)" if stdin is empty.
indent() {
  local lines
  lines="$(cat)"
  if [[ -z "$lines" ]]; then
    echo "  (none)"
  else
    sed 's/^/  /' <<< "$lines"
  fi
}

echo "Step 1 of 2: checking campus for new style changes"
"$SCRIPT_DIR/sync-upstream-styles.sh" "$@"

echo
echo "Step 2 of 2: comparing campus styles with $MAIN_BRANCH"

PENDING="$(git rev-list --count "$MAIN_BRANCH..$VENDOR_BRANCH")"
if [[ "$PENDING" == 0 ]]; then
  echo
  echo "Up to date: $MAIN_BRANCH already includes every campus update. Nothing to do."
  exit 0
fi

heading "Campus updates not yet merged into $MAIN_BRANCH"
# new log entries are the lines added to the log file since main last merged it
git diff "$RANGE" -- "$LOG_FILE" \
  | awk '/^\+\+\+/ { next } /^\+/ { print substr($0, 2) }' \
  | awk 'found || /^## / { found = 1; print }'

NAME_STATUS="$(git diff --name-status -M "$RANGE" -- "$TARGET_DIR" | sed "s|$TARGET_DIR/||g")"

heading "Files campus changed (in $TARGET_DIR)"
echo "Added:"
awk '$1 == "A" { print $2 }' <<< "$NAME_STATUS" | indent
echo "Modified:"
awk '$1 == "M" { print $2 }' <<< "$NAME_STATUS" | indent
echo "Renamed (check anything that references the old name):"
awk '$1 ~ /^R/ { print $2 " -> " $3 }' <<< "$NAME_STATUS" | indent
echo "Deleted (check anything that depends on these):"
awk '$1 == "D" { print $2 }' <<< "$NAME_STATUS" | indent

heading "Files we customised that campus also changed"
echo "These contain our '$EDIT_FENCE' edits. Check that our edits still make sense."
CHANGED="$(awk '$1 != "A" { print $2 }' <<< "$NAME_STATUS")"
CUSTOMISED="$(git grep -l "$EDIT_FENCE" "$MAIN_BRANCH" -- "$TARGET_DIR" \
  | sed "s|^$MAIN_BRANCH:$TARGET_DIR/||" || true)"
if [[ -n "$CHANGED" && -n "$CUSTOMISED" ]]; then
  grep -Fx -f <(echo "$CUSTOMISED") <<< "$CHANGED" | indent || echo "  (none)"
else
  echo "  (none)"
fi

heading "Merge preview"
set +e
MERGE_OUTPUT="$(git merge-tree --write-tree --name-only --no-messages "$MAIN_BRANCH" "$VENDOR_BRANCH")"
MERGE_STATUS=$?
set -e
if [[ "$MERGE_STATUS" == 0 ]]; then
  echo "No conflicts expected. The merge should go through cleanly."
elif [[ "$MERGE_STATUS" == 1 ]]; then
  echo "These files will have conflicts that need fixing by hand during the merge:"
  tail -n +2 <<< "$MERGE_OUTPUT" | sort -u | sed "s|$TARGET_DIR/||" | indent
else
  echo "Could not preview the merge:"
  echo "$MERGE_OUTPUT" | indent
fi

heading "Next step"
echo "To see the full line-by-line changes:"
echo "  git diff $RANGE -- $TARGET_DIR"
echo "When you are ready to bring these changes into $MAIN_BRANCH:"
echo "  ./devops/cmds/merge-upstream-styles.sh"
