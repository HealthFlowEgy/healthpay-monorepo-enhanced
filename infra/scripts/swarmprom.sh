#!/bin/bash

# swarmprom.sh
# Description: A shell script to configure Swarmprom settings.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0


# Function: _checkSwarmPromEnvironmentVariables_
# Description: Checks if the required environment variables are set.
_checkSwarmPromEnvironmentVariables_() {
    dryrun "Checking Swarmprom Environment Variables" 
    # Check if the required environment variables are set
    if [[ -z "$SWARMPROM_ADMIN_USER" || -z "$SWARMPROM_ADMIN_PASSWORD" ]]; then
        error "Required environment variables are not set!"
        exit 1
    fi
    info "Swarmprom Username: $SWARMPROM_ADMIN_USER"
    info "Swarmprom Password: $SWARMPROM_ADMIN_PASSWORD"
}


# # Function: _exportSwarmpromHashPassword_
# # Description: Exports the hashed password for Swarmprom.
_exportSwarmpromHashPassword_() {
     dryrun "Exporting Swarmprom Hash Password" 
     export SWARMPROM_ADMIN_PASSWORD="${SWARMPROM_ADMIN_PASSWORD:-admin}"
    # Hash the Swarmprom password
    export SWARMPROM_HASHED_PASSWORD=$(openssl passwd -apr1 "$SWARMPROM_ADMIN_PASSWORD")
    if [ -n "$SWARMPROM_HASHED_PASSWORD" ]; then
        info "Swarmprom password hashed successfully : ${SWARMPROM_HASHED_PASSWORD}."
    else
        error "Failed to hash the Swarmprom password."
        exit 1
    fi
}

# Function: _deploySwarmpromStack_
# Description: Deploys the Swarmprom stack using the provided configuration file.
_deploySwarmpromStack_() {
    local stack_file="$1"
    local stack_name="$2"
    dryrun "Deploying Swarmprom Stack" 
    if [ ! -f "$stack_file" ]; then
        error "Swarmprom stack file not found: $stack_file"
        exit 1
    fi

    info "Deploying Swarmprom stack '$stack_name' using file: $stack_file"
    docker stack deploy -c "$stack_file" "$stack_name" --prune --with-registry-auth -d

    if [ $? -eq 0 ]; then
        success "Swarmprom stack '$stack_name' deployed successfully!"
        success "Grafana Dashboard: https://grafana.$DOMAIN"
        success "Grafana Username: $SWARMPROM_ADMIN_USER"
        success "Grafana Password: $SWARMPROM_ADMIN_PASSWORD"

        success "Alert Manager Dashboard: https://alertmanager.$DOMAIN"
        success "Alert Manager Username: $SWARMPROM_ADMIN_USER"
        success "Alert Manager Password: $SWARMPROM_ADMIN_PASSWORD"

        success "Cloudflare Dashboard: https://unsee.$DOMAIN"
        success "Cloudflare Username: $SWARMPROM_ADMIN_USER"
        success "Cloudflare Password: $SWARMPROM_ADMIN_PASSWORD"


        success "Prometheus Dashboard: https://prometheus.$DOMAIN"
        success "Prometheus Username: $SWARMPROM_ADMIN_USER"
        success "Prometheus Password: $SWARMPROM_ADMIN_PASSWORD"

    else
        error "Failed to deploy Swarmprom stack '$stack_name'. Please check the Docker logs."
        exit 1
    fi
}

_centerOutputBlue_ "Swarmprom Configuration" "-"
_exportEnvironmentVariables_ "./infra/swarmprom/.env"
_checkSwarmPromEnvironmentVariables_
_exportSwarmpromHashPassword_
_deploySwarmpromStack_ "./infra/swarmprom/swarmprom.yml" "swarmprom"