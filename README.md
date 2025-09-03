# Promptious Optimizer

A VS Code extension that helps optimize prompts using AI techniques.

## Features

- **Prompt Optimization**: Improve prompts using techniques like zero-shot, few-shot, and chain-of-thought
- **History Tracking**: Keep track of your optimization attempts
- **Configuration**: Set your OpenAI API key and backend URL
- **Status Bar Integration**: Quick access via VS Code status bar

## Why This Helps

- **Better AI Results**: Well-structured prompts often produce better AI responses
- **Learning**: See how different techniques improve your prompts
- **Efficiency**: Save time by reusing successful prompt patterns
- **Organization**: Keep track of what works and what doesn't

## Architecture

```
User Input (VS Code)
       ↓
   Extension
       ↓
  Promptious Backend
       ↓
   OpenAI API
       ↓
  Optimized Prompt
       ↓
   User (VS Code)
```

## How to Use

### Installation

1. Download `promptious-optimizer-1.0.0.vsix`
2. Open VS Code → Extensions → "..." → "Install from VSIX..."
3. Select the downloaded file

### Configuration

1. Open VS Code settings (Ctrl+,)
2. Search for "promptious"
3. Set your OpenAI API key

### Usage

1. **Select text** in any editor
2. **Right-click** → "Optimize Selected Text"
3. **Review** the optimized prompt in the new document

### Commands

- `Ctrl+Shift+P` → "Promptious: Optimize Prompt"
- `Ctrl+Shift+P` → "Promptious: Show History"
- `Ctrl+Shift+P` → "Promptious: Configure Settings"

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Test
npm test

# Package
npm run package-manual
```

## Requirements

- VS Code 1.74.0+
- OpenAI API key

## Support

- [GitHub Issues](https://github.com/sumitnemade/promptious/issues)
- [Repository](https://github.com/sumitnemade/promptious)
- Contact: nemadesumit@gmail.com

## License

MIT License
