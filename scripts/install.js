const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function installExtension() {
    try {
        console.log('🚀 Installing Promptious Optimizer Extension...');
        
        // Check if we're in the right directory
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json not found. Please run this script from the extension directory.');
        }

        // Install dependencies
        console.log('📦 Installing dependencies...');
        execSync('npm install', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });

        // Compile TypeScript
        console.log('🔨 Compiling TypeScript...');
        execSync('npm run compile', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });

        // Package the extension
        console.log('📦 Packaging extension...');
        execSync('npm run package', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });

        // Find the generated .vsix file
        const outDir = path.join(__dirname, '..');
        const files = fs.readdirSync(outDir);
        const vsixFile = files.find(file => file.endsWith('.vsix'));
        
        if (!vsixFile) {
            throw new Error('Failed to generate .vsix file');
        }

        const vsixPath = path.join(outDir, vsixFile);
        
        // Install the extension
        console.log('🔌 Installing extension in VS Code...');
        execSync(`code --install-extension "${vsixPath}"`, { stdio: 'inherit' });

        console.log('✅ Extension installed successfully!');
        console.log('🎉 You can now use the Promptious Optimizer in VS Code!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Open VS Code settings (Ctrl+,)');
        console.log('2. Search for "promptious"');
        console.log('3. Set your OpenAI API key');
        console.log('4. Configure the backend URL if needed');
        console.log('5. Start optimizing prompts!');
        
    } catch (error) {
        console.error('❌ Installation failed:', error.message);
        console.log('');
        console.log('Troubleshooting:');
        console.log('- Make sure you have Node.js and npm installed');
        console.log('- Ensure VS Code is installed and accessible via command line');
        console.log('- Check that you have write permissions in this directory');
        process.exit(1);
    }
}

// Check if running directly
if (require.main === module) {
    installExtension();
}

module.exports = { installExtension };
