#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * 
 * Documentation enforcement has been disabled; this installs a no-op pre-commit hook.
 * Run this after cloning the repository: node setup-git-hooks.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Git hooks...\n');

// Check if .git directory exists
const gitDir = path.join(__dirname, '.git');
if (!fs.existsSync(gitDir)) {
    console.error('❌ Error: .git directory not found.');
    console.error('   Make sure you are in the root of a Git repository.\n');
    process.exit(1);
}

// Create hooks directory if it doesn't exist
const hooksDir = path.join(gitDir, 'hooks');
if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    console.log('✅ Created .git/hooks directory');
}

// Pre-commit hook content
// Documentation enforcement was removed; commits no longer require CODE_DOCUMENTATION.md updates.
const preCommitHook = `#!/usr/bin/env node
process.exit(0);
`;


// Write pre-commit hook
const preCommitPath = path.join(hooksDir, 'pre-commit');
try {
    fs.writeFileSync(preCommitPath, preCommitHook, { mode: 0o755 });
    console.log('✅ Installed pre-commit hook');
    
    // Make executable (Unix/Mac)
    if (process.platform !== 'win32') {
        fs.chmodSync(preCommitPath, 0o755);
        console.log('✅ Made pre-commit hook executable');
    }
} catch (error) {
    console.error('❌ Error writing pre-commit hook:', error.message);
    process.exit(1);
}

// Success message
console.log('\n' + '='.repeat(60));
console.log('🎉 Git hooks installed!\n');
console.log('Documentation-update enforcement is disabled - commits are no longer blocked.');
console.log('='.repeat(60) + '\n');
console.log('✅ Setup complete! Happy coding! 📝\n');
