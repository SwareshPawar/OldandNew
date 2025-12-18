# PowerShell script to backup main.js and maintain 5 historical versions
param(
    [string]$BackupDir = "backups",
    [int]$MaxBackups = 5
)

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MainJsPath = Join-Path $ScriptDir "main.js"
$BackupDirPath = Join-Path $ScriptDir $BackupDir

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDirPath)) {
    New-Item -ItemType Directory -Path $BackupDirPath -Force | Out-Null
    Write-Host "Created backup directory: $BackupDirPath" -ForegroundColor Green
}

# Check if main.js exists
if (-not (Test-Path $MainJsPath)) {
    Write-Host "Error: main.js not found at $MainJsPath" -ForegroundColor Red
    exit 1
}

# Generate timestamp for backup filename
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFileName = "main_backup_$Timestamp.js"
$BackupFilePath = Join-Path $BackupDirPath $BackupFileName

# Create the backup
try {
    Copy-Item $MainJsPath $BackupFilePath -Force
    Write-Host "Backup created: $BackupFileName" -ForegroundColor Green
    
    # Get file size for display
    $FileSize = (Get-Item $BackupFilePath).Length
    $FileSizeKB = [math]::Round($FileSize / 1KB, 2)
    Write-Host "   Size: $FileSizeKB KB" -ForegroundColor Cyan
} catch {
    Write-Host "Error creating backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clean up old backups (keep only the most recent $MaxBackups)
$ExistingBackups = Get-ChildItem -Path $BackupDirPath -Filter "main_backup_*.js" | Sort-Object Name -Descending

if ($ExistingBackups.Count -gt $MaxBackups) {
    $BackupsToDelete = $ExistingBackups | Select-Object -Skip $MaxBackups
    
    foreach ($BackupToDelete in $BackupsToDelete) {
        Remove-Item $BackupToDelete.FullName -Force
        Write-Host "Removed old backup: $($BackupToDelete.Name)" -ForegroundColor Yellow
    }
}

# Display current backup status
Write-Host ""
Write-Host "Current backups:" -ForegroundColor Cyan
$CurrentBackups = Get-ChildItem -Path $BackupDirPath -Filter "main_backup_*.js" | Sort-Object Name -Descending
for ($i = 0; $i -lt $CurrentBackups.Count; $i++) {
    $BackupFile = $CurrentBackups[$i]
    $BackupPath = $BackupFile.FullName
    $BackupDate = $BackupFile.LastWriteTime
    $BackupSizeKB = [math]::Round($BackupFile.Length / 1KB, 2)
    
    $Index = $i + 1
    $DateString = $BackupDate.ToString('yyyy-MM-dd HH:mm:ss')
    Write-Host "   $Index. $($BackupFile.Name) ($BackupSizeKB KB) - $DateString" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Backup completed successfully! You can now safely make changes to main.js" -ForegroundColor Green
Write-Host "To restore a backup, use: .\restore-main.ps1" -ForegroundColor Cyan