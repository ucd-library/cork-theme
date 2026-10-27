#!/bin/bash

# Shared config and helpers for the upstream styles scripts.
# Sourced by check-upstream-styles.sh and merge-upstream-styles.sh.

UPSTREAM_REPO="https://bitbucket.org/ietwebdev/sitefarm-pattern-lab-one.git"
UPSTREAM_DEFAULT_REF="redesign"
VENDOR_BRANCH="upstream-styles"
MAIN_BRANCH="main"
STYLES_DIR="services/package/styles"
SASS_TARGET_DIR="$STYLES_DIR/sass"
LOG_FILE="docs/upstream-styles-log.md"

# What gets synced from campus, as "campus dir|our dir|rsync excludes (space separated)".
# Images exclude Pattern Lab demo content.
SYNC_MAPPINGS=(
  "source/sass|$SASS_TARGET_DIR|"
  "source/images|$STYLES_DIR/images|/sample/ /placeholders/"
  "source/fonts|$STYLES_DIR/fonts|"
)
EDIT_FENCE="ucdlib-edit-start"
MIN_GIT_VERSION="2.38"

ROOT_DIR="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"

# Prints the campus dirs that are synced, space separated.
sync_source_dirs() {
  local mapping src dest excludes dirs=()
  for mapping in "${SYNC_MAPPINGS[@]}"; do
    IFS='|' read -r src dest excludes <<< "$mapping"
    dirs+=("$src")
  done
  echo "${dirs[@]}"
}

# Prints our dirs that campus files are synced into, space separated.
sync_target_dirs() {
  local mapping src dest excludes dirs=()
  for mapping in "${SYNC_MAPPINGS[@]}"; do
    IFS='|' read -r src dest excludes <<< "$mapping"
    dirs+=("$dest")
  done
  echo "${dirs[@]}"
}

# Exits with an upgrade message if the installed git is older than MIN_GIT_VERSION.
require_git_version() {
  local version major minor req_major req_minor
  version="$(git --version | sed -E 's/^git version ([0-9]+\.[0-9]+).*/\1/')"
  IFS=. read -r major minor <<< "$version"
  IFS=. read -r req_major req_minor <<< "$MIN_GIT_VERSION"

  if (( major < req_major || (major == req_major && minor < req_minor) )); then
    echo "These scripts need git $MIN_GIT_VERSION or newer, but you have git $version."
    echo "Please upgrade git (on macOS: 'brew install git') and try again."
    exit 1
  fi
}

# Prints the full upstream commit SHA recorded by the most recent sync, or nothing if none is recorded.
# Reads the most recent "Upstream-Commit: <sha>" line from commit messages on the vendor branch.
# Matches the line anywhere in the message, not just in git's trailer block (the last paragraph).
previous_upstream_sha() {
  git -C "$ROOT_DIR" log --format=%B "$VENDOR_BRANCH" \
    | sed -n 's/^Upstream-Commit: *\([0-9a-f]\{40\}\)$/\1/p' | head -1
}

# Brings the local vendor branch up to date with origin, so teammates build on the same imports.
# Fast-forwards if behind; exits with instructions if local and origin have diverged.
update_vendor_branch() {
  if ! git -C "$ROOT_DIR" ls-remote --exit-code --heads origin "$VENDOR_BRANCH" > /dev/null 2>&1; then
    echo "Note: origin has no $VENDOR_BRANCH branch yet, so skipping the update from origin."
    return
  fi

  git -C "$ROOT_DIR" fetch --quiet origin "$VENDOR_BRANCH"
  local local_sha remote_sha
  local_sha="$(git -C "$ROOT_DIR" rev-parse "$VENDOR_BRANCH")"
  remote_sha="$(git -C "$ROOT_DIR" rev-parse "origin/$VENDOR_BRANCH")"

  if [[ "$local_sha" == "$remote_sha" ]]; then
    return
  elif git -C "$ROOT_DIR" merge-base --is-ancestor "$local_sha" "$remote_sha"; then
    if git -C "$ROOT_DIR" worktree list --porcelain | grep -qx "branch refs/heads/$VENDOR_BRANCH"; then
      echo "$VENDOR_BRANCH is checked out somewhere, so it can't be updated. Switch away from it and try again."
      exit 1
    fi
    git -C "$ROOT_DIR" update-ref "refs/heads/$VENDOR_BRANCH" "$remote_sha" "$local_sha"
    echo "Updated $VENDOR_BRANCH from origin."
  elif git -C "$ROOT_DIR" merge-base --is-ancestor "$remote_sha" "$local_sha"; then
    echo "Note: your $VENDOR_BRANCH has syncs that are not pushed yet. Push them with:"
    echo "  git push origin $VENDOR_BRANCH"
  else
    cat <<EOF
Your $VENDOR_BRANCH branch and the one on origin have diverged. This usually means
you and someone else both synced the same campus changes. To use origin's version,
discarding your local syncs (they contain only campus code, so nothing of ours is lost):
  git branch -f $VENDOR_BRANCH origin/$VENDOR_BRANCH
Then run this again. If you already merged your local syncs into $MAIN_BRANCH, ask for help first.
EOF
    exit 1
  fi
}

# Prints the campus commit messages that touched the synced dirs between prev_sha and upstream_sha.
# Expects the upstream clone at $SYNC_TMP_DIR/upstream.
campus_commits() {
  local prev_sha="$1" upstream_sha="$2"
  local upstream_dir="$SYNC_TMP_DIR/upstream"

  if [[ -z "$prev_sha" ]]; then
    echo "Not available: no previous sync recorded."
  elif ! git -C "$upstream_dir" merge-base --is-ancestor "$prev_sha" "$upstream_sha" 2>/dev/null; then
    echo "Not available: the previous upstream commit is not an ancestor of this one (the campus branch changed, or campus rewrote history)."
  else
    local commits
    commits="$(git -C "$upstream_dir" log --no-merges --date=short --format='- %ad %s' \
      "$prev_sha..$upstream_sha" -- $(sync_source_dirs))"
    echo "${commits:-None found.}"
  fi
}

# Prepends an entry for this sync to the log file in the vendor worktree.
# Expects the vendor worktree at $SYNC_TMP_DIR/vendor, with the import already staged.
write_log_entry() {
  local ref="$1" upstream_sha="$2" upstream_short_sha="$3" prev_sha="$4"
  local log="$SYNC_TMP_DIR/vendor/$LOG_FILE"
  local modified added renamed deleted previous entries

  read -r modified added renamed deleted < <(
    git -C "$SYNC_TMP_DIR/vendor" diff --cached -M --name-status -- $(sync_target_dirs) \
      | awk '{ n[substr($1, 1, 1)]++ } END { printf "%d %d %d %d\n", n["M"], n["A"], n["R"], n["D"] }'
  )
  previous="${prev_sha:0:7}"

  # keep existing entries, dropping the header so it can be rewritten
  entries=""
  if [[ -f "$log" ]]; then
    entries="$(awk 'found || /^## / { found = 1; print }' "$log")"
  fi

  mkdir -p "$(dirname "$log")"
  cat > "$log" <<EOF
# Upstream Styles Sync Log

> This file is autogenerated by \`devops/cmds/check-upstream-styles.sh\`. Do not edit it by hand.

Each entry records one sync of campus's \`$(sync_source_dirs | sed 's/ /`, `/g')\` into \`$STYLES_DIR\` on the \`$VENDOR_BRANCH\` branch. Newest first.

## $(date +%Y-%m-%d): campus $ref ($upstream_short_sha)

- Upstream commit: \`$upstream_sha\`
- Previous upstream commit: \`${previous:-none}\`
- Files: $modified modified, $added added, $renamed renamed, $deleted deleted

### Campus commits

$(campus_commits "$prev_sha" "$upstream_sha")
EOF

  if [[ -n "$entries" ]]; then
    printf '\n%s\n' "$entries" >> "$log"
  fi
}

# Removes the temporary sync worktree and clone.
sync_cleanup() {
  if [[ -n "$SYNC_TMP_DIR" ]]; then
    git -C "$ROOT_DIR" worktree remove --force "$SYNC_TMP_DIR/vendor" 2>/dev/null || true
    rm -rf "$SYNC_TMP_DIR"
    SYNC_TMP_DIR=""
  fi
}

# Syncs campus SiteFarm sass, images, and fonts (see SYNC_MAPPINGS) into the vendor branch, and records the sync in the log file
# in the same commit. First brings the local vendor branch up to date with origin.
# Works in a temporary worktree, so the current checkout is never touched. Does not merge into main.
# Usage: sync_upstream_styles [branch-or-tag]
sync_upstream_styles() {
  local ref="${1:-$UPSTREAM_DEFAULT_REF}"
  local upstream_dir vendor_dir upstream_sha upstream_short_sha prev_sha
  local mapping src dest excludes exclude_args exclude

  update_vendor_branch

  SYNC_TMP_DIR="$(mktemp -d)"
  trap sync_cleanup EXIT
  upstream_dir="$SYNC_TMP_DIR/upstream"
  vendor_dir="$SYNC_TMP_DIR/vendor"

  # blobless, sparse clone: full commit history (for the log), but only the synced dirs' contents
  echo "Fetching $UPSTREAM_REPO at $ref"
  git clone --quiet --filter=blob:none --sparse --single-branch --branch "$ref" \
    "$UPSTREAM_REPO" "$upstream_dir"
  git -C "$upstream_dir" sparse-checkout set $(sync_source_dirs)
  upstream_sha="$(git -C "$upstream_dir" rev-parse HEAD)"
  upstream_short_sha="$(git -C "$upstream_dir" rev-parse --short HEAD)"
  prev_sha="$(previous_upstream_sha)"

  # check out the vendor branch in a temporary worktree
  git -C "$ROOT_DIR" worktree add --quiet "$vendor_dir" "$VENDOR_BRANCH"
  for mapping in "${SYNC_MAPPINGS[@]}"; do
    IFS='|' read -r src dest excludes <<< "$mapping"
    exclude_args=()
    for exclude in $excludes; do
      exclude_args+=("--exclude=$exclude")
    done
    mkdir -p "$vendor_dir/$dest"
    rsync -a --delete "${exclude_args[@]}" "$upstream_dir/$src/" "$vendor_dir/$dest/"
    git -C "$vendor_dir" add -A "$dest"
  done

  if git -C "$vendor_dir" diff --cached --quiet; then
    echo "No new changes from campus."
    sync_cleanup
    return
  fi

  write_log_entry "$ref" "$upstream_sha" "$upstream_short_sha" "$prev_sha"
  git -C "$vendor_dir" add "$LOG_FILE"
  git -C "$vendor_dir" commit --quiet -F - <<EOF
campus $ref ($upstream_short_sha)

Upstream-Commit: $upstream_sha
Upstream-Ref: $ref
EOF

  sync_cleanup
  echo "Saved campus $ref ($upstream_short_sha) to the $VENDOR_BRANCH branch."
  echo "Push it so teammates get the same import: git push origin $VENDOR_BRANCH"
}
