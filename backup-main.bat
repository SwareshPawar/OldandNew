@echo off
REM Windows batch file to backup main.js (alternative to PowerShell)

set "BACKUP_DIR=backups"
set "MAX_BACKUPS=5"

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo Created backup directory: %BACKUP_DIR%
)

REM Check if main.js exists
if not exist "main.js" (
    echo Error: main.js not found
    pause
    exit /b 1
)

REM Generate timestamp for backup filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
set "backup_file=main_backup_%timestamp%.js"

REM Create the backup
copy "main.js" "%BACKUP_DIR%\%backup_file%" >nul
if %errorlevel% neq 0 (
    echo Error creating backup
    pause
    exit /b 1
)

echo ✅ Backup created: %backup_file%

REM Clean up old backups (keep only 5 most recent)
REM This is a simplified version - the PowerShell script is more robust

echo.
echo 📁 Backup completed successfully!
echo 💡 Use restore-main.ps1 to restore a backup if needed
echo.
pause