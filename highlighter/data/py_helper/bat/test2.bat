@echo off
cd /d "C:\xampp\New version\htdocs\english\data\py_helper"

:LOOP
echo Running databaseinput.py...
python databaseinput.py

echo databaseinput.py closed. Restarting in 3 seconds...
timeout /t 3 >nul
goto LOOP
