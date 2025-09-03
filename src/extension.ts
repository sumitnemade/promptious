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
    console.log('Extension context:', context.extension.id);

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(lightbulb) Promptious";
    statusBarItem.tooltip = "Click to optimize prompt";
    statusBarItem.command = 'promptious.optimizePrompt';
    statusBarItem.show();

    // Log activation for debugging
    console.log('Promptious Optimizer extension activated successfully');

    // Register code action provider for lightbulb suggestions
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        { scheme: 'file' },
        {
            provideCodeActions(document, range, context, token) {
                const selectedText = document.getText(range);

                // Only show lightbulb if there's selected text and it looks like a prompt
                if (selectedText.trim() && isPromptLike(selectedText)) {
                    const action = new vscode.CodeAction(
                        'Optimize with Promptious',
                        vscode.CodeActionKind.QuickFix
                    );
                    action.command = {
                        command: 'promptious.optimizeSelection',
                        title: 'Optimize Selected Text',
                        arguments: []
                    };
                    action.isPreferred = true;
                    return [action];
                }

                return [];
            }
        },
        {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
        }
    );

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
        codeActionProvider,
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
                vscode.window.showInformationMessage('Learn more about prompt engineering techniques in the extension documentation.');
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

            progress.report({ increment: 30, message: "Sending request to OpenAI API..." });

            // Create optimization prompt for OpenAI
            const optimizationPrompt = createOptimizationPrompt(text, techniques);

            if (debug) {
                console.log('Sending optimization request to OpenAI:', { prompt: optimizationPrompt });
            }

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a prompt engineering expert. Optimize the given prompt using advanced techniques to make it more effective for AI models. Return your response in JSON format with the following structure: {"optimized_prompt": "...", "applied_techniques": [{"name": "...", "description": "..."}], "explanation": "...", "improvement_score": 0.0-1.0}'
                    },
                    {
                        role: 'user',
                        content: optimizationPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: REQUEST_TIMEOUT
            });

            progress.report({ increment: 70, message: "Processing response..." });

            // Parse OpenAI response
            const openaiResponse = response.data.choices[0].message.content;
            let optimizationResult: OptimizationResponse;

            try {
                optimizationResult = JSON.parse(openaiResponse);
            } catch (parseError) {
                // If JSON parsing fails, create a simple response
                optimizationResult = {
                    success: true,
                    optimized_prompt: openaiResponse,
                    applied_techniques: techniques.map(tech => ({
                        name: tech,
                        description: `Applied ${tech} technique`
                    })),
                    explanation: 'Prompt optimized using OpenAI GPT-3.5-turbo',
                    improvement_score: 0.8
                };
            }

            if (optimizationResult.optimized_prompt) {
                // Store in history with size limit
                history.push({
                    original: text,
                    optimized: optimizationResult.optimized_prompt,
                    techniques: techniques,
                    timestamp: new Date(),
                    score: optimizationResult.improvement_score
                });

                // Maintain history size limit
                if (history.length > MAX_HISTORY_SIZE) {
                    history.shift(); // Remove oldest entry
                }

                progress.report({ increment: 100, message: "Complete!" });

                // Show results in a new document
                await showOptimizationResults(text, optimizationResult);
            } else {
                throw new Error('No optimized prompt received from OpenAI');
            }
        });

    } catch (error: any) {
        console.error('Optimization error:', error);

        let errorMessage = 'Failed to optimize prompt. ';

        // Handle different types of errors
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage += 'Request timed out. Please check your internet connection and try again.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage += 'Cannot connect to OpenAI API. Please check your internet connection.';
        } else if (error.response?.status === 401) {
            errorMessage += 'Authentication failed. Please check your OpenAI API key.';
        } else if (error.response?.status === 429) {
            errorMessage += 'Rate limit exceeded. Please try again later or upgrade your OpenAI plan.';
        } else if (error.response?.status === 402) {
            errorMessage += 'Payment required. Please add credits to your OpenAI account.';
        } else if (error.response?.data?.error) {
            errorMessage += error.response.data.error.message || error.response.data.error;
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Please check your OpenAI API key and try again.';
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

    // Show meaningful notification with context
    const score = Math.round((response.improvement_score || 0) * 100);
    const optimizedPreview = (response.optimized_prompt || '').split('\n')[0].substring(0, 50);
    const truncatedPreview = optimizedPreview.length < (response.optimized_prompt || '').split('\n')[0].length ? optimizedPreview + '...' : optimizedPreview;

    // Create meaningful score description
    let scoreDescription = '';
    if (score >= 80) { scoreDescription = 'Excellent improvement!'; }
    else if (score >= 60) { scoreDescription = 'Good optimization!'; }
    else if (score >= 40) { scoreDescription = 'Moderate improvement'; }
    else { scoreDescription = 'Minor enhancement'; }

    const action = await vscode.window.showInformationMessage(
        `🎯 ${scoreDescription} (${score}% better)\n\n📝 "${truncatedPreview}"`,
        'Copy Optimized Prompt',
        'See Full Analysis'
    );

    if (action === 'Copy Optimized Prompt') {
        await vscode.env.clipboard.writeText(response.optimized_prompt || '');
        vscode.window.showInformationMessage('✅ Optimized prompt copied! Ready to use.');
    } else if (action === 'See Full Analysis') {
        await showExpandedDialog(original, response);
    }
}

function generateResultsMarkdown(original: string, response: OptimizationResponse): string {
    const timestamp = new Date().toLocaleString();
    const score = Math.round((response.improvement_score || 0) * 100);

    // Create meaningful score description
    let scoreDescription = '';
    if (score >= 80) { scoreDescription = 'Excellent! Your prompt is now much more effective.'; }
    else if (score >= 60) { scoreDescription = 'Great! Your prompt has been significantly improved.'; }
    else if (score >= 40) { scoreDescription = 'Good! Your prompt has been enhanced.'; }
    else { scoreDescription = 'Your prompt has been refined for better results.'; }

    return `# 🎯 Prompt Optimization Complete!

**${scoreDescription}** (${score}% improvement)  
**Optimized:** ${timestamp}

## 📝 Your Original Prompt
\`\`\`
${original}
\`\`\`

## ✨ Improved Version
\`\`\`
${response.optimized_prompt}
\`\`\`

## 🚀 Ready to Use
Your optimized prompt is ready! Copy it above and test it with your AI model to see the improved results.

## 💡 Next Steps
1. **Test the improved prompt** with your AI model
2. **Compare results** with your original version
3. **Fine-tune** if needed for your specific use case
4. **Learn more** about prompt engineering techniques

---
*Generated by Promptious Optimizer - Making AI prompts more effective*
`;
}

async function showExpandedDialog(original: string, response: OptimizationResponse): Promise<void> {
    // Create meaningful expanded content
    const score = Math.round((response.improvement_score || 0) * 100);
    const techniques = response.applied_techniques?.map(tech => `• ${tech.name}`).join('\n') || '• Basic optimization techniques';

    // Create user-friendly score context
    let scoreContext = '';
    if (score >= 80) { scoreContext = 'Your prompt is now significantly more effective!'; }
    else if (score >= 60) { scoreContext = 'Your prompt has been substantially improved!'; }
    else if (score >= 40) { scoreContext = 'Your prompt has been enhanced with better structure.'; }
    else { scoreContext = 'Your prompt has been refined for better clarity.'; }

    const expandedContent = `🎯 OPTIMIZATION ANALYSIS

${scoreContext} (${score}% improvement)

📝 ORIGINAL:
"${original}"

✨ IMPROVED:
"${response.optimized_prompt}"

🔧 TECHNIQUES:
${techniques}

💡 WHY BETTER:
${response.explanation || 'The optimized version uses proven prompt engineering techniques to get better results from AI models.'}

🚀 NEXT STEPS:
1. Copy the improved prompt and test it
2. Compare results with your original  
3. Fine-tune if needed based on your specific use case`;

    // Show expanded dialog with clear actions
    const expandedAction = await vscode.window.showInformationMessage(
        expandedContent,
        'Copy Improved Prompt',
        'Copy Original'
    );

    if (expandedAction === 'Copy Improved Prompt') {
        await vscode.env.clipboard.writeText(response.optimized_prompt || '');
        vscode.window.showInformationMessage('✅ Improved prompt copied! Test it with your AI model.');
    } else if (expandedAction === 'Copy Original') {
        await vscode.env.clipboard.writeText(original);
        vscode.window.showInformationMessage('✅ Original prompt copied!');
    }
}

async function showDetailedResults(original: string, response: OptimizationResponse): Promise<void> {
    // Create a more detailed results view
    const detailedContent = `# 🎯 Prompt Optimization Results

## 📊 Summary
- **Improvement Score**: ${Math.round((response.improvement_score || 0) * 100)}%
- **Optimized**: ${new Date().toLocaleString()}
- **Techniques Applied**: ${response.applied_techniques?.length || 0}

## 📝 Original Prompt
\`\`\`
${original}
\`\`\`

## ✨ Optimized Prompt
\`\`\`
${response.optimized_prompt}
\`\`\`

## 🔧 Applied Techniques
${response.applied_techniques?.map(tech => `### ${tech.name}
${tech.description}`).join('\n\n') || 'No techniques specified'}

## 💡 Explanation
${response.explanation || 'No explanation provided'}

## 🚀 Next Steps
1. **Test the optimized prompt** with your AI model
2. **Compare results** with the original
3. **Iterate** if needed based on performance
4. **Save successful prompts** for future use

---
*Generated by Promptious Optimizer Extension*
`;

    const doc = await vscode.workspace.openTextDocument({
        content: detailedContent,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
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
2. Start optimizing prompts!

## How It Works
- Extension directly calls OpenAI GPT-3.5-turbo API
- No backend server required
- Uses advanced prompt engineering techniques
- Optimizes prompts for better AI model performance

## Troubleshooting
- Check console output for debug information
- Ensure API key has sufficient credits
- Verify internet connection
- Check OpenAI API status
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

function createOptimizationPrompt(originalPrompt: string, techniques: string[]): string {
    const techniqueDescriptions = {
        'zero_shot': 'Direct instruction without examples',
        'few_shot': 'Provide examples to guide the model',
        'chain_of_thought': 'Break down the task into steps',
        'meta_prompting': 'Ask the model to think about how to approach the task',
        'self_consistency': 'Generate multiple responses and select the best one',
        'generate_knowledge': 'Generate relevant knowledge before answering'
    };

    const appliedTechniques = techniques.map(tech => techniqueDescriptions[tech as keyof typeof techniqueDescriptions] || tech).join(', ');

    return `Please optimize the following prompt using these techniques: ${appliedTechniques}

Original prompt: "${originalPrompt}"

Please provide an optimized version that:
1. Is clearer and more specific
2. Uses the requested techniques effectively
3. Is more likely to produce high-quality results
4. Maintains the original intent

Return your response in JSON format with this exact structure:
{
  "optimized_prompt": "your optimized prompt here",
  "applied_techniques": [
    {"name": "technique_name", "description": "how it was applied"}
  ],
  "explanation": "brief explanation of the optimization",
  "improvement_score": 0.85
}`;
}

function isPromptLike(text: string): boolean {
    const trimmed = text.trim();

    // Check if text looks like a prompt based on common patterns
    const promptIndicators = [
        // Question patterns
        /^(what|how|why|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were)/i,
        // Instruction patterns
        /^(write|create|generate|make|build|design|explain|describe|summarize|analyze|compare|list)/i,
        // AI/LLM specific patterns
        /^(prompt|instruction|task|request|query|input|output|response)/i,
        // Length check (prompts are usually substantial)
        trimmed.length > 10 && trimmed.length < 1000
    ];

    // Check for multiple sentences or complex structure
    const hasMultipleSentences = trimmed.split(/[.!?]+/).length > 1;
    const hasComplexStructure = /[,;:()\[\]{}]/.test(trimmed);

    return promptIndicators.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(trimmed);
        }
        return pattern;
    }) || hasMultipleSentences || hasComplexStructure;
}

export function deactivate() {
    console.log('Promptious Optimizer extension deactivated');
}
