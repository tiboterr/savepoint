#!/bin/bash

# Simple verification script for Mission Control ARPAGONA

echo "=== Mission Control ARPAGONA Verification ==="
echo ""

# Check if required files exist
echo "Checking required files..."
REQUIRED_FILES=(
  "src/app/page.tsx"
  "src/components/mission-control-shell.tsx"
  "src/components/mission-overview.tsx"
  "src/lib/mission-control.ts"
)

ALL_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ $file missing"
    ALL_EXIST=false
  fi
done

echo ""

# Check if build directory exists
if [ -d ".next/build" ]; then
  echo "✓ Build directory exists"
else
  echo "✗ Build directory missing"
  ALL_EXIST=false
fi

echo ""

if [ "$ALL_EXIST" = true ]; then
  echo "✓ All required files present"
  echo ""
  echo "Mission Control ARPAGONA is ready to use!"
  echo "Run 'pnpm dev' to start the development server"
else
  echo "✗ Some files are missing"
  echo "Please check the installation"
fi
