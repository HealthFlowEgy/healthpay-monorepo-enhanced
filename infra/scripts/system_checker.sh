#!/bin/bash

# system_checker.sh
# Description: A shell script to gather system information, check OS compatibility, and validate environment variables.
# Author: [Ahmed Nabil]
# Date: [Date]
# Version: 1.0

# Function: _displayOSInfo_
# Description: Displays detailed information about the operating system.
_displayOSInfo_() {
    if _checkOSCompatibility_; then
        _centerOutputBlue_ "Operating System Information" "-"
        _columns_ "OS Name" "$(uname -s)"
        _columns_ "OS Distribution" "$(_detectLinuxDistro_)"
        _columns_ "OS Version" "$(lsb_release -d | awk -F"\t" '{print $2}')"
        _columns_ "Kernel Version" "$(uname -r)"
        _columns_ "Architecture" "$(uname -m)"
        _columns_ "Hostname" "$(hostname)"
        _columns_ "Uptime" "$(uptime -p)"
    else
        warning "System Requirements: [OS: Linux] [Distro: Ubuntu]"
        warning "This infrastructure supports only Linux Ubuntu."
        _safeExit_
    fi
    echo
}

# Function: _checkOSCompatibility_
# Description: Checks if the operating system is Linux and the distribution is Ubuntu.
# Returns: 0 (true) if the OS and distro match requirements; 1 (false) otherwise.
_checkOSCompatibility_() {
    if [ "$(_detectOS_)" == "linux" ] && [ "$(_detectLinuxDistro_)" == "ubuntu" ]; then
        return 0
    else
        return 1
    fi
}

# Function: _displayCPUInfo_
# Description: Displays detailed information about the CPU.
_displayCPUInfo_() {
    _centerOutputBlue_ "CPU Information" "-"
    _columns_ "CPU Model" "$(grep -m 1 'model name' /proc/cpuinfo | awk -F': ' '{print $2}')"
    _columns_ "CPU Cores" "$(grep -m 1 'cpu cores' /proc/cpuinfo | awk -F': ' '{print $2}')"
    _columns_ "CPU Usage" "$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
    _columns_ "Processes" "$(ps aux | wc -l)"
    _columns_ "Threads" "$(ps -eLf | wc -l)"
    _columns_ "Load Average" "$(uptime | awk -F'load average: ' '{print $2}')"
    _columns_ "Architecture" "$(uname -m)"
    echo
}

# Function: _displayMemoryInfo_
# Description: Displays detailed information about the memory.
_displayMemoryInfo_() {
    _centerOutputBlue_ "Memory Information" "-"
    _columns_ "Memory Total" "$(free -h | awk '/^Mem:/ {print $2}')"
    _columns_ "Memory Usage" "$(free -h | awk '/^Mem:/ {print $3}')"
    _columns_ "Swap Memory" "$(free -h | awk '/^Swap:/ {print $3}')"
    _columns_ "Swap Usage" "$(free -h | awk '/^Swap:/ {print $3}')"
    _columns_ "Memory Free" "$(free -h | awk '/^Mem:/ {print $4}')"
    echo
}

# Function: _displayDiskInfo_
# Description: Displays detailed information about the disk.
_displayDiskInfo_() {
    _centerOutputBlue_ "Disk Information" "-"
    _columns_ "Disk Total" "$(df -h --total | grep 'total' | awk '{print $2}')"
    _columns_ "Disk Used" "$(df -h --total | grep 'total' | awk '{print $3}')"
    _columns_ "Disk Available" "$(df -h --total | grep 'total' | awk '{print $4}')"
    echo
}

# Function: _displayNetworkInfo_
# Description: Displays detailed information about the network.
_displayNetworkInfo_() {
    _centerOutputBlue_ "Network Information" "-"
    _columns_ "Default Gateway" "$(ip route | grep default | awk '{print $3}')"
    _columns_ "DNS Servers" "$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')"
    _columns_ "IP Address" "$(curl -s ifconfig.me)"
    echo
}

# Function: _exportEnvironmentVariables_
# Description: Loads environment variables from the .env file.
# _exportEnvironmentVariables_() {
#     _centerOutputBlue_ "Exporting Environment Vars" "-"
#     ENV_FILE="$(_findBaseDir_)/../../.env"
#     # Check if the .env file exists
#     if [[ ! -f $ENV_FILE ]]; then
#         error ".env file not found!"
#         _safeExit_
#     fi
#     # Load environment variables from the file
#     while IFS='=' read -r key value; do
#         # Skip lines that are empty or start with a #
#         if [[ -z "$key" || "$key" == \#* ]]; then
#             continue
#         fi

#         # Trim whitespace and export the variable
#         key=$(echo "$key" | xargs)
#         value=$(echo "$value" | xargs)
#         _columns_ "$key" "$value"
#         export "$key"="$value"
#     done <"$ENV_FILE"
# }


_displayOSInfo_
_displayCPUInfo_
_displayMemoryInfo_
_displayDiskInfo_
_displayNetworkInfo_
# _exportEnvironmentVariables_
