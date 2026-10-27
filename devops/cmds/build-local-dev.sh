#! /bin/bash

set -e

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/lib/config.sh"

docker build \
  -t localhost/local-dev/$PROJECT_NAME:local-dev \
  -f "${SERVICES_DIR}/Dockerfile" \
  ${ROOT_DIR}