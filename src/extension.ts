import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Promptious Optimizer extension activated');
    console.log('Registering code action provider...');

    // Create status bar item with lightbulb icon
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(lightbulb) Promptious";
    statusBarItem.tooltip = "Click to optimize prompt";
    statusBarItem.command = 'promptious.optimizePrompt';
    statusBarItem.show();
    console.log('Status bar item created and shown');

    // Register code action provider for lightbulb suggestions
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        '*', // All languages
        {
            provideCodeActions(document, range, context, token) {
                try {
                    const selectedText = document.getText(range);
                    console.log('Code action provider called with text:', selectedText, 'length:', selectedText.length);

                    // Show lightbulb for ANY text selection (no restrictions)
                    if (selectedText.trim()) {
                        console.log('Creating code action for text:', selectedText);
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

                    console.log('No code action created - no text selected');
                    return [];
                } catch (error) {
                    console.error('Error in code action provider:', error);
                    return [];
                }
            }
        },
        {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
        }
    );

    // Simple command registration with optimization logic
    const optimizePromptCommand = vscode.commands.registerCommand('promptious.optimizePrompt', async () => {
        try {
            const prompt = await vscode.window.showInputBox({
                prompt: 'Enter the prompt to optimize:',
                placeHolder: 'Type your prompt here...'
            });

            if (prompt) {
                await optimizePrompt(prompt);
            }
        } catch (error) {
            console.error('Error in optimizePrompt command:', error);
            vscode.window.showErrorMessage('Error optimizing prompt: ' + (error instanceof Error ? error.message : String(error)));
        }
    });

    // Add optimize selection command
    const optimizeSelectionCommand = vscode.commands.registerCommand('promptious.optimizeSelection', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const selectedText = editor.document.getText(selection);

                if (selectedText.trim()) {
                    await optimizePrompt(selectedText);
                } else {
                    vscode.window.showWarningMessage('Please select some text to optimize.');
                }
            } else {
                vscode.window.showWarningMessage('No active editor found.');
            }
        } catch (error) {
            console.error('Error in optimizeSelection command:', error);
            vscode.window.showErrorMessage('Error optimizing selection: ' + (error instanceof Error ? error.message : String(error)));
        }
    });

    // Add settings command
    const openSettingsCommand = vscode.commands.registerCommand('promptious.openSettings', async () => {
        try {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'promptious');
        } catch (error) {
            console.error('Error opening settings:', error);
            vscode.window.showErrorMessage('Error opening settings: ' + (error instanceof Error ? error.message : String(error)));
        }
    });

    // Add to subscriptions
    context.subscriptions.push(optimizePromptCommand, optimizeSelectionCommand, openSettingsCommand, codeActionProvider, statusBarItem);
}

// Smart prompt analysis function
function analyzePromptType(prompt: string): { type: string; complexity: string; techniques: string[] } {
    const lowerPrompt = prompt.toLowerCase();

    // Determine prompt type
    let type = 'general';
    if (lowerPrompt.includes('code') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
        type = 'coding';
    } else if (lowerPrompt.includes('explain') || lowerPrompt.includes('what is') || lowerPrompt.includes('how does')) {
        type = 'explanation';
    } else if (lowerPrompt.includes('write') || lowerPrompt.includes('create') || lowerPrompt.includes('generate')) {
        type = 'creative';
    } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('compare') || lowerPrompt.includes('evaluate')) {
        type = 'analysis';
    } else if (lowerPrompt.includes('translate') || lowerPrompt.includes('convert')) {
        type = 'transformation';
    }

    // Determine complexity
    let complexity = 'simple';
    if (prompt.length > 200 || lowerPrompt.includes('step') || lowerPrompt.includes('process')) {
        complexity = 'complex';
    } else if (prompt.length > 100) {
        complexity = 'medium';
    }

    // Select appropriate techniques based on type and complexity
    let techniques: string[] = ['zero-shot', 'role-definition'];

    if (complexity === 'complex') {
        techniques.push('chain-of-thought');
    }

    if (type === 'coding' || type === 'creative') {
        techniques.push('few-shot');
    }

    if (type === 'analysis' || type === 'explanation') {
        techniques.push('meta-prompting');
    }

    if (complexity === 'complex' && (type === 'analysis' || type === 'explanation')) {
        techniques.push('self-consistency');
    }

    return { type, complexity, techniques };
}

// Smart optimization prompt creation
function createSmartOptimizationPrompt(originalPrompt: string, analysis: { type: string; complexity: string; techniques: string[] }): string {
    const techniqueDescriptions = {
        'zero-shot': 'Zero-shot Prompting: Direct instruction without examples',
        'few-shot': 'Few-shot Prompting: Include 2-3 relevant examples',
        'chain-of-thought': 'Chain-of-Thought: Add step-by-step reasoning structure',
        'meta-prompting': 'Meta Prompting: Ask AI to think about its own process',
        'self-consistency': 'Self-Consistency: Generate multiple perspectives',
        'role-definition': 'Role Definition: Establish clear AI expertise and context'
    };

    const appliedTechniques = analysis.techniques.map(t => techniqueDescriptions[t as keyof typeof techniqueDescriptions]).join('\n- ');

    return `You are an expert prompt engineer specializing in ${analysis.type} tasks. Optimize this ${analysis.complexity} prompt using these advanced techniques from the Prompt Engineering Guide:

**Techniques to apply:**
- ${appliedTechniques}

**Original prompt:**
${originalPrompt}

**Optimization strategy:**
1. **Analyze**: Identify the core intent and potential weaknesses
2. **Enhance**: Apply the selected techniques appropriately
3. **Structure**: Improve clarity, specificity, and logical flow
4. **Validate**: Ensure the prompt will produce high-quality responses

**Return ONLY the optimized prompt text, no explanations, no JSON, no quotes:**`;
}

// Optimization function using built-in fetch API
async function optimizePrompt(originalPrompt: string): Promise<void> {
    try {
        // Get configuration
        const config = vscode.workspace.getConfiguration('promptious');
        const apiKey = config.get<string>('apiKey');
        const autoCopy = config.get<boolean>('autoCopy', true);
        const showNotifications = config.get<boolean>('showNotifications', true);
        const model = config.get<string>('model', 'gpt-3.5-turbo');

        if (!apiKey) {
            const action = await vscode.window.showErrorMessage(
                'OpenAI API key not configured. Please set it in settings.',
                'Open Settings'
            );
            if (action === 'Open Settings') {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'promptious');
            }
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Optimizing prompt...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: `Sending request to OpenAI using ${model}...` });

            // Analyze prompt type and apply smart technique selection
            const promptAnalysis = analyzePromptType(originalPrompt);
            const optimizationPrompt = createSmartOptimizationPrompt(originalPrompt, promptAnalysis);

            // Call OpenAI API using built-in fetch
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: optimizationPrompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            progress.report({ increment: 50, message: "Processing response..." });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else {
                    const errorData = await response.json().catch(() => ({})) as any;
                    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
                }
            }

            const data = await response.json() as any;
            const optimizedPrompt = data.choices[0].message.content.trim();

            // Copy to clipboard if enabled
            if (autoCopy) {
                await vscode.env.clipboard.writeText(optimizedPrompt);
            }

            progress.report({ increment: 100, message: "Complete!" });

            // Show result
            if (showNotifications) {
                vscode.window.showInformationMessage(
                    autoCopy ? '✨ Prompt optimized and copied to clipboard!' : '✨ Prompt optimized!',
                    'View Result'
                ).then(selection => {
                    if (selection === 'View Result') {
                        vscode.window.showInformationMessage(`Optimized prompt:\n\n${optimizedPrompt}`);
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error optimizing prompt:', error);
        vscode.window.showErrorMessage('Error optimizing prompt: ' + (error instanceof Error ? error.message : String(error)));
    }
}

export function deactivate() {
    console.log('Promptious Optimizer extension deactivated');
}