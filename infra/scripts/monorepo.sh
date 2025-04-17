#!/bin/bash

# ci.sh
# Description: A shell script to configure monorepo/CD settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0

_deploymonorepoStack_() {
  local stack_file="$1"
  local stack_name="$2"
  dryrun "Deploying monorepo Stack"
  if [ ! -f "$stack_file" ]; then
    error "monorepo stack file not found: $stack_file"
    exit 1
  fi

  info "Deploying monorepo stack '$stack_name' using file: $stack_file"
  docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

  if [ $? -eq 0 ]; then
    success "monorepo stack '$stack_name' deployed successfully!"
    success "Loki url: https://loki.$DOMAIN"
  else
    error "Failed to deploy Registry stack '$stack_name'. Please check the Docker logs."
    exit 1
  fi
}
_centerOutputBlue_ "monorepo/CD Configuration" "-"
# _checkmonorepoEnvironmentVariables_
_deploymonorepoStack_ "./infra/monorepo/monorepo.yml" "monorepo"
