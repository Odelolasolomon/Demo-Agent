#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting Build Process..."

# Upgrade pip
pip install --upgrade pip

echo "Installing dependencies..."
# Install requirements (No PyTorch!)
pip install -r requirements.txt

echo "Build Complete!"
