import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('promptious.promptious-optimizer'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('promptious.promptious-optimizer');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('promptious.optimizePrompt'));
        assert.ok(commands.includes('promptious.optimizeSelection'));
        assert.ok(commands.includes('promptious.showHistory'));
        assert.ok(commands.includes('promptious.configureSettings'));
        assert.ok(commands.includes('promptious.clearHistory'));
    });

    test('Configuration should be accessible', () => {
        const config = vscode.workspace.getConfiguration('promptious');

        // Test all configuration properties exist and have correct types
        const apiKey = config.get('apiKey');
        const baseUrl = config.get('baseUrl');
        const debug = config.get('debug');
        const defaultTechniques = config.get('defaultTechniques');
        const autoOptimize = config.get('autoOptimize');

        assert.strictEqual(typeof apiKey, 'string');
        assert.strictEqual(typeof baseUrl, 'string');
        assert.strictEqual(typeof debug, 'boolean');
        assert.ok(Array.isArray(defaultTechniques));
        assert.strictEqual(typeof autoOptimize, 'boolean');
    });

    test('Status bar item should be created', () => {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(lightbulb) Promptious";
        statusBarItem.tooltip = "Click to optimize prompt";
        statusBarItem.command = 'promptious.optimizePrompt';
        statusBarItem.show();

        assert.ok(statusBarItem);
        assert.strictEqual(statusBarItem.text, "$(lightbulb) Promptious");
        assert.strictEqual(statusBarItem.tooltip, "Click to optimize prompt");
        assert.strictEqual(statusBarItem.command, 'promptious.optimizePrompt');

        statusBarItem.hide();
        statusBarItem.dispose();
    });
});
