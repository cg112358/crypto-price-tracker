#!/usr/bin/env bash

if [ ! -d ".venv" ]; then
  echo "[ERROR] .venv not found. Run: python -m venv .venv"
  return 1 2>/dev/null || exit 1
fi

if [ -f ".venv/bin/activate" ]; then
  # macOS / Linux
  source ./.venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
  # Windows (Git Bash)
  source ./.venv/Scripts/activate
else
  echo "[ERROR] Could not find venv activate script"
  return 1 2>/dev/null || exit 1
fi

echo "[OK] Virtual environment activated"

