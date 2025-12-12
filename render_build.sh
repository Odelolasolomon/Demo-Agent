#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting Build Process..."

# Upgrade pip
pip install --upgrade pip

echo "Installing CPU-only PyTorch (to save space)..."
# Install CPU-only torch explicitly before requirements
# This prevents downloading the massive 700MB+ GPU version
pip install torch --index-url https://download.pytorch.org/whl/cpu

echo "Installing remaining dependencies..."
# Install other requirements
pip install -r requirements.txt

echo "Build Complete!"
