@echo off
cd /d "C:\xampp\New version\htdocs\english\data\py_helper"
:RUN_SCRIPT
python organize.py

echo.
echo Press R to restart the script, or any other key to exit.
choice /c R /n /m "Press R to restart..."
if errorlevel 1 goto RUN_SCRIPT

echo Script exited.
pause
