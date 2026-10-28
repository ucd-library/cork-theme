#! /bin/bash
###
# Start the client watch process in the local dev app container
# usage: ./devops/cmds/watch-client.sh
###
set -e

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/lib/local-dev.sh"

require_local_dev_service app

local_dev_exec app bash -c "npm run client-watch"