#!/bin/bash

# Promptious Optimizer Extension Installer
# This script installs the VS Code extension for prompt optimization

set -e

echo "🚀 Promptious Optimizer Extension Installer"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

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

# Package the extension
echo "📦 Packaging extension..."
npm run package

# Find the generated .vsix file
VSIX_FILE=$(find . -name "*.vsix" -type f | head -n 1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ Failed to generate .vsix file"
    exit 1
fi

echo "📦 Found package: $VSIX_FILE"

# Install the extension
echo "🔌 Installing extension in VS Code..."
code --install-extension "$VSIX_FILE"

echo ""
echo "✅ Extension installed successfully!"
echo "🎉 You can now use the Promptious Optimizer in VS Code!"
echo ""
echo "Next steps:"
echo "1. Open VS Code settings (Ctrl+,)"
echo "2. Search for 'promptious'"
echo "3. Set your OpenAI API key"
echo "4. Configure the backend URL if needed"
echo "5. Start optimizing prompts!"
echo ""
echo "Usage:"
echo "- Select text and right-click → 'Optimize Selected Text'"
echo "- Or use Ctrl+Shift+P → 'Optimize Prompt'"
echo "- Or click the lightbulb icon in the status bar"
echo ""
echo "Happy optimizing! 🚀"
