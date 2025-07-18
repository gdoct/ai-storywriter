#!/bin/bash
# this script will execute npm test:playwright:ui in the frontend folder
cd "$(dirname "$0")/frontend" || exit 1
if ! command -v npm &> /dev/null; then
    echo "npm could not be found. Please install Node.js and npm."
    exit 1
fi
npx playwright test --workers=1 --project=chromium --global-timeout=0 $(find playwright-tests -name "*.spec.ts" | sort)
