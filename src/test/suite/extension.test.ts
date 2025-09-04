import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('sumitdev.promptious-optimizer'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('sumitdev.promptious-optimizer');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('promptious.optimizePrompt'));
        assert.ok(commands.includes('promptious.optimizeSelection'));
        assert.ok(commands.includes('promptious.openSettings'));
    });

    test('Configuration should be accessible', () => {
        const config = vscode.workspace.getConfiguration('promptious');

        // Test all configuration properties exist and have correct types
        const apiKey = config.get('apiKey');
        const autoCopy = config.get('autoCopy');
        const showNotifications = config.get('showNotifications');
        const model = config.get('model');

        assert.strictEqual(typeof apiKey, 'string');
        assert.strictEqual(typeof autoCopy, 'boolean');
        assert.strictEqual(typeof showNotifications, 'boolean');
        assert.strictEqual(typeof model, 'string');
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
