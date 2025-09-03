#!/bin/bash

# Manual VSIX packaging script for Node.js 18 compatibility
# This script creates a VSIX package manually without using vsce

echo "Creating manual VSIX package..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Create extension directory structure
mkdir -p "$TEMP_DIR/extension"

# Copy extension files to extension subdirectory
cp -r out/* "$TEMP_DIR/extension/"
cp package.json "$TEMP_DIR/extension/"
cp README.md "$TEMP_DIR/extension/"

# Create manifest
cat > "$TEMP_DIR/extension.vsixmanifest" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Id="promptious-optimizer.promptious" Version="1.0.0" Language="en-US" Publisher="promptious" />
    <DisplayName>Promptious Prompt Optimizer</DisplayName>
    <Description>AI-powered prompt optimization using advanced prompt engineering techniques</Description>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" Version="1.74.0" />
  </Installation>
  <Dependencies>
    <Dependency Id="Microsoft.VisualStudio.Code" DisplayName="Visual Studio Code" Version="1.74.0" />
  </Dependencies>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
  </Assets>
</PackageManifest>
EOF

# Create VSIX file (simple zip with .vsix extension)
cd "$TEMP_DIR"
zip -r promptious-optimizer-1.0.0.vsix . -x "*.vsix"

# Move to project directory
mv promptious-optimizer-1.0.0.vsix /home/sumitnemade/python_projects/cursor_project/promtious/cursor-extension/

# Cleanup
cd /home/sumitnemade/python_projects/cursor_project/promtious/cursor-extension/
rm -rf "$TEMP_DIR"

echo "Manual VSIX package created: promptious-optimizer-1.0.0.vsix"
echo "You can now install this extension in VS Code using:"
echo "code --install-extension promptious-optimizer-1.0.0.vsix"
