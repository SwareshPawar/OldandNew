# Main.js Backup System

This backup system helps you safely manage changes to main.js by maintaining historical versions.

## Files

- `backup-main.ps1` - PowerShell script to create backups
- `backup-main.bat` - Windows batch alternative (simpler)
- `restore-main.ps1` - PowerShell script to restore backups
- `setup-auto-backup.ps1` - Configure automatic backups on Git commits
- `.git/hooks/pre-commit` - Git hook for automatic backups
- `backups/` - Directory containing backup files

## Automatic Backups (Recommended)

**✅ CONFIGURED**: Automatic backups are now enabled! Backups happen automatically when you commit changes to main.js.

### Setup Automatic Backups

If not already configured, run:

```powershell
.\setup-auto-backup.ps1
```

This creates a Git pre-commit hook that automatically backs up main.js before every commit.

### Manual Backups

You can also create backups manually:

```powershell
.\backup-main.ps1
```

This will:
- Create a timestamped backup in the `backups/` folder
- Keep only the 5 most recent backups (auto-cleanup)
- Show current backup status

### Restoring a Backup

To restore a previous version:

```powershell
.\restore-main.ps1
```

Or restore a specific backup number:

```powershell
.\restore-main.ps1 -BackupNumber 2
```

This will:
- Show all available backups
- Backup your current main.js before restoring
- Restore the selected backup

### Alternative (Windows Batch)

If PowerShell isn't available, use the batch file:

```cmd
backup-main.bat
```

## Backup File Format

Backups are named: `main_backup_YYYY-MM-DD_HH-MM-SS.js`

Example: `main_backup_2025-12-18_12-20-19.js`

## Best Practices

1. **Always backup before making changes**
2. **Test your changes** after editing main.js
3. **Keep backups organized** - the system auto-manages 5 versions
4. **Document major changes** in your commit messages

## Workflow Examples

### Automatic Workflow (Recommended)
```powershell
# 1. Make your changes to main.js
# ... edit main.js ...

# 2. Test your changes
# ... test the application ...

# 3. Commit (backup happens automatically!)
git add main.js
git commit -m "Updated song preview functionality"
# 🔄 Detected main.js changes, creating backup...
# ✅ Backup completed successfully
# 📝 Proceeding with commit...

# 4. If something goes wrong, restore
.\restore-main.ps1 -BackupNumber 1
```

### Manual Workflow
```powershell
# 1. Create backup before changes
.\backup-main.ps1

# 2. Make your changes to main.js
# ... edit main.js ...

# 3. Test your changes
# ... test the application ...

# 4. If something goes wrong, restore
.\restore-main.ps1 -BackupNumber 1
```

## Disabling Automatic Backups

To disable automatic backups:
```powershell
Remove-Item .git\hooks\pre-commit
```

To re-enable:
```powershell
.\setup-auto-backup.ps1
```

The system ensures you never lose working code and can quickly recover from issues!