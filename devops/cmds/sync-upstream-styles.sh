#!/bin/bash

# Syncs campus SiteFarm source/sass into services/package/styles/sass on the upstream-styles branch.
# Works in a temporary worktree, so the current checkout is never touched.
# Does not merge into main; that is done manually after review.
# Usage: ./devops/cmds/sync-upstream-styles.sh [branch-or-tag]

set -e

UPSTREAM_REPO="https://bitbucket.org/ietwebdev/sitefarm-pattern-lab-one.git"
UPSTREAM_REF="${1:-redesign}"
VENDOR_BRANCH="upstream-styles"
TARGET_DIR="services/package/styles/sass"

ROOT_DIR="$(git rev-parse --show-toplevel)"
TMP_DIR="$(mktemp -d)"
VENDOR_DIR="$TMP_DIR/vendor"

cleanup() {
  git -C "$ROOT_DIR" worktree remove --force "$VENDOR_DIR" 2>/dev/null || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# shallow, sparse clone of just source/sass
echo "Fetching $UPSTREAM_REPO at $UPSTREAM_REF"
git clone --quiet --depth 1 --branch "$UPSTREAM_REF" --filter=blob:none --sparse \
  "$UPSTREAM_REPO" "$TMP_DIR/upstream"
git -C "$TMP_DIR/upstream" sparse-checkout set source/sass
UPSTREAM_SHA="$(git -C "$TMP_DIR/upstream" rev-parse --short HEAD)"

# check out the vendor branch in a temporary worktree
git -C "$ROOT_DIR" worktree add --quiet "$VENDOR_DIR" "$VENDOR_BRANCH"
mkdir -p "$VENDOR_DIR/$TARGET_DIR"
rsync -a --delete "$TMP_DIR/upstream/source/sass/" "$VENDOR_DIR/$TARGET_DIR/"
git -C "$VENDOR_DIR" add -A "$TARGET_DIR"

if git -C "$VENDOR_DIR" diff --cached --quiet; then
  echo "No upstream changes."
else
  git -C "$VENDOR_DIR" commit --quiet -m "campus $UPSTREAM_REF ($UPSTREAM_SHA)"
  echo "Committed campus $UPSTREAM_REF ($UPSTREAM_SHA) to $VENDOR_BRANCH."
  echo "Next: git merge $VENDOR_BRANCH on main, rebuild, and review the compiled diff."
fi
