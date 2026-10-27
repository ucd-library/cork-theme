#! /bin/bash
set -e
CMDS_LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CMDS_DIR="$(cd "$CMDS_LIB_DIR/.." && pwd)"
ROOT_DIR="$(cd "$CMDS_DIR/../.." && pwd)"
SERVICES_DIR="$(cd "$ROOT_DIR/services" && pwd)"
COMPOSE_DIR="$(cd "$ROOT_DIR/devops/compose" && pwd)"

PROJECT_NAME="cork-theme"
LOCAL_DEV_DIR="$(cd "$ROOT_DIR/devops/compose/$PROJECT_NAME-local-dev" && pwd)"
