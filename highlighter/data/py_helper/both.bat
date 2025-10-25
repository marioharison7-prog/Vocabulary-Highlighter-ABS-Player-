@echo off
REM ===========================
REM Auto-run batch script
REM ===========================

REM Path to your batch files
set "BATCH1=C:\xampp\New version\htdocs\english\data\py_helper\bat\test.bat"
set "BATCH2=C:\xampp\New version\htdocs\english\data\py_helper\bat\test2.bat"

REM --- Start the second batch file once ---
start "" "%BATCH2%"

:RESTART1
REM --- Run the first batch file ---
start "" /wait "%BATCH1%"

REM --- When it closes, restart it ---
echo %BATCH1% closed, restarting...
goto RESTART1
