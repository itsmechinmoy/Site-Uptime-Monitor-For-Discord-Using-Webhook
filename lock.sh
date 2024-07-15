#!/bin/bash

LOCK_FILE=".workflow.lock"

if [ -f "$LOCK_FILE" ]; then
  echo "Another instance is already running."
  exit 1
else
  echo "Creating lock file."
  touch "$LOCK_FILE"
fi
