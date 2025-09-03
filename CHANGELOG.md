# Changelog

All notable changes to the Promptious Prompt Optimizer extension will be documented in this file.

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
