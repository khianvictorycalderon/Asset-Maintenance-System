@echo off
title PostgreSQL - Update Revocation Status

echo ==========================================
echo    PostgreSQL Revocation Status Update
echo ==========================================
echo.

set /p DB_HOST=Enter PostgreSQL host [localhost]: 
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT=Enter PostgreSQL port [5432]: 
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME=Enter database name: 
set /p DB_USER=Enter username: 
set /p DB_PASSWORD=Enter password: 

echo.
echo Connecting to PostgreSQL...
echo.

set "PGPASSWORD=%DB_PASSWORD%"

psql -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "UPDATE users SET revocation_status = 'Active' WHERE revocation_status IS NULL OR revocation_status = '';"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Successfully updated revocation statuses.
) else (
    echo.
    echo Failed to update revocation statuses.
)

set "PGPASSWORD="

echo.
pause