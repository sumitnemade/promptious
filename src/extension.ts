import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('Promptious Optimizer extension activated');

    // Create status bar item with error handling
    let statusBarItem: vscode.StatusBarItem | undefined;
    try {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(lightbulb) Promptious";
        statusBarItem.tooltip = "Click to optimize prompt";
        statusBarItem.command = 'promptious.optimizePrompt';

        // Show with delay to ensure VS Code is ready
        setTimeout(() => {
            try {
                if (statusBarItem) {
                    statusBarItem.show();
                    console.log('Status bar item shown successfully');
                }
            } catch (error) {
                console.error('Error showing status bar item:', error);
            }
        }, 100); // Reduced delay for faster appearance

        console.log('Status bar item created successfully');
    } catch (error) {
        console.error('Error creating status bar item:', error);
    }

    // Register code action provider with error handling
    let codeActionProvider: vscode.Disposable | undefined;
    try {
        codeActionProvider = vscode.languages.registerCodeActionsProvider(
            '*', // All languages
            {
                provideCodeActions(document, range, context, token) {
                    try {
                        const selectedText = document.getText(range);

                        // Only show lightbulb for reasonable text selections
                        if (selectedText.trim() && selectedText.length >= 5 && selectedText.length <= 500) {
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
        console.log('Code action provider registered successfully');
    } catch (error) {
        console.error('Error registering code action provider:', error);
    }

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

    // Add to subscriptions with error handling
    const subscriptions = [optimizePromptCommand, optimizeSelectionCommand];
    if (statusBarItem) {
        subscriptions.push(statusBarItem);
    }
    if (codeActionProvider) {
        subscriptions.push(codeActionProvider);
    }

    context.subscriptions.push(...subscriptions);
}

// Optimization function with error handling
async function optimizePrompt(originalPrompt: string): Promise<void> {
    try {
        // Get configuration
        const config = vscode.workspace.getConfiguration('promptious');
        const apiKey = config.get<string>('apiKey');
        const autoCopy = config.get<boolean>('autoCopy', true);
        const showNotifications = config.get<boolean>('showNotifications', true);

        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API key not configured. Please set it in settings.');
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Optimizing prompt...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "Sending request to OpenAI..." });

            // Create optimization prompt
            const optimizationPrompt = `Improve this prompt to be clearer and more effective. Return ONLY the improved prompt text, no JSON, no explanations, no quotes:

${originalPrompt}`;

            // Call OpenAI API
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: optimizationPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            progress.report({ increment: 50, message: "Processing response..." });

            const optimizedPrompt = response.data.choices[0].message.content.trim();

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
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                vscode.window.showErrorMessage('Invalid API key. Please check your OpenAI API key in settings.');
            } else if (error.response?.status === 429) {
                vscode.window.showErrorMessage('Rate limit exceeded. Please try again later.');
            } else {
                vscode.window.showErrorMessage('OpenAI API error: ' + ((error.response?.data as any)?.error?.message || error.message));
            }
        } else {
            vscode.window.showErrorMessage('Error optimizing prompt: ' + (error instanceof Error ? error.message : String(error)));
        }
    }
}

export function deactivate() {
    console.log('Promptious Optimizer extension deactivated');
}