#!/bin/bash

# traefik.sh
# Description: A shell script to configure Traefik settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0

# Function: _checkTraefikEnvironmentVariables_
# Description: Checks if the required environment variables are set.
_checkTraefikEnvironmentVariables_() {
  dryrun "Checking Traefik Environment Variables"
  # Check if the required environment variables are set
  if [[ -z "$DOMAIN" || -z "$USE_HOSTNAME" || -z "$TRAEFIK_EMAIL" || -z "$TRAEFIK_USERNAME" || -z "$TRAEFIK_PASSWORD" ]]; then
    error "Required environment variables are not set!"
    exit 1
  fi
  info "Domain: $DOMAIN"
  info "Use Hostname: $USE_HOSTNAME"
  info "Traefik Email: $TRAEFIK_EMAIL"
  info "Traefik Username: $TRAEFIK_USERNAME"
  info "Traefik Password: $TRAEFIK_PASSWORD"
}

# Function: _configureHostName_
# Description: Displays detailed information about the operating system.
_configureHostName_() {
  dryrun "Configuring Hostname"
  local hostname="${USE_HOSTNAME:-nyc.dreamcare.ai}"
  echo "$hostname" >/etc/hostname
  if hostname -F /etc/hostname; then
    success "Hostname updated successfully to ${hostname}."
  else
    error "Failed to update the hostname to ${hostname}."
    exit 1
  fi

}

# Function: _createDockerOverlayNetwork
# Description: Creates a Docker overlay network for Traefik.
_createDockerOverlayNetwork_() {
  local network_name="traefik-public"

  # Check if the Docker overlay network exists
  if docker network ls | grep -q "${network_name}"; then
    info "Docker overlay network '${network_name}' already exists."
  else
    info "Creating Docker overlay network '${network_name}'..."
    if docker network create --driver=overlay "${network_name}"; then
      success "Docker overlay network '${network_name}' created successfully."
    else
      # error "Failed to create Docker overlay network. Verify Docker and Swarm configurations."
      # exit 1
      warning "Docker overlay network '${network_name}' already exists."
    fi
  fi
}

# Function: _labelingDockerNode_
# Description: Configures Traefik settings.
_labelingDockerNode_() {
  dryrun "Labeling Node"
  # Retrieve and export the Docker Swarm Node ID
  export NODE_ID=$(docker info -f '{{.Swarm.NodeID}}')
  if [ -n "$NODE_ID" ]; then
    info "Swarm Node ID: $NODE_ID"
  else
    error "Failed to retrieve the Swarm Node ID."ß
    exit 1
  fi

  # Add labels for Traefik on the Docker node
  if docker node update --label-add traefik-public.traefik-public-certificates=true "$NODE_ID"; then
    success "Docker node labels updated successfully."
  else
    error "Failed to update Docker node labels."å
    exit 1
  fi
}

# Function: _exportTraefikHashPassword_
# Description: Exports the hashed password for Traefik.
_exportTraefikHashPassword_() {
  dryrun "Exporting Traefik Hash Password"
  export TRAEFIK_PASSWORD="${TRAEFIK_PASSWORD:-admin}"
  # Hash the Traefik password
  export TRAEFIK_HASHED_PASSWORD=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
  if [ -n "$TRAEFIK_HASHED_PASSWORD" ]; then
    info "Traefik password hashed successfully : ${TRAEFIK_HASHED_PASSWORD}."
  else
    error "Failed to hash the Traefik password."
    exit 1
  fi
}

# Function: _deployTraefikStack_
# Description: Deploys the Traefik stack using the provided configuration file.
_deployTraefikStack_() {
  local stack_file="$1"
  local stack_name="$2"
  dryrun "Deploying Traefik Stack"
  if [ ! -f "$stack_file" ]; then
    error "Traefik stack file not found: $stack_file"
    exit 1
  fi

  info "Deploying Traefik stack '$stack_name' using file: $stack_file"
  docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

  if [ $? -eq 0 ]; then
    success "Traefik stack '$stack_name' deployed successfully!"
    success "Traefik Dashboard: https://traefik.$DOMAIN"
    success "Username: $TRAEFIK_USERNAME"
    success "Password: $TRAEFIK_PASSWORD"
  else
    error "Failed to deploy Traefik stack '$stack_name'. Please check the Docker logs."
    exit 1
  fi
}

_centerOutputBlue_ "Traefik Configuration" "-"
_exportEnvironmentVariables_ "./infra/traefik/.env"
_checkTraefikEnvironmentVariables_
_configureHostName_
_createDockerOverlayNetwork_
_labelingDockerNode_
_exportTraefikHashPassword_
_deployTraefikStack_ "./infra/traefik/traefik.yml" "traefik"
