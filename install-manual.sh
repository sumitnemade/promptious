#!/bin/bash

# Manual Installation Script for Promptious Optimizer Extension
# This script installs the extension directly without packaging

set -e

echo "🚀 Promptious Optimizer Extension - Manual Installation"
echo "====================================================="

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code command line tools not found."
    echo "   Please install VS Code and add it to your PATH."
    echo "   Or run: Install 'code' command in PATH from VS Code"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
EXTENSION_DIR="$SCRIPT_DIR"

echo "📁 Extension directory: $EXTENSION_DIR"

# Change to extension directory
cd "$EXTENSION_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

# Create extension directory in VS Code extensions folder
VSCODE_EXTENSIONS_DIR="$HOME/.vscode/extensions"
EXTENSION_NAME="promptious-optimizer-1.0.0"
TARGET_DIR="$VSCODE_EXTENSIONS_DIR/$EXTENSION_NAME"

echo "📂 Creating extension directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Copy extension files
echo "📋 Copying extension files..."
cp -r out "$TARGET_DIR/"
cp package.json "$TARGET_DIR/"
cp README.md "$TARGET_DIR/"
cp DEBUGGING.md "$TARGET_DIR/"

# Create a simple installation marker
echo "✅ Extension installed successfully!"
echo "🎉 You can now use the Promptious Optimizer in VS Code!"
echo ""
echo "Next steps:"
echo "1. Restart VS Code"
echo "2. Open VS Code settings (Ctrl+,)"
echo "3. Search for 'promptious'"
echo "4. Set your OpenAI API key"
echo "5. Configure the backend URL if needed"
echo "6. Start optimizing prompts!"
echo ""
echo "Usage:"
echo "- Select text and right-click → 'Optimize Selected Text'"
echo "- Or use Ctrl+Shift+P → 'Optimize Prompt'"
echo "- Or click the lightbulb icon in the status bar"
echo ""
echo "Happy optimizing! 🚀"
