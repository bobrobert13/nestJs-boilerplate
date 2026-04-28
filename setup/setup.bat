@echo off
REM ============================================
REM NestJS Boilerplate - Package Setup Launcher
REM ============================================
REM
REM Supported platforms:
REM   - Windows 10/11 (cmd.exe or PowerShell)
REM
REM Requirements:
REM   - Node.js 20+ installed
REM   - npm installed
REM
REM Usage:
REM   setup.bat          Interactive setup
REM   setup.bat --help  Show help
REM   setup.bat --list  List available packages
REM   setup.bat --reset Reset previous selection
REM
REM ============================================

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "SETUP_DIR=%SCRIPT_DIR%"

REM Colors (Windows cmd.exe)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "BOLD=[1m"
set "NC=[0m"

:show_help
echo.
echo %BOLD%%CYAN%NestJS Boilerplate - Package Setup%NC%
echo.
echo Usage: setup.bat [options]
echo.
echo Options:
echo   --help, -h     Show this help message
echo   --skip-env     Skip environment variable collection
echo   --list         List available packages
echo   --reset        Reset previous selection
echo.
echo Examples:
echo   setup.bat              Run full setup
echo   setup.bat --list       Show available packages
echo   setup.bat --reset      Clear saved selection
echo.
exit /b 0

:list_packages
echo.
echo %BOLD%%CYAN%Available Packages:%NC%
echo.

if not exist "%SETUP_DIR%package-config.json" (
    echo %RED%Error: package-config.json not found%NC%
    exit /b 1
)

where /q node
if errorlevel 1 (
    echo %RED%Error: Node.js is not installed%NC%
    echo Please install Node.js 20+ from https://nodejs.org/
    exit /b 1
)

node -e "const config = require('./package-config.json'); config.packages.forEach(pkg => { const selected = pkg.selected ? '%GREEN%[x]%NC%' : '%RED%[ ]%NC%'; console.log('  ' + selected + ' %BOLD%' + pkg.name + '%NC%'); console.log('       ' + pkg.description); console.log(''); });"

exit /b 0

:reset_selection
set "selection_file=%SETUP_DIR%selection.json"

if exist "%selection_file%" (
    del /q "%selection_file%"
    echo %GREEN%Selection reset successfully%NC%
) else (
    echo %YELLOW%No previous selection found%NC%
)
exit /b 0

REM Parse arguments
set "SKIP_ENV="
set "ARG=%~1"

if "%ARG%"=="" goto :main
if "%ARG%"=="--help" goto :show_help
if "%ARG%"=="-h" goto :show_help
if "%ARG%"=="--skip-env" (
    set "SKIP_ENV=true"
    goto :main
)
if "%ARG%"=="--list" goto :list_packages
if "%ARG%"=="--reset" goto :reset_selection

echo %RED%Unknown option: %ARG%%NC%
echo.
call :show_help
exit /b 1

:main
REM Check Node.js
where /q node
if errorlevel 1 (
    echo %RED%Error: Node.js is not installed%NC%
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VERSION=%%v"
set "NODE_VERSION=%NODE_VERSION:~1,2%"

if %NODE_VERSION% LSS 20 (
    echo %RED%Error: Node.js 20+ is required (found: %NODE_VERSION%)%NC%
    pause
    exit /b 1
)

echo.
echo %CYAN%============================================%NC%
echo %CYAN%  NestJS Boilerplate - Package Setup%NC%
echo %CYAN%============================================%NC%
echo.
echo Node.js: %GREEN%%NODE_VERSION%%NC%

where /q npm
if not errorlevel 1 (
    for /f "delims=" %%v in ('npm -v') do echo npm: %GREEN%%%v%NC%
)

REM Check if npm install is needed
if not exist "node_modules" (
    echo.
    echo %YELLOW%First time setup detected. Installing base dependencies...%NC%
    echo.
    call npm install --silent
)

echo.
echo %CYAN%Starting package setup wizard...%NC%
echo.

cd /d "%SETUP_DIR%"
call node setup.js

echo.
echo %GREEN%Setup wizard completed!%NC%
echo.

pause
