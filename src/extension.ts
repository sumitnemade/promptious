import * as vscode from 'vscode';
import axios from 'axios';

interface OptimizationRequest {
    prompt: string;
    techniques: string[];
    context: string;
}

interface OptimizationResponse {
    success: boolean;
    optimized_prompt?: string;
    applied_techniques?: Array<{
        name: string;
        description: string;
    }>;
    explanation?: string;
    improvement_score?: number;
    error?: string;
    error_code?: string;
    retry_after?: number;
}

interface OptimizationHistory {
    original: string;
    optimized: string;
    techniques: string[];
    timestamp: Date;
    score?: number;
}

// Configuration constants
const MAX_HISTORY_SIZE = 100;
const MAX_PROMPT_LENGTH = 10000;
const REQUEST_TIMEOUT = 30000;

export function activate(context: vscode.ExtensionContext) {
    console.log('Promptious Optimizer extension is now active!');

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(lightbulb) Promptious";
    statusBarItem.tooltip = "Click to optimize prompt";
    statusBarItem.command = 'promptious.optimizePrompt';
    statusBarItem.show();

    // Store optimization history with size limit
    const optimizationHistory: OptimizationHistory[] = [];

    // Register commands
    const optimizePromptCommand = vscode.commands.registerCommand('promptious.optimizePrompt', async () => {
        await handleOptimizePrompt(optimizationHistory);
    });

    const optimizeSelectionCommand = vscode.commands.registerCommand('promptious.optimizeSelection', async () => {
        await handleOptimizeSelection(optimizationHistory);
    });

    const showHistoryCommand = vscode.commands.registerCommand('promptious.showHistory', async () => {
        await showOptimizationHistory(optimizationHistory);
    });

    const configureSettingsCommand = vscode.commands.registerCommand('promptious.configureSettings', async () => {
        await configureSettings();
    });

    const clearHistoryCommand = vscode.commands.registerCommand('promptious.clearHistory', async () => {
        await clearOptimizationHistory(optimizationHistory);
    });

    // Add commands to context
    context.subscriptions.push(
        statusBarItem,
        optimizePromptCommand,
        optimizeSelectionCommand,
        showHistoryCommand,
        configureSettingsCommand,
        clearHistoryCommand
    );

    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('promptious.hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            'Welcome to Promptious Optimizer! Select text and right-click to optimize prompts.',
            'Configure Settings',
            'Learn More'
        ).then(selection => {
            if (selection === 'Configure Settings') {
                vscode.commands.executeCommand('promptious.configureSettings');
            } else if (selection === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://www.promptingguide.ai/techniques'));
            }
        });
        context.globalState.update('promptious.hasShownWelcome', true);
    }
}

async function handleOptimizePrompt(history: OptimizationHistory[]): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found. Please open a file first.');
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (selectedText.trim()) {
        // If there's a selection, optimize it
        await optimizeText(selectedText, history);
    } else {
        // If no selection, ask for prompt input
        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter the prompt to optimize',
            placeHolder: 'Type your prompt here...',
            validateInput: (value) => {
                if (!value || value.trim().length < 3) {
                    return 'Prompt must be at least 3 characters long';
                }
                if (value.length > MAX_PROMPT_LENGTH) {
                    return `Prompt must be less than ${MAX_PROMPT_LENGTH} characters`;
                }
                return null;
            }
        });

        if (prompt) {
            await optimizeText(prompt, history);
        }
    }
}

async function handleOptimizeSelection(history: OptimizationHistory[]): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found.');
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText.trim()) {
        vscode.window.showWarningMessage('Please select some text to optimize.');
        return;
    }

    await optimizeText(selectedText, history);
}

async function optimizeText(text: string, history: OptimizationHistory[]): Promise<void> {
    try {
        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Optimizing prompt...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "Analyzing prompt..." });

            const config = vscode.workspace.getConfiguration('promptious');
            const apiKey = config.get<string>('apiKey');
            const baseUrl = config.get<string>('baseUrl', 'http://localhost:8000');
            const techniques = config.get<string[]>('defaultTechniques', ['zero_shot', 'few_shot', 'chain_of_thought']);
            const debug = config.get<boolean>('debug', false);

            if (!apiKey) {
                vscode.window.showErrorMessage(
                    'OpenAI API key not configured. Please set it in settings.',
                    'Configure Settings'
                ).then(selection => {
                    if (selection === 'Configure Settings') {
                        vscode.commands.executeCommand('promptious.configureSettings');
                    }
                });
                return;
            }

            progress.report({ increment: 30, message: "Sending request to Promptious API..." });

            const request: OptimizationRequest = {
                prompt: text,
                techniques: techniques,
                context: 'vscode_extension'
            };

            if (debug) {
                console.log('Sending optimization request:', request);
            }

            const response = await axios.post<OptimizationResponse>(`${baseUrl}/api/optimize`, request, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: REQUEST_TIMEOUT
            });

            progress.report({ increment: 70, message: "Processing response..." });

            if (response.data.success && response.data.optimized_prompt) {
                // Store in history with size limit
                history.push({
                    original: text,
                    optimized: response.data.optimized_prompt,
                    techniques: techniques,
                    timestamp: new Date(),
                    score: response.data.improvement_score
                });

                // Maintain history size limit
                if (history.length > MAX_HISTORY_SIZE) {
                    history.shift(); // Remove oldest entry
                }

                progress.report({ increment: 100, message: "Complete!" });

                // Show results in a new document
                await showOptimizationResults(text, response.data);
            } else {
                throw new Error(response.data.error || 'Unknown error occurred');
            }
        });

    } catch (error: any) {
        console.error('Optimization error:', error);

        let errorMessage = 'Failed to optimize prompt. ';

        // Handle different types of errors
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage += 'Request timed out. Please check your internet connection and try again.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage += 'Cannot connect to the server. Please check the backend URL in settings.';
        } else if (error.response?.status === 401) {
            errorMessage += 'Authentication failed. Please check your API key.';
        } else if (error.response?.status === 429) {
            errorMessage += 'Rate limit exceeded. Please try again later.';
        } else if (error.response?.data?.error) {
            errorMessage += error.response.data.error;
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Please check your configuration and try again.';
        }

        vscode.window.showErrorMessage(errorMessage, 'Configure Settings').then(selection => {
            if (selection === 'Configure Settings') {
                vscode.commands.executeCommand('promptious.configureSettings');
            }
        });
    }
}

async function showOptimizationResults(original: string, response: OptimizationResponse): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({
        content: generateResultsMarkdown(original, response),
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);

    // Show notification with quick actions
    const action = await vscode.window.showInformationMessage(
        `Prompt optimized! Improvement score: ${(response.improvement_score || 0) * 100}%`,
        'Copy Optimized Prompt',
        'Show Techniques',
        'Learn More'
    );

    if (action === 'Copy Optimized Prompt') {
        await vscode.env.clipboard.writeText(response.optimized_prompt || '');
        vscode.window.showInformationMessage('Optimized prompt copied to clipboard!');
    } else if (action === 'Show Techniques') {
        await showAppliedTechniques(response.applied_techniques || []);
    } else if (action === 'Learn More') {
        vscode.env.openExternal(vscode.Uri.parse('https://www.promptingguide.ai/techniques'));
    }
}

function generateResultsMarkdown(original: string, response: OptimizationResponse): string {
    const timestamp = new Date().toLocaleString();
    const score = response.improvement_score ? (response.improvement_score * 100).toFixed(1) : 'N/A';

    return `# Prompt Optimization Results

**Generated:** ${timestamp}  
**Improvement Score:** ${score}%

## Original Prompt
\`\`\`
${original}
\`\`\`

## Optimized Prompt
\`\`\`
${response.optimized_prompt}
\`\`\`

## Applied Techniques
${response.applied_techniques?.map(tech => `- **${tech.name}**: ${tech.description}`).join('\n') || 'No techniques specified'}

## Explanation
${response.explanation || 'No explanation provided'}

## Next Steps
1. Review the optimized prompt above
2. Test it with your AI model
3. Adjust if needed based on results
4. Learn more about prompt engineering at [promptingguide.ai](https://www.promptingguide.ai/techniques)

---
*Generated by Promptious Optimizer Extension*
`;
}

async function showAppliedTechniques(techniques: Array<{ name: string, description: string }>): Promise<void> {
    const techniqueList = techniques.map(tech => `**${tech.name}**\n${tech.description}`).join('\n\n');

    const doc = await vscode.workspace.openTextDocument({
        content: `# Applied Prompt Engineering Techniques\n\n${techniqueList}`,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
}

async function showOptimizationHistory(history: OptimizationHistory[]): Promise<void> {
    if (history.length === 0) {
        vscode.window.showInformationMessage('No optimization history found.');
        return;
    }

    const historyContent = history.map((item, index) => {
        const timestamp = item.timestamp.toLocaleString();
        const score = item.score ? (item.score * 100).toFixed(1) : 'N/A';

        return `## Optimization ${index + 1}
**Date:** ${timestamp}  
**Score:** ${score}%  
**Techniques:** ${item.techniques.join(', ')}

### Original
\`\`\`
${item.original}
\`\`\`

### Optimized
\`\`\`
${item.optimized}
\`\`\`

---`;
    }).join('\n\n');

    const doc = await vscode.workspace.openTextDocument({
        content: `# Optimization History\n\n${historyContent}`,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
}

async function configureSettings(): Promise<void> {
    const config = vscode.workspace.getConfiguration('promptious');

    // Open settings
    await vscode.commands.executeCommand('workbench.action.openSettings', 'promptious');

    // Show configuration help
    const helpDoc = await vscode.workspace.openTextDocument({
        content: `# Promptious Configuration Guide

## Required Settings

### OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set \`promptious.apiKey\` in VS Code settings

### Backend URL
- Set \`promptious.baseUrl\` to your Promptious backend URL
- Default: \`http://localhost:8000\`

## Optional Settings

### Debug Mode
- Enable \`promptious.debug\` for detailed logging

### Default Techniques
- Configure \`promptious.defaultTechniques\` array
- Available: zero_shot, few_shot, chain_of_thought, meta_prompting, self_consistency, generate_knowledge

### Auto-optimize
- Enable \`promptious.autoOptimize\` for automatic optimization

## Quick Setup
1. Set your OpenAI API key
2. Ensure Promptious backend is running
3. Start optimizing prompts!

## Troubleshooting
- Check console output for debug information
- Verify backend is accessible
- Ensure API key has sufficient credits
`,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(helpDoc);
}

async function clearOptimizationHistory(history: OptimizationHistory[]): Promise<void> {
    const confirmed = await vscode.window.showWarningMessage(
        'Are you sure you want to clear all optimization history?',
        'Yes',
        'No'
    );

    if (confirmed === 'Yes') {
        history.length = 0; // Clear the array
        vscode.window.showInformationMessage('Optimization history cleared!');
    }
}

export function deactivate() {
    console.log('Promptious Optimizer extension deactivated');
}
