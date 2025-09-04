# Promptious Optimizer

A VS Code extension that helps optimize prompts using AI techniques and advanced prompt engineering.

## Features

- **Smart AI Optimization**: Intelligently selects and applies advanced techniques based on prompt type and complexity
- **Multiple Access Methods**: Status bar lightbulb, command palette, context menu, and code actions
- **Model Selection**: Choose from 5 OpenAI models (GPT-3.5-turbo, GPT-4, GPT-4o, etc.)
- **Auto-copy**: Optimized prompts are automatically copied to clipboard
- **Smart Error Handling**: Helpful error messages with direct links to settings
- **Unrestricted Code Actions**: Lightbulb appears for any text selection
- **Built-in Fetch API**: No external dependencies, better compatibility

## Why This Helps

- **Better AI Results**: Well-structured prompts often produce better AI responses
- **Learning**: See how different techniques improve your prompts
- **Efficiency**: Save time by reusing successful prompt patterns
- **Organization**: Keep track of what works and what doesn't

## Smart Technique Selection

The extension intelligently analyzes your prompt and applies the most effective techniques.

### **Prompt Type Detection:**

- **Coding**: Uses Few-shot + Zero-shot for code generation
- **Explanation**: Uses Meta Prompting + Chain-of-Thought for clarity
- **Creative**: Uses Few-shot + Role Definition for better output
- **Analysis**: Uses Self-Consistency + Meta Prompting for accuracy
- **Transformation**: Uses Zero-shot + Role Definition for precision

### **Complexity-Based Selection:**

- **Simple**: Zero-shot + Role Definition
- **Medium**: Adds Chain-of-Thought for structure
- **Complex**: Adds Self-Consistency for reliability

## Architecture

```
Multiple Access Points:
- Status Bar Lightbulb (💡)
- Command Palette (Ctrl+Shift+P)
- Context Menu (Right-click)
- Code Actions (Lightbulb on selection)
       ↓
   Extension (Built-in Fetch API)
       ↓
   OpenAI API (Selected Model)
       ↓
   Smart AI Prompt Engineering:
   - Intelligent Technique Selection based on prompt type
   - Zero-shot Prompting for direct instructions
   - Few-shot Learning for coding/creative tasks
   - Chain-of-Thought for complex reasoning
   - Meta Prompting for analysis tasks
   - Self-Consistency for critical thinking
   - Role Definition for context establishment
       ↓
  Optimized Prompt
       ↓
   Clipboard (Auto-copy) + Notification
```

## How to Use

### Installation

1. Download `promptious-optimizer-1.0.7.vsix`
2. Open VS Code → Extensions → "..." → "Install from VSIX..."
3. Select the downloaded file

### Configuration

1. Open VS Code settings (Ctrl+,)
2. Search for "promptious"
3. Configure the following settings:
   - **API Key**: Set your OpenAI API key (required)
   - **Model**: Choose OpenAI model (default: gpt-3.5-turbo)
   - **Auto Copy**: Auto-copy optimized prompts (default: true)
   - **Show Notifications**: Show success notifications (default: true)

### Usage

#### Method 1: Status Bar Lightbulb (Recommended)

1. **Click** the lightbulb icon (💡) in the status bar
2. **Enter** your prompt in the input box
3. **Wait** for optimization to complete
4. **Paste** the optimized prompt from clipboard

#### Method 2: Command Palette

1. **Press** `Ctrl+Shift+P` to open command palette
2. **Type** "Promptious: Optimize Prompt" and select it
3. **Enter** your prompt in the input box
4. **Wait** for optimization to complete
5. **Paste** the optimized prompt from clipboard

#### Method 3: Context Menu

1. **Right-click** in any editor
2. **Select** "Promptious: Optimize Selected Text"
3. **Wait** for optimization to complete
4. **Paste** the optimized prompt from clipboard

#### Method 4: Code Actions

1. **Select** any text in the editor
2. **Click** the lightbulb icon that appears
3. **Select** "Optimize Selected Text"
4. **Wait** for optimization to complete
5. **Paste** the optimized prompt from clipboard

### Commands

- **Status Bar**: Click lightbulb icon (💡) - Quick access to prompt optimization
- **Command Palette** (`Ctrl+Shift+P`):
  - "Promptious: Optimize Prompt" - Enter prompt via input box
  - "Promptious: Optimize Selected Text" - Optimize selected text (if any)
  - "Promptious: Open Settings" - Open extension settings
- **Context Menu**: Right-click → "Promptious: Optimize Selected Text"
- **Code Actions**: Select text → Click lightbulb → "Optimize Selected Text"

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
