#!/bin/bash

LOCK_FILE=".workflow.lock"

if [ -f "$LOCK_FILE" ]; then
  echo "Removing lock file."
  rm "$LOCK_FILE"
else
  echo "Lock file does not exist."
fi
