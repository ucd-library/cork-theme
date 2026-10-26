#!/bin/bash

# Shared config and helpers for the upstream styles scripts.
# Sourced by sync-upstream-styles.sh, check-upstream-styles.sh, and merge-upstream-styles.sh.

UPSTREAM_REPO="https://bitbucket.org/ietwebdev/sitefarm-pattern-lab-one.git"
UPSTREAM_DEFAULT_REF="redesign"
UPSTREAM_SASS_DIR="source/sass"
VENDOR_BRANCH="upstream-styles"
MAIN_BRANCH="main"
TARGET_DIR="services/package/styles/sass"
LOG_FILE="docs/upstream-styles-log.md"
EDIT_FENCE="ucdlib-edit-start"
MIN_GIT_VERSION="2.38"

ROOT_DIR="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"

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
# Reads the Upstream-Commit trailer from commits on the vendor branch.
previous_upstream_sha() {
  git -C "$ROOT_DIR" log --format='%(trailers:key=Upstream-Commit,valueonly)' "$VENDOR_BRANCH" \
    | grep -m1 . || true
}
