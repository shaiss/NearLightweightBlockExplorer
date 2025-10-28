#!/bin/bash

# Port Configuration Validation Script
# This script checks that all port configurations are aligned and working correctly

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Get configuration values
FRONTEND_PORT=${FRONTEND_PORT:-3000}
PROXY_PORT=${PROXY_PORT:-3001}

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Port Configuration Validation${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if ports are in valid range
log_info "Validating port numbers..."

if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || [ "$FRONTEND_PORT" -lt 1024 ] || [ "$FRONTEND_PORT" -gt 65535 ]; then
  log_error "FRONTEND_PORT=$FRONTEND_PORT is invalid (must be 1024-65535)"
  exit 1
fi

if ! [[ "$PROXY_PORT" =~ ^[0-9]+$ ]] || [ "$PROXY_PORT" -lt 1024 ] || [ "$PROXY_PORT" -gt 65535 ]; then
  log_error "PROXY_PORT=$PROXY_PORT is invalid (must be 1024-65535)"
  exit 1
fi

log_success "Port numbers are valid"
echo ""

# Check if ports are different
log_info "Checking port uniqueness..."

if [ "$FRONTEND_PORT" -eq "$PROXY_PORT" ]; then
  log_error "FRONTEND_PORT ($FRONTEND_PORT) and PROXY_PORT ($PROXY_PORT) are the same!"
  exit 1
fi

log_success "Ports are unique"
echo ""

# Check port availability
log_info "Checking port availability..."

# Check FRONTEND_PORT
if lsof -i :$FRONTEND_PORT &>/dev/null; then
  log_warning "FRONTEND_PORT $FRONTEND_PORT is already in use"
  lsof -i :$FRONTEND_PORT | tail -n +2 || true
else
  log_success "FRONTEND_PORT $FRONTEND_PORT is available"
fi

# Check PROXY_PORT
if lsof -i :$PROXY_PORT &>/dev/null; then
  log_warning "PROXY_PORT $PROXY_PORT is already in use"
  lsof -i :$PROXY_PORT | tail -n +2 || true
else
  log_success "PROXY_PORT $PROXY_PORT is available"
fi

echo ""

# Verify configuration files
log_info "Checking configuration files..."

# Check vite.config.ts for port references
if grep -q "FRONTEND_PORT\|PROXY_PORT" vite.config.ts 2>/dev/null; then
  log_success "vite.config.ts uses environment variables"
else
  log_error "vite.config.ts doesn't use environment variables"
  exit 1
fi

# Check proxy-server.js for port references
if grep -q "PROXY_PORT" proxy-server.js 2>/dev/null; then
  log_success "proxy-server.js uses PROXY_PORT environment variable"
else
  log_error "proxy-server.js doesn't use PROXY_PORT environment variable"
  exit 1
fi

# Check lib/rpcProxy.ts for port references
if grep -q "VITE_PROXY_PORT" lib/rpcProxy.ts 2>/dev/null; then
  log_success "lib/rpcProxy.ts uses VITE_PROXY_PORT environment variable"
else
  log_error "lib/rpcProxy.ts doesn't use VITE_PROXY_PORT environment variable"
  exit 1
fi

echo ""
log_success "All configuration files are properly set up!"
echo ""

# Display current configuration
echo -e "${BLUE}Current Configuration:${NC}"
echo "  FRONTEND_PORT:  $FRONTEND_PORT"
echo "  PROXY_PORT:     $PROXY_PORT"
echo ""

# Show usage examples
echo -e "${BLUE}Usage Examples:${NC}"
echo "  Default ports:"
echo "    ./start-dev.sh"
echo ""
echo "  Custom ports:"
echo "    FRONTEND_PORT=4000 PROXY_PORT=4001 ./start-dev.sh"
echo ""

log_success "Validation complete!"
echo ""
