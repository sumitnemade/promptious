# Changelog

All notable changes to the Promptious Prompt Optimizer extension will be documented in this file.

## [1.0.7] - 2025-01-03

### 🚀 Major Features

- **Status Bar Integration**: Added persistent lightbulb icon in status bar for instant access
- **Model Selection**: Choose from 5 OpenAI models (GPT-3.5-turbo, GPT-4, GPT-4-turbo-preview, GPT-4o, GPT-4o-mini)
- **Built-in Fetch API**: Replaced axios with native fetch for better compatibility and smaller package size
- **Programmatic Settings Access**: Added "Open Settings" command and smart error dialogs

### ✨ New Features

- **Status Bar Lightbulb**: Always-visible lightbulb icon in status bar for quick access
- **Model Dropdown**: Select preferred OpenAI model with descriptions
- **Smart Error Handling**: API key errors now show "Open Settings" button
- **Unrestricted Code Actions**: Lightbulb appears for any text selection (no length limits)
- **Multiple Access Methods**: Status bar, command palette, context menu, and code actions

### 🔧 Improvements

- **Simplified Dependencies**: Removed axios dependency, using built-in fetch API
- **Better Error Messages**: More descriptive error handling with actionable buttons
- **Enhanced Progress Tracking**: Shows selected model in progress messages
- **Improved Discoverability**: Multiple ways to access optimization features

### 🐛 Bug Fixes

- **Fixed Extension Loading**: Resolved command registration issues
- **Fixed Activation Events**: Proper extension activation on startup
- **Fixed TypeScript Errors**: Added proper type annotations for fetch API

### 📋 Settings Added

- `promptious.model`: Choose OpenAI model (default: gpt-3.5-turbo)
- `promptious.apiKey`: OpenAI API key (required)
- `promptious.autoCopy`: Auto-copy optimized prompts (default: true)
- `promptious.showNotifications`: Show success notifications (default: true)

## [1.0.6] - 2025-01-03

### 🔧 Command Registration & Status Bar Fix

- **Fixed Command Not Found Error**: Commands now register properly and are available immediately
- **Fixed Status Bar Visibility**: Lightbulb now appears immediately when VS Code starts
- **Dual Activation Events**: Uses both 'onStartupFinished' and 'onCommand' for best reliability
- **Added Menu Integration**: Commands now appear in Command Palette and context menu
- **Enhanced Discoverability**: Users can find commands through multiple entry points

### 🚀 User Experience Improvements

- **Immediate Status Bar**: Lightbulb appears on VS Code startup (not just after commands)
- **Immediate Command Availability**: Commands work right after installation
- **Context Menu Integration**: Right-click on selected text to optimize
- **Command Palette Access**: Find commands easily through Ctrl+Shift+P
- **Status Bar Integration**: Click status bar lightbulb for quick access

### 🛠️ Technical Improvements

- **Hybrid Activation**: Extension activates on startup AND when commands are used
- **Better Error Handling**: Improved error messages and debugging
- **Menu Configuration**: Added proper menu entries for all commands
- **Optimized Timing**: 200ms delay for status bar to ensure VS Code readiness

## [1.0.5] - 2025-01-03

### 🔧 Status Bar Visibility Fix

- **Fixed Status Bar Display Issue**: Status bar lightbulb now appears immediately when VS Code starts
- **Improved Activation Timing**: Changed from 'onCommand' to 'onStartupFinished' for better user experience
- **Faster Appearance**: Reduced delay from 500ms to 100ms for quicker status bar item display
- **Better User Experience**: Users can now see the extension is active without running commands first

### 🚀 User Experience Improvements

- **Immediate Visibility**: Extension status bar item is visible from VS Code startup
- **No Command Dependency**: Status bar appears without needing to run any commands
- **Consistent Presence**: Lightbulb icon always visible when extension is active

## [1.0.4] - 2025-01-03

### 🔧 Status Bar & Lightbulb Fixes

- **Fixed Status Bar Visibility**: Lightbulb icon now appears reliably in VS Code status bar
- **Improved Activation Timing**: Changed to 'onStartupFinished' for better VS Code integration
- **Enhanced Priority**: Increased status bar item priority to 1000 for better visibility
- **Timing Fix**: Added 100ms delay to ensure VS Code is ready before showing status bar item
- **Better Debugging**: Enhanced console logs for troubleshooting status bar issues

### 🚀 Performance Improvements

- **Optimized Activation**: Extension now activates at the right time in VS Code lifecycle
- **Reliable Loading**: More consistent extension activation and status bar display
- **Debug Information**: Better logging for development and troubleshooting

## [1.0.3] - 2025-01-03

### 🚀 Major Features

- **Complete Technique Support**: Implemented all 17 prompt engineering techniques from [promptingguide.ai](https://www.promptingguide.ai/techniques)
- **Smart Technique Selection**: AI automatically selects optimal techniques based on prompt analysis
- **Unrestricted Access**: Extension now works everywhere - no editor or selection required

### ✨ New Features

- **Meaningful Settings**: User-friendly configuration with emoji icons and clear descriptions
- **Optimization Levels**: Smart/Conservative/Aggressive optimization modes
- **Model Selection**: Choose between GPT-3.5-turbo and GPT-4
- **Auto-copy Toggle**: Control whether optimized prompts are automatically copied
- **Notification Control**: Toggle success notifications on/off
- **Debug Mode**: Enable detailed logging for troubleshooting

### 🔧 Improvements

- **Simplified UX**: Removed complex dialogs and fluff - just better prompts
- **Invisible Operation**: Extension works seamlessly without interrupting workflow
- **Better Error Handling**: Improved OpenAI API error messages and fallbacks
- **Cleaner Code**: Removed unnecessary complexity and over-engineering

### 🐛 Bug Fixes

- **Fixed Double Tab Issue**: Settings command no longer creates extra tabs
- **Fixed Clipboard Issue**: Only optimized prompt text is copied, not JSON
- **Fixed Lightbulb Icon**: Now appears for all text selections
- **Fixed JSON Parsing**: Robust handling of AI responses

### 🎯 Technique Support

- Zero-shot Prompting
- Few-shot Prompting
- Chain-of-Thought Prompting
- Meta Prompting
- Self-Consistency
- Generate Knowledge Prompting
- Prompt Chaining
- Tree of Thoughts
- Retrieval Augmented Generation
- Automatic Reasoning and Tool-use
- Active-Prompt
- Directional Stimulus Prompting
- Program-Aided Language Models
- ReAct
- Reflexion
- Multimodal CoT
- Graph Prompting

### 📋 Settings Added

- `promptious.optimizationLevel`: Smart/Conservative/Aggressive
- `promptious.maxTechniques`: Maximum techniques to apply (1-8)
- `promptious.autoCopy`: Auto-copy optimized prompts
- `promptious.showNotifications`: Toggle notifications
- `promptious.debugMode`: Enable debug logging
- `promptious.preferredModel`: Choose AI model

## [1.0.2] - 2025-01-03

### 🔧 Improvements

- Enhanced dialog formatting for better user experience
- Simplified text organization and readability
- Removed external references for self-contained operation

## [1.0.1] - 2025-01-03

### 🎨 Features

- Added custom logo and branding
- Improved CI/CD pipeline with automatic marketplace publishing
- Enhanced error handling and user feedback

## [1.0.0] - 2025-01-03

### 🎉 Initial Release

- Basic prompt optimization functionality
- OpenAI API integration
- VS Code extension marketplace publication
