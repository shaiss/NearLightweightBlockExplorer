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

# Function to kill process on a specific port
kill_port() {
  local port=$1
  log_info "Checking port $port..."
  
  # Try using fuser (more reliable than lsof)
  if command -v fuser &> /dev/null; then
    if fuser -s $port/tcp 2>/dev/null; then
      log_warning "Found process on port $port"
      fuser -k $port/tcp 2>/dev/null || true
      sleep 1
      # Verify it's actually dead
      if fuser -s $port/tcp 2>/dev/null; then
        log_warning "Force killing process on port $port"
        fuser -k -9 $port/tcp 2>/dev/null || true
        sleep 1
      fi
    else
      log_success "Port $port is free"
    fi
  else
    # Fallback to lsof if fuser not available (macOS)
    local pid=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
      log_warning "Found process $pid on port $port"
      kill -15 $pid 2>/dev/null || true
      
      # Give it time to shut down gracefully
      local counter=0
      while [ $counter -lt $KILL_TIMEOUT ]; do
        if ! kill -0 $pid 2>/dev/null; then
          log_success "Process $pid terminated gracefully"
          return 0
        fi
        sleep 1
        ((counter++))
      done
      
      # Force kill if still running
      log_warning "Force killing process $pid"
      kill -9 $pid 2>/dev/null || true
      sleep 1
    else
      log_success "Port $port is free"
    fi
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
kill_port $FRONTEND_PORT
kill_port $PROXY_PORT

echo ""
log_success "Cleanup complete!"
echo ""

log_info "Starting development server..."
echo ""

# Export environment variables for child processes
export FRONTEND_PORT
export PROXY_PORT

# Use concurrently to run both servers
# Note: concurrently will handle the process management and graceful shutdown
npm run dev:full
