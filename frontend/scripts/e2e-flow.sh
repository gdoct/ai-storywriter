#!/bin/bash
# This script runs the Playwright tests in a specific order to test the complete user flow:
# * signup
# * login/upgrade/logout
# * create scenario
# * generate story
# * publish
# * marketplace interactions (like)
# * cleanup (delete account)

echo "Running e2e test.."
set -e

# Ensure we are in the frontend directory
# If in "scripts" go one up
if [ "$(basename "$PWD")" == "scripts" ]; then
  cd ..
fi

# Ensure we are in the frontend directory
if [ "$(basename "$PWD")" \!= "frontend" ]; then
  echo "Please run this script from the frontend directory."
  exit 1
fi

run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file" .spec.ts)
  printf " * %s ... " "$test_name"
  
  # Run Playwright test and capture output (chromium only)
  output=$(npx playwright test "$test_file" --project=chromium 2>&1)
  exit_code=$?

  # Try to extract timing information from Playwright output
  duration=$(echo "$output"  < /dev/null |  grep -o -E '[0-9]+(\.[0-9]+)?s' | tail -1)
  if [ -z "$duration" ]; then
    duration="(timing unknown)"
  else
    duration="($duration)"
  fi

  if [ $exit_code -eq 0 ]; then
    printf "%s \e[32mPASS\e[0m\n" "$duration"
  else
    printf "%s \e[31mFAIL\e[0m\n" "$duration"
    echo
    echo "----------------- FAILED: $test_file -----------------"
    echo "$output"
    echo "------------------------------------------------------"
    return 1
  fi
}

echo "Starting E2E user flow tests..."
echo

# Run tests in the specified order
run_test "playwright-tests/10-signup.spec.ts"
run_test "playwright-tests/15-login-upgrade-logout.spec.ts" 
run_test "playwright-tests/20-create-scenario.spec.ts"
run_test "playwright-tests/30-generate-story.spec.ts"
run_test "playwright-tests/40-publish.spec.ts"
run_test "playwright-tests/50-marketplace.spec.ts"
run_test "playwright-tests/99-cleanup.spec.ts"

echo
echo "All E2E flow tests completed successfully."
