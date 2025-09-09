#!/bin/bash
error_exit() {
  echo "Error occurred at line $1. Exiting."
  exit 1
}

find_and_remove_dir() {
    local dirname=$1
    echo "Removing all '$dirname' folders..."
    find . -type d -name "$dirname" -exec rm -rf {} +
}

# remove all folders named
# node_modules, __pycache__, build, dist
find_and_remove_dir "node_modules"
find_and_remove_dir "__pycache__"
find_and_remove_dir "build"
find_and_remove_dir "dist"
rm -rf venv
