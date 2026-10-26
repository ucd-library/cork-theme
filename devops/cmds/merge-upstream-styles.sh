#!/bin/bash

# Merges synced campus styles from the upstream-styles branch into main, with plain-English
# instructions if there are conflicts. Run check-upstream-styles.sh first to see what will change.
# Usage: ./devops/cmds/merge-upstream-styles.sh

set -e

source "$(dirname "$0")/lib/upstream-styles.sh"
require_git_version
cd "$ROOT_DIR"

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "$MAIN_BRANCH" ]]; then
  echo "You need to be on the $MAIN_BRANCH branch first. Run:"
  echo "  git switch $MAIN_BRANCH"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "You have uncommitted changes. Commit or stash them first, then run this again."
  git status --short
  exit 1
fi

if [[ "$(git rev-list --count "$MAIN_BRANCH..$VENDOR_BRANCH")" == 0 ]]; then
  echo "Nothing to merge: $MAIN_BRANCH already includes every campus update."
  echo "To check campus for new changes, run: ./devops/cmds/check-upstream-styles.sh"
  exit 0
fi

IMPORTS="$(git log --format='- %s' "$MAIN_BRANCH..$VENDOR_BRANCH")"

if ! git merge --quiet --no-ff --no-edit -m "merge campus styles from $VENDOR_BRANCH" -m "$IMPORTS" \
  "$VENDOR_BRANCH" > /dev/null 2>&1; then
  echo "The merge has conflicts: campus changed the same lines as we did in these files:"
  git diff --name-only --diff-filter=U | sed 's/^/  /'
  cat <<EOF

To fix them:
  1. Open each file and find the conflict markers (<<<<<<<, =======, >>>>>>>).
     The top part is our version, the bottom part is campus's.
  2. Edit each conflict down to the code you want, and delete the markers.
     Keep our '$EDIT_FENCE' fences around any edits we keep.
  3. Mark each file as fixed:  git add <file>
  4. Finish the merge:         git commit --no-edit

To cancel the merge and put everything back the way it was:
  git merge --abort
EOF
  exit 1
fi

cat <<EOF
Merged campus styles into $MAIN_BRANCH:
$IMPORTS

Next steps:
  1. Rebuild the compiled css and css.js (build service not set up yet).
  2. Review what changed in the compiled output with git diff.
  3. Push: git push origin $MAIN_BRANCH $VENDOR_BRANCH
EOF
