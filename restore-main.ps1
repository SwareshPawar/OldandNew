# PowerShell script to restore a backup of main.js
param(
    [int]$BackupNumber = 1,
    [string]$BackupDir = "backups"
)

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MainJsPath = Join-Path $ScriptDir "main.js"
$BackupDirPath = Join-Path $ScriptDir $BackupDir

# Check if backup directory exists
if (-not (Test-Path $BackupDirPath)) {
    Write-Host "Error: Backup directory not found at $BackupDirPath" -ForegroundColor Red
    exit 1
}

# Get available backups
$AvailableBackups = Get-ChildItem -Path $BackupDirPath -Filter "main_backup_*.js" | Sort-Object Name -Descending

if ($AvailableBackups.Count -eq 0) {
    Write-Host "Error: No backups found in $BackupDirPath" -ForegroundColor Red
    exit 1
}

# Display available backups
Write-Host "Available backups:" -ForegroundColor Cyan
for ($i = 0; $i -lt $AvailableBackups.Count; $i++) {
    $BackupFile = $AvailableBackups[$i]
    $BackupDate = $BackupFile.LastWriteTime
    $BackupSizeKB = [math]::Round($BackupFile.Length / 1KB, 2)
    
    $Index = $i + 1
    $Marker = if ($Index -eq $BackupNumber) { " <- SELECTED" } else { "" }
    $DateString = $BackupDate.ToString('yyyy-MM-dd HH:mm:ss')
    Write-Host "   $Index. $($BackupFile.Name) ($BackupSizeKB KB) - $DateString$Marker" -ForegroundColor Gray
}

# Validate backup number
if ($BackupNumber -lt 1 -or $BackupNumber -gt $AvailableBackups.Count) {
    Write-Host "`nError: Invalid backup number. Please choose between 1 and $($AvailableBackups.Count)" -ForegroundColor Red
    exit 1
}

# Get the selected backup
$SelectedBackup = $AvailableBackups[$BackupNumber - 1]
$SelectedBackupPath = $SelectedBackup.FullName

# Create a backup of current main.js before restoring
if (Test-Path $MainJsPath) {
    $PreRestoreTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $PreRestoreBackup = "main_pre_restore_$PreRestoreTimestamp.js"
    $PreRestoreBackupPath = Join-Path $BackupDirPath $PreRestoreBackup
    
    Copy-Item $MainJsPath $PreRestoreBackupPath -Force
    Write-Host "Current main.js backed up as: $PreRestoreBackup" -ForegroundColor Yellow
}

# Confirm restoration
Write-Host ""
Write-Host "WARNING: Are you sure you want to restore backup #$BackupNumber ($($SelectedBackup.Name))?" -ForegroundColor Yellow
$Confirmation = Read-Host "This will overwrite the current main.js. Type 'yes' to confirm"

if ($Confirmation -ne "yes") {
    Write-Host "Restoration cancelled." -ForegroundColor Red
    exit 0
}

# Restore the backup
try {
    Copy-Item $SelectedBackupPath $MainJsPath -Force
    Write-Host ""
    Write-Host "Successfully restored backup: $($SelectedBackup.Name)" -ForegroundColor Green
    
    # Display restored file info
    $RestoredSize = (Get-Item $MainJsPath).Length
    $RestoredSizeKB = [math]::Round($RestoredSize / 1KB, 2)
    Write-Host "   Restored file size: $RestoredSizeKB KB" -ForegroundColor Cyan
    
} catch {
    Write-Host "`nError restoring backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Your previous main.js has been saved as: $PreRestoreBackup" -ForegroundColor Cyan