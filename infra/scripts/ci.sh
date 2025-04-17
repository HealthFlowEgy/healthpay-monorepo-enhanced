#!/bin/bash

# ci.sh
# Description: A shell script to configure CI/CD settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0

# Function: _checkRegistryEnvironmentVariables_
# Description: Checks if the required environment variables are set.
# _checkCIEnvironmentVariables_() {
#   # dryrun "Checking Registry Environment Variables"
#   # Check if the required environment variables are set
#   # if [[ -z "$DOMAIN" || -z "$REGISTRY_USERNAME" || -z "$REGISTRY_HASHED_PASSWORD" ]]; then
#   #   error "Required environment variables are not set!"
#   #   exit 1
#   # fi
#   info "Domain: $DOMAIN"
#   info "Registry Username: $REGISTRY_USERNAME"
#   info "Registry Hashed Password: $REGISTRY_HASHED_PASSWORD"
# }

# Function: _deployCIStack_
# Description: Deploys the CI/CD stack using the provided configuration file.
_deployCIStack_() {
  local stack_file="$1"
  local stack_name="$2"
  dryrun "Deploying CI/CD Stack"
  if [ ! -f "$stack_file" ]; then
    error "CI/CD stack file not found: $stack_file"
    exit 1
  fi

  info "Deploying CI/CD stack '$stack_name' using file: $stack_file"
  docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

  if [ $? -eq 0 ]; then
    success "CI/CD stack '$stack_name' deployed successfully!"
    success "Nexus url: https://nexus.$DOMAIN"
    success "Sonarqube url: https://sonarqube.$DOMAIN"
    success "Jenkins url: https://jenkins.$DOMAIN"
    success "gitlab url: https://gitlab.$DOMAIN"

  else
    error "Failed to deploy Registry stack '$stack_name'. Please check the Docker logs."
    exit 1
  fi
}
_centerOutputBlue_ "CI/CD Configuration" "-"
# _checkCIEnvironmentVariables_
_deployCIStack_ "./infra/ci/ci.yml" "ci"
