@echo off
title Launch OmniRank in Chrome
echo ========================================================
echo   Launching Google Chrome with OmniRank Extension
echo   Amazon * Flipkart * Google | Engineered by tarikislam.in
echo ========================================================
echo.
echo Extension Path: %~dp0src
echo Target URL: https://www.amazon.in
echo.

set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

if not exist %CHROME% (
    echo [ERROR] Google Chrome was not found in standard paths.
    echo Please install Chrome or load the 'src' folder manually via chrome://extensions/
    pause
    exit /b 1
)

echo Starting Chrome with OmniRank...
start "" %CHROME% --load-extension="%~dp0src" "https://www.amazon.in"

echo.
echo Chrome started! Click the puzzle icon or the OmniRank icon in the toolbar.
echo.
timeout /t 5
