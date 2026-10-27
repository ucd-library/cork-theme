#! /bin/bash

###
# helpers for working with the local dev docker compose project
# usage: source "$CMDS_DIR/lib/local-dev.sh"
###

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/config.sh"

LOCAL_DEV_COMPOSE_FILE="$LOCAL_DEV_DIR/compose.yaml"

# Exits with instructions if the given local dev service is not running.
# usage: require_local_dev_service [service]   (default: app)
require_local_dev_service() {
  local service="${1:-app}"
  if [[ -z "$(docker compose -f "$LOCAL_DEV_COMPOSE_FILE" ps --status running -q "$service")" ]]; then
    echo "The local dev $service container is not running. Start it with:"
    echo "  cd $LOCAL_DEV_DIR && docker compose up -d"
    exit 1
  fi
}

# Runs a command in a running local dev service, without a tty when called from a script or pipe.
# usage: local_dev_exec <service> <command> [args...]
local_dev_exec() {
  local service="$1"
  shift

  local tty_flag=""
  if [[ ! -t 0 ]]; then
    tty_flag="-T"
  fi

  docker compose -f "$LOCAL_DEV_COMPOSE_FILE" exec $tty_flag "$service" "$@"
}
