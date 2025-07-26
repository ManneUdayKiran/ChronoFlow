@echo off
echo Starting ChronoFlow Backend Server...

:: Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH. Please install Python 3.8 or higher.
    exit /b 1
)

:: Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo Failed to create virtual environment.
        exit /b 1
    )
)

:: Activate virtual environment
call venv\Scripts\activate

:: Install requirements if needed
if not exist venv\Scripts\uvicorn.exe (
    echo Installing requirements...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo Failed to install requirements.
        exit /b 1
    )
)

:: Run the server
echo Starting server...
python run.py

pause