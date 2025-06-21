#!/bin/bash
# This script runs the puppeteer tests in a specific order in order to 
# * create a user
# * loop 5 times
#   * generate a scenario
#   * generate a story
#   * publish the story
# * delete the user

set -e
# ensure we are in the frontend directory
# if in "scripts" go one up
if [ "$(basename "$PWD")" == "scripts" ]; then
  cd ..
fi
# ensure we are in the frontend directory
if [ "$(basename "$PWD")" != "frontend" ]; then
  echo "Please run this script from the frontend directory."
  exit 1
fi

run_test() {
  local test_file=$1
  printf " * %s ... " "$test_file"
  
  # we remove --detectOpenHandles to make the output cleaner and capture all output
  output=$(npx jest --config=jest-puppeteer.config.js --runInBand "$test_file" 2>&1)
  exit_code=$?

  # Try to find the summary line to extract duration
  summary_line=$(echo "$output" | grep -E "(PASS|FAIL) .*${test_file}")
  duration=$(echo "$summary_line" | grep -o -E '\([0-9.]+ s\)')

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


# we run puppeteer through jest with ```jest --config=jest-puppeteer.config.js --runInBand```
run_test '__tests__/00-signup.puppeteer.test.ts'

for i in {1..5}
do
  echo "Running iteration $i"
  # run the generate test
  run_test "__tests__/10-generate.puppeteer.test.ts"
  # run the publish test
  run_test "__tests__/20-publish.puppeteer.test.ts"
done
# finally run the cleanup test
run_test '__tests__/99-cleanup.puppeteer.test.ts'

echo "All tests completed successfully."
