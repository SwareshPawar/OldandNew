#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * 
 * This script installs Git hooks that enforce documentation standards.
 * Run this after cloning the repository: node setup-git-hooks.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Git hooks for documentation enforcement...\n');

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
const preCommitHook = `#!/usr/bin/env node

/**
 * Pre-commit Git Hook
 * 
 * This hook checks if CODE_DOCUMENTATION.md was updated when code files are modified.
 * Ensures the Documentation Maintenance Hook is followed.
 */

const { execSync } = require('child_process');
const readline = require('readline');

// ANSI color codes
const colors = {
    reset: '\\x1b[0m',
    red: '\\x1b[31m',
    yellow: '\\x1b[33m',
    green: '\\x1b[32m',
    cyan: '\\x1b[36m',
    bold: '\\x1b[1m'
};

console.log(\`\\n\${colors.cyan}\${colors.bold}📝 Documentation Maintenance Hook\${colors.reset}\\n\`);

// Get list of staged files
let stagedFiles;
try {
    stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim().split('\\n').filter(Boolean);
} catch (error) {
    console.error(\`\${colors.red}❌ Error getting staged files\${colors.reset}\`);
    process.exit(1);
}

if (stagedFiles.length === 0) {
    console.log(\`\${colors.yellow}⚠️  No files staged for commit\${colors.reset}\\n\`);
    process.exit(0);
}

// Check if code files were modified
const codeFilePatterns = [
    /\\.js$/,
    /\\.html$/,
    /\\.css$/,
    /server\\.js$/,
    /main\\.js$/,
    /\\.json$/ // package.json, manifest.json, etc.
];

const modifiedCodeFiles = stagedFiles.filter(file => 
    codeFilePatterns.some(pattern => pattern.test(file))
);

// Filter out generated/minified/test files that don't need documentation
const excludedPatterns = [
    /node_modules/,
    /\\.min\\./,
    /^test-/,
    /package-lock\\.json/,
    /-test\\.js$/
];

const significantCodeFiles = modifiedCodeFiles.filter(file => 
    !excludedPatterns.some(pattern => pattern.test(file))
);

if (significantCodeFiles.length === 0) {
    console.log(\`\${colors.green}✅ No significant code changes - documentation update not required\${colors.reset}\\n\`);
    process.exit(0);
}

// Check if CODE_DOCUMENTATION.md was also staged
const docFileStaged = stagedFiles.includes('CODE_DOCUMENTATION.md');

console.log(\`\${colors.yellow}⚠️  Code files modified:\${colors.reset}\`);
significantCodeFiles.forEach(file => console.log(\`   - \${file}\`));
console.log();

if (!docFileStaged) {
    console.log(\`\${colors.red}\${colors.bold}❌ CODE_DOCUMENTATION.md is NOT staged!\${colors.reset}\\n\`);
    console.log(\`\${colors.yellow}This commit modifies code but doesn't update documentation.\${colors.reset}\`);
    console.log(\`\${colors.yellow}According to the Documentation Maintenance Hook, you must:\${colors.reset}\\n\`);
    console.log('   1. Update CODE_DOCUMENTATION.md with your changes');
    console.log('   2. Stage it: git add CODE_DOCUMENTATION.md');
    console.log('   3. Try committing again\\n');
    console.log(\`\${colors.cyan}Or, if documentation is not needed (rare):\${colors.reset}\`);
    console.log('   git commit --no-verify\\n');
    process.exit(1);
}

// CODE_DOCUMENTATION.md is staged - verify it was actually modified
try {
    const docDiff = execSync('git diff --cached CODE_DOCUMENTATION.md', { encoding: 'utf-8' });
    
    if (!docDiff || docDiff.trim().length === 0) {
        console.log(\`\${colors.red}\${colors.bold}❌ CODE_DOCUMENTATION.md is staged but unchanged!\${colors.reset}\\n\`);
        console.log(\`\${colors.yellow}You staged the documentation file, but didn't modify it.\${colors.reset}\`);
        console.log(\`\${colors.yellow}Please document your changes before committing.\\n\${colors.reset}\`);
        process.exit(1);
    }
    
    // Check if version or timestamp was updated
    const hasVersionUpdate = /^[+-].*Version.*\\d+\\.\\d+/m.test(docDiff);
    const hasTimestampUpdate = /^[+-].*Last Updated:/m.test(docDiff);
    
    if (!hasVersionUpdate && !hasTimestampUpdate) {
        console.log(\`\${colors.yellow}⚠️  Warning: Version/timestamp may not be updated\${colors.reset}\`);
        console.log(\`\${colors.yellow}   Consider updating the version number and "Last Updated" field\\n\${colors.reset}\`);
    }
    
} catch (error) {
    // File might be new or error getting diff - allow commit
    console.log(\`\${colors.yellow}⚠️  Could not verify documentation changes\${colors.reset}\\n\`);
}

// Ask for confirmation
console.log(\`\${colors.green}✅ CODE_DOCUMENTATION.md is staged and modified\${colors.reset}\\n\`);
console.log(\`\${colors.cyan}\${colors.bold}Documentation Checklist:\${colors.reset}\`);
console.log('   ✓ Problem/requirement documented?');
console.log('   ✓ Files modified with line numbers listed?');
console.log('   ✓ Solution approach explained?');
console.log('   ✓ Code snippets for critical changes included?');
console.log('   ✓ Testing instructions added?');
console.log('   ✓ Version number updated?');
console.log('   ✓ "Last Updated" timestamp updated?\\n');

// Create readline interface for user confirmation
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(\`\${colors.yellow}Have you completed the documentation? (y/n): \${colors.reset}\`, (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log(\`\\n\${colors.green}\${colors.bold}✅ Documentation verified - proceeding with commit\${colors.reset}\\n\`);
        process.exit(0);
    } else {
        console.log(\`\\n\${colors.red}\${colors.bold}❌ Commit cancelled\${colors.reset}\`);
        console.log(\`\${colors.yellow}Please complete documentation and try again\${colors.reset}\\n\`);
        process.exit(1);
    }
});
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
console.log('🎉 Git hooks successfully installed!\n');
console.log('What happens now:');
console.log('  1. When you commit code changes, the hook runs automatically');
console.log('  2. It checks if CODE_DOCUMENTATION.md was also updated');
console.log('  3. It verifies documentation was actually modified');
console.log('  4. It asks you to confirm documentation is complete');
console.log('  5. Only then does it allow the commit\n');
console.log('To bypass (use sparingly): git commit --no-verify');
console.log('='.repeat(60) + '\n');
console.log('✅ Setup complete! Happy coding (and documenting)! 📝\n');
