#!/bin/bash

# supabase.sh
# Description: A shell script to configure Databases settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0

_checkDatabasesEnvironmentVariables_() {
  dryrun "Checking Databases Environment Variables"
  # Check if the required environment variables are set
  if [[ -z "$DOMAIN" ]]; then
    error "Required environment variables are not set!"
    exit 1
  fi
  info "Domain: $DOMAIN"
}

# Function: _deployDatabasesStack_
# Description: Deploys the Databases stack using the provided configuration file.
_deployDatabasesStack_() {
  local stack_file="$1"
  local stack_name="$2"
  dryrun "Deploying Databases Stack"
  if [ ! -f "$stack_file" ]; then
    error "Databases stack file not found: $stack_file"
    exit 1
  fi

  info "Deploying Databases stack '$stack_name' using file: $stack_file"
  docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

  if [ $? -eq 0 ]; then
    success "Databases stack '$stack_name' deployed successfully!"
  else
    error "Failed to deploy Databases stack '$stack_name'. Please check the Docker logs."
    exit 1
  fi
}

_centerOutputBlue_ "Databases Configuration" "-"
_exportEnvironmentVariables_ "./infra/databases/.env"
_checkDatabasesEnvironmentVariables_
_deployDatabasesStack_ "./infra/databases/databases.yml" "databases"
