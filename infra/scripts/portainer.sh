#!/bin/bash

# portainer.sh
# Description: A shell script to configure Portainer settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0


# Function: _checkPortainerEnvironmentVariables_
# Description: Checks if the required environment variables are set.
_checkPortainerEnvironmentVariables_() {
    dryrun "Checking Portainer Environment Variables" 
    # Check if the required environment variables are set
    if [[ -z "$DOMAIN" ]]; then
        error "Required environment variables are not set!"
        exit 1
    fi
    info "Domain: $DOMAIN"
}


# Function: _labelingDockerNode_
# Description: Configures Portainer settings.
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

    # Add labels for Portainer on the Docker node
    if docker node update --label-add portainer.portainer-data=true "$NODE_ID"; then
        success "Docker node labels updated successfully."
    else
        error "Failed to update Docker node labels."å
        exit 1
    fi
}

# Function: _deployPortainerStack_
# Description: Deploys the Portainer stack using the provided configuration file.
_deployPortainerStack_() {
    local stack_file="$1"
    local stack_name="$2"
    dryrun "Deploying Portainer Stack" 
    if [ ! -f "$stack_file" ]; then
        error "Portainer stack file not found: $stack_file"
        exit 1
    fi

    info "Deploying Portainer stack '$stack_name' using file: $stack_file"
    docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

    if [ $? -eq 0 ]; then
        success "Portainer stack '$stack_name' deployed successfully!"
        success "Portainer Dashboard: https://portainer.$DOMAIN"
    else
        error "Failed to deploy Portainer stack '$stack_name'. Please check the Docker logs."
        exit 1
    fi
}

_centerOutputBlue_ "Portainer Configuration" "-"
_checkPortainerEnvironmentVariables_
_labelingDockerNode_
_deployPortainerStack_ "./infra/portainer/portainer.yml" "portainer"