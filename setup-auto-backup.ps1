# Setup script to configure automatic main.js backup on Git commits
Write-Host "Setting up automatic main.js backup on Git commits..." -ForegroundColor Cyan

# Check if we're in a Git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a Git repository. Please run this from the repository root." -ForegroundColor Red
    exit 1
}

# Check if backup script exists
$backupScript = "backup-main.ps1"
if (-not (Test-Path $backupScript)) {
    Write-Host "❌ Error: $backupScript not found. Please ensure the backup script is in the repository root." -ForegroundColor Red
    exit 1
}

# Ensure the hooks directory exists
$hooksDir = ".git/hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
    Write-Host "✅ Created Git hooks directory" -ForegroundColor Green
}

# Check if pre-commit hook already exists and is not ours
$preCommitHook = Join-Path $hooksDir "pre-commit"
if (Test-Path $preCommitHook) {
    $existingContent = Get-Content $preCommitHook -Raw -ErrorAction SilentlyContinue
    if ($existingContent -and ($existingContent -notmatch "main\.js.*backup")) {
        # Backup existing hook
        $backupHook = "$preCommitHook.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $preCommitHook $backupHook
        Write-Host "Backed up existing pre-commit hook to: $(Split-Path $backupHook -Leaf)" -ForegroundColor Yellow
    }
}

# Test the backup script
Write-Host "Testing backup script..." -ForegroundColor Cyan
try {
    & ".\$backupScript"
    Write-Host "✅ Backup script test successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Backup script test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Please fix the backup script before proceeding." -ForegroundColor Yellow
    exit 1
}

# Configure Git to use hooks (in case it's disabled)
try {
    git config core.hooksPath .git/hooks
    Write-Host "✅ Git hooks enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not configure Git hooks path. Hooks should still work." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup Complete! Automatic main.js backup is now configured." -ForegroundColor Green
Write-Host ""
Write-Host "How it works:" -ForegroundColor Cyan
Write-Host "   - When you commit changes that include main.js" -ForegroundColor Gray
Write-Host "   - Git will automatically run backup-main.ps1" -ForegroundColor Gray
Write-Host "   - A timestamped backup will be created in backups/" -ForegroundColor Gray
Write-Host "   - Only then will the commit proceed" -ForegroundColor Gray
Write-Host ""
Write-Host "Test it:" -ForegroundColor Cyan
Write-Host "   git add main.js" -ForegroundColor Gray
Write-Host "   git commit -m 'test automatic backup'" -ForegroundColor Gray
Write-Host ""
Write-Host "To disable: delete or rename .git/hooks/pre-commit" -ForegroundColor Yellow