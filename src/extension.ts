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

    // Create status bar item with higher priority
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    statusBarItem.text = "$(lightbulb) Promptious";
    statusBarItem.tooltip = "Click to optimize prompt";
    statusBarItem.command = 'promptious.optimizePrompt';

    // Show status bar item with a small delay to ensure VS Code is ready
    setTimeout(() => {
        statusBarItem.show();
        console.log('Status bar item shown after delay');
    }, 100);

    console.log('Status bar item created');
    console.log('Status bar item text:', statusBarItem.text);
    console.log('Status bar item command:', statusBarItem.command);
    console.log('Status bar item priority:', 1000);

    // Log activation for debugging
    console.log('Promptious Optimizer extension activated successfully');

    // Register code action provider for lightbulb suggestions
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        '*', // All languages
        {
            provideCodeActions(document, range, context, token) {
                const selectedText = document.getText(range);
                console.log('Code action provider called with text:', selectedText);

                // Only show lightbulb if there's selected text and it looks like a prompt
                if (selectedText.trim() && isPromptLike(selectedText)) {
                    console.log('Text is prompt-like, showing lightbulb');
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

                console.log('Text is not prompt-like, no lightbulb');
                return [];
            }
        },
        {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
        }
    );

    console.log('Code action provider registered');

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

    // Add a test command to debug lightbulb issues
    const testLightbulbCommand = vscode.commands.registerCommand('promptious.testLightbulb', async () => {
        vscode.window.showInformationMessage('Lightbulb test command executed! Extension is working.');
        console.log('Test lightbulb command executed');
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
        testLightbulbCommand,
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

    if (editor) {
        // If there's an active editor, check for selection first
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim()) {
            // Use selected text
            await optimizeText(selectedText, history);
            return;
        }
    }

    // No editor or no selection - prompt user to enter text
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

async function handleOptimizeSelection(history: OptimizationHistory[]): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        // If there's an active editor, check for selection
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText.trim()) {
            // Use selected text
            await optimizeText(selectedText, history);
            return;
        }
    }

    // No editor or no selection - prompt user to enter text
    const userInput = await vscode.window.showInputBox({
        prompt: 'Enter the prompt you want to optimize:',
        placeHolder: 'e.g., "write a function to send email"',
        validateInput: (text) => {
            if (!text || text.trim().length < 3) {
                return 'Please enter at least 3 characters';
            }
            return null;
        }
    });

    if (userInput) {
        await optimizeText(userInput, history);
    }
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
            const optimizationLevel = config.get<string>('optimizationLevel', 'smart');
            const maxTechniques = config.get<number>('maxTechniques', 4);
            const autoCopy = config.get<boolean>('autoCopy', true);
            const showNotifications = config.get<boolean>('showNotifications', true);
            const debugMode = config.get<boolean>('debugMode', false);
            const preferredModel = config.get<string>('preferredModel', 'gpt-3.5-turbo');

            if (!apiKey) {
                vscode.window.showErrorMessage(
                    '🔑 OpenAI API key not configured. Please set it in settings.',
                    'Configure Settings'
                ).then(selection => {
                    if (selection === 'Configure Settings') {
                        vscode.commands.executeCommand('promptious.configureSettings');
                    }
                });
                return;
            }

            if (debugMode) {
                console.log('Promptious settings:', { optimizationLevel, maxTechniques, autoCopy, showNotifications, preferredModel });
            }

            progress.report({ increment: 30, message: "Sending request to OpenAI API..." });

            // Create optimization prompt for OpenAI
            const optimizationPrompt = createOptimizationPrompt(text, [], optimizationLevel, maxTechniques);

            if (debugMode) {
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

            // Get optimized prompt directly
            let optimizedPrompt = response.data.choices[0].message.content.trim();

            // If it returns JSON, extract just the optimized_prompt
            if (optimizedPrompt.startsWith('{') && optimizedPrompt.includes('optimized_prompt')) {
                try {
                    const jsonResponse = JSON.parse(optimizedPrompt);
                    optimizedPrompt = jsonResponse.optimized_prompt || optimizedPrompt;
                    console.log('Extracted from JSON:', optimizedPrompt);
                } catch (e) {
                    console.log('JSON parsing failed:', e);
                    // If JSON parsing fails, use the original response
                }
            }

            const optimizationResult: OptimizationResponse = {
                success: true,
                optimized_prompt: optimizedPrompt,
                applied_techniques: [],
                explanation: '',
                improvement_score: 0
            };

            if (optimizationResult.optimized_prompt) {
                // Store in history with size limit
                history.push({
                    original: text,
                    optimized: optimizationResult.optimized_prompt,
                    techniques: [],
                    timestamp: new Date(),
                    score: optimizationResult.improvement_score
                });

                // Maintain history size limit
                if (history.length > MAX_HISTORY_SIZE) {
                    history.shift(); // Remove oldest entry
                }

                progress.report({ increment: 100, message: "Complete!" });

                // Show results based on settings
                await showOptimizationResults(text, optimizationResult, autoCopy, showNotifications);
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

async function showOptimizationResults(original: string, response: OptimizationResponse, autoCopy: boolean = true, showNotifications: boolean = true): Promise<void> {
    const optimizedPrompt = response.optimized_prompt || original;

    // Copy to clipboard if autoCopy is enabled
    if (autoCopy) {
        await vscode.env.clipboard.writeText(optimizedPrompt);
    }

    // Show notification if enabled
    if (showNotifications) {
        const message = autoCopy
            ? '✨ Prompt optimized and copied to clipboard'
            : '✨ Prompt optimized successfully';
        vscode.window.showInformationMessage(message);
    }
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
    // Open VS Code settings filtered to Promptious
    await vscode.commands.executeCommand('workbench.action.openSettings', 'promptious');

    // Show helpful message
    vscode.window.showInformationMessage(
        '🔧 Promptious settings opened! Set your OpenAI API key to get started.',
        'Get API Key'
    ).then(selection => {
        if (selection === 'Get API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://platform.openai.com/api-keys'));
        }
    });
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

function createOptimizationPrompt(originalPrompt: string, techniques: string[], optimizationLevel: string = 'smart', maxTechniques: number = 4): string {
    // Select relevant techniques based on optimization level and prompt characteristics
    const selectedTechniques = selectOptimalTechniques(originalPrompt, techniques, optimizationLevel, maxTechniques);

    return `You are an expert prompt engineer. Apply these proven techniques to optimize the prompt:

${selectedTechniques.map(tech => `- ${tech.name}: ${tech.description}`).join('\n')}

Original prompt: "${originalPrompt}"

Apply the techniques above to create a more effective prompt. Return ONLY the optimized prompt text, no explanations or JSON.`;
}

function selectOptimalTechniques(originalPrompt: string, availableTechniques: string[], optimizationLevel: string = 'smart', maxTechniques: number = 4): Array<{ name: string, description: string }> {
    // Complete set of techniques from https://www.promptingguide.ai/techniques
    const allTechniques = [
        {
            name: "Zero-shot Prompting",
            description: "Provide clear, direct instructions without examples",
            keywords: ["simple", "direct", "basic"],
            minLength: 0
        },
        {
            name: "Few-shot Prompting",
            description: "Include 2-3 examples to guide the model",
            keywords: ["example", "similar", "like this"],
            minLength: 20
        },
        {
            name: "Chain-of-Thought Prompting",
            description: "Break complex tasks into step-by-step reasoning",
            keywords: ["think", "reason", "step", "process", "analyze"],
            minLength: 30
        },
        {
            name: "Meta Prompting",
            description: "Ask the model to think about how to approach the task",
            keywords: ["approach", "strategy", "method", "how to"],
            minLength: 40
        },
        {
            name: "Self-Consistency",
            description: "Generate multiple responses and select the best one",
            keywords: ["multiple", "compare", "best", "verify"],
            minLength: 50
        },
        {
            name: "Generate Knowledge Prompting",
            description: "Generate relevant knowledge before answering",
            keywords: ["knowledge", "background", "context", "research"],
            minLength: 30
        },
        {
            name: "Prompt Chaining",
            description: "Break complex tasks into smaller, connected prompts",
            keywords: ["chain", "sequence", "multiple steps", "workflow"],
            minLength: 60
        },
        {
            name: "Tree of Thoughts",
            description: "Explore multiple reasoning paths and select the best",
            keywords: ["explore", "paths", "options", "alternatives"],
            minLength: 50
        },
        {
            name: "Retrieval Augmented Generation",
            description: "Use external knowledge sources to enhance responses",
            keywords: ["search", "find", "lookup", "reference"],
            minLength: 40
        },
        {
            name: "Automatic Reasoning and Tool-use",
            description: "Enable the model to use tools and reason automatically",
            keywords: ["tool", "function", "api", "calculate"],
            minLength: 30
        },
        {
            name: "Active-Prompt",
            description: "Dynamically select the most effective prompt examples",
            keywords: ["dynamic", "adaptive", "selective"],
            minLength: 40
        },
        {
            name: "Directional Stimulus Prompting",
            description: "Guide the model's attention to specific aspects",
            keywords: ["focus", "emphasize", "highlight", "attention"],
            minLength: 30
        },
        {
            name: "Program-Aided Language Models",
            description: "Use programming constructs to structure reasoning",
            keywords: ["code", "program", "algorithm", "logic"],
            minLength: 40
        },
        {
            name: "ReAct",
            description: "Combine reasoning and acting in an interleaved manner",
            keywords: ["reason", "act", "interact", "dynamic"],
            minLength: 50
        },
        {
            name: "Reflexion",
            description: "Enable the model to reflect on and improve its responses",
            keywords: ["reflect", "improve", "feedback", "iteration"],
            minLength: 40
        },
        {
            name: "Multimodal CoT",
            description: "Apply chain-of-thought reasoning to multimodal inputs",
            keywords: ["image", "visual", "multimodal", "picture"],
            minLength: 30
        },
        {
            name: "Graph Prompting",
            description: "Structure information as graphs for better reasoning",
            keywords: ["graph", "network", "relationship", "connection"],
            minLength: 40
        }
    ];

    // Analyze prompt characteristics
    const promptLower = originalPrompt.toLowerCase();
    const promptLength = originalPrompt.length;
    const hasQuestion = originalPrompt.includes('?');
    const hasCodeKeywords = /\b(code|function|class|method|algorithm|program|script|api|database|sql|html|css|javascript|python|java|c\+\+|react|node)\b/i.test(originalPrompt);
    const hasVisualKeywords = /\b(image|picture|photo|visual|draw|design|chart|graph|diagram)\b/i.test(originalPrompt);
    const hasAnalysisKeywords = /\b(analyze|compare|evaluate|assess|review|examine|study)\b/i.test(originalPrompt);
    const hasCreativeKeywords = /\b(create|write|generate|design|invent|imagine|brainstorm)\b/i.test(originalPrompt);

    // Smart technique selection based on prompt analysis
    const selected: Array<{ name: string, description: string }> = [];

    // Always start with zero-shot for clarity
    selected.push(allTechniques[0]);

    // Role definition (always helpful)
    if (!promptLower.includes('you are') && !promptLower.includes('act as')) {
        selected.push({
            name: "Role Definition",
            description: "Define the AI's role and expertise clearly"
        });
    }

    // Context setting for short prompts
    if (promptLength < 30) {
        selected.push({
            name: "Context Setting",
            description: "Provide relevant background and context"
        });
    }

    // Chain-of-thought for complex reasoning
    if (promptLength > 50 || hasQuestion || hasAnalysisKeywords) {
        selected.push(allTechniques[2]); // Chain-of-Thought
    }

    // Few-shot for examples and comparisons
    if (hasAnalysisKeywords || promptLower.includes('example') || promptLower.includes('similar')) {
        selected.push(allTechniques[1]); // Few-shot
    }

    // Meta prompting for strategic tasks
    if (promptLength > 60 && (hasAnalysisKeywords || promptLower.includes('approach'))) {
        selected.push(allTechniques[3]); // Meta Prompting
    }

    // Program-aided for coding tasks
    if (hasCodeKeywords) {
        selected.push(allTechniques[12]); // Program-Aided Language Models
    }

    // Multimodal CoT for visual tasks
    if (hasVisualKeywords) {
        selected.push(allTechniques[15]); // Multimodal CoT
    }

    // Generate Knowledge for research tasks
    if (promptLower.includes('research') || promptLower.includes('find') || promptLower.includes('lookup')) {
        selected.push(allTechniques[5]); // Generate Knowledge
    }

    // Self-consistency for important decisions
    if (promptLength > 80 && (hasAnalysisKeywords || promptLower.includes('best') || promptLower.includes('compare'))) {
        selected.push(allTechniques[4]); // Self-Consistency
    }

    // ReAct for interactive tasks
    if (promptLower.includes('interact') || promptLower.includes('dynamic') || hasCodeKeywords) {
        selected.push(allTechniques[13]); // ReAct
    }

    // Output formatting for generation tasks
    if (hasCreativeKeywords) {
        selected.push({
            name: "Output Formatting",
            description: "Specify desired output format and structure"
        });
    }

    // Constraint specification for complex requirements
    if (promptLength > 100) {
        selected.push({
            name: "Constraint Specification",
            description: "Add clear constraints and requirements"
        });
    }

    // Remove duplicates and apply optimization level
    const uniqueSelected = selected.filter((technique, index, self) =>
        index === self.findIndex(t => t.name === technique.name)
    );

    // Apply optimization level
    if (optimizationLevel === 'conservative') {
        // Only basic techniques
        return uniqueSelected.filter(tech =>
            ['Zero-shot Prompting', 'Role Definition', 'Context Setting'].includes(tech.name)
        ).slice(0, 2);
    } else if (optimizationLevel === 'aggressive') {
        // Use all relevant techniques up to maxTechniques
        return uniqueSelected.slice(0, maxTechniques);
    } else {
        // Smart: balanced approach
        return uniqueSelected.slice(0, Math.min(maxTechniques, 4));
    }
}

function isPromptLike(text: string): boolean {
    const trimmed = text.trim();

    // Show lightbulb for any reasonable text selection
    // This makes the extension more discoverable and useful
    return trimmed.length >= 5 && trimmed.length <= 500;
}

export function deactivate() {
    console.log('Promptious Optimizer extension deactivated');
}
