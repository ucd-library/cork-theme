#! /bin/bash
###
# Start the web server in the local dev app container
# usage: ./devops/cmds/start-app.sh
###

set -e

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/lib/local-dev.sh"

require_local_dev_service app

local_dev_exec app bash -c "npm run start-client"