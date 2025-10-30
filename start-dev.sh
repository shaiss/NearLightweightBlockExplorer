#!/bin/bash

set -e

# Configuration
FRONTEND_PORT=${FRONTEND_PORT:-3000}
PROXY_PORT=${PROXY_PORT:-3001}
KILL_TIMEOUT=5
STARTUP_TIMEOUT=10

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
  echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
  echo -e "${RED}✗${NC}  $1"
}

# Function to check if port is in use
is_port_in_use() {
  local port=$1
  # Use lsof on macOS, it's more reliable
  lsof -ti:$port >/dev/null 2>&1
}

# Function to kill process on a specific port
kill_port() {
  local port=$1
  log_info "Checking port $port..."
  
  # Check if port is in use
  if ! is_port_in_use $port; then
    log_success "Port $port is free"
    return 0
  fi
  
  # Get ALL PIDs using this port (there can be multiple)
  # Convert newlines to spaces for proper handling
  local pids=$(lsof -ti:$port 2>/dev/null | tr '\n' ' ')
  if [ -z "$pids" ]; then
    log_success "Port $port is free"
    return 0
  fi
  
  # Trim trailing space
  pids=$(echo $pids | xargs)
  
  log_warning "Found process(es) on port $port: $pids"
  
  # Try graceful shutdown first (SIGTERM) - kill all PIDs at once
  kill -15 $pids 2>/dev/null || true
  
  # Wait for processes to terminate gracefully
  local counter=0
  while [ $counter -lt $KILL_TIMEOUT ]; do
    if ! is_port_in_use $port; then
      log_success "All processes terminated gracefully"
      sleep 1  # Give OS time to release port
      return 0
    fi
    sleep 1
    ((counter++))
  done
  
  # Force kill any remaining processes (SIGKILL)
  local remaining_pids=$(lsof -ti:$port 2>/dev/null | tr '\n' ' ' | xargs)
  if [ -n "$remaining_pids" ]; then
    log_warning "Force killing remaining process(es): $remaining_pids"
    kill -9 $remaining_pids 2>/dev/null || true
    sleep 2  # Give OS more time to release port after force kill
  fi
  
  # Final verification
  if is_port_in_use $port; then
    local final_pids=$(lsof -ti:$port 2>/dev/null | tr '\n' ' ' | xargs)
    log_error "Port $port is still in use by: $final_pids"
    log_error "You may need to manually kill these processes"
    return 1
  else
    log_success "Port $port is free"
    return 0
  fi
}

# Main script
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}   NEAR Explorer Development Server Start${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

log_info "Configuration:"
log_info "  Frontend port:  $FRONTEND_PORT"
log_info "  Proxy port:     $PROXY_PORT"
echo ""

log_info "Cleaning up existing processes..."
if ! kill_port $FRONTEND_PORT; then
  log_error "Failed to free port $FRONTEND_PORT"
  exit 1
fi
if ! kill_port $PROXY_PORT; then
  log_error "Failed to free port $PROXY_PORT"
  exit 1
fi

echo ""
log_success "Cleanup complete!"

# Give OS time to fully release ports
log_info "Waiting for ports to be fully released..."
sleep 2

echo ""
log_info "Starting development server..."
echo ""

# Export environment variables for child processes
export FRONTEND_PORT
export PROXY_PORT

# Use concurrently to run both servers
# Note: concurrently will handle the process management and graceful shutdown
npm run dev:full
