#!/bin/bash

# supabase.sh
# Description: A shell script to configure IAM settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0
#
#

_dockerBuildImage_() {
  local dockerfile="$1"
  dryrun "Building KC image"
  docker build -f "$dockerfile" . --tag=dopavecompany/dreamcare:keycloak-plain
  docker push dopavecompany/dreamcare:keycloak-plain
}

_checkIAMEnvironmentVariables_() {
  dryrun "Checking IAM Environment Variables"
  # Check if the required environment variables are set
  if [[ -z "$DOMAIN" ]]; then
    error "Required environment variables are not set!"
    exit 1
  fi
  info "Domain: $DOMAIN"
}

# Function: _deployIAMStack_
# Description: Deploys the IAM stack using the provided configuration file.
_deployIAMStack_() {
  local stack_file="$1"
  local stack_name="$2"
  dryrun "Deploying IAM Stack"
  if [ ! -f "$stack_file" ]; then
    error "IAM stack file not found: $stack_file"
    exit 1
  fi

  info "Deploying IAM stack '$stack_name' using file: $stack_file"
  docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

  if [ $? -eq 0 ]; then
    success "IAM stack '$stack_name' deployed successfully!"
  else
    error "Failed to deploy IAM stack '$stack_name'. Please check the Docker logs."
    exit 1
  fi
}

_centerOutputBlue_ "IAM Configuration" "-"
_exportEnvironmentVariables_ "./infra/IAM/.env"
_checkIAMEnvironmentVariables_
_dockerBuildImage_ "./infra/IAM/Dockerfile"
_deployIAMStack_ "./infra/IAM/IAM.yml" "IAM"
