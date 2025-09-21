@echo off
echo Starting backend server...
start "Backend Server" cmd /k "node server.js"

timeout /t 2 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "node static-server.js"

echo.
echo Backend running on: http://localhost:3001
echo Frontend running on: http://localhost:8080
echo.
echo Press any key to close all servers...
pause >nul

echo Closing servers...
taskkill /F /FI "WINDOWTITLE eq Backend Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend Server*" >nul 2>&1
echo Done.