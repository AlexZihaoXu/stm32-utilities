@echo off
REM STM32 Utilities - Windows Deploy Script

echo.
echo ==========================================
echo  STM32 Utilities - Deployment Script
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose found
echo.

REM Stop and remove existing container if it exists
echo Checking for existing containers...
docker ps -a -q -f name=stm32-utilities >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Stopping and removing existing container...
    docker-compose down
)

REM Remove old images
docker images -q stm32-utilities_stm32-utilities >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Removing old image...
    docker rmi stm32-utilities_stm32-utilities
)

echo.
echo [BUILD] Building Docker image...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [DEPLOY] Starting container...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start container!
    pause
    exit /b 1
)

echo.
echo Waiting for application to start...
timeout /t 3 /nobreak >nul

REM Check if container is running
docker ps -q -f name=stm32-utilities >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo  [SUCCESS] Deployment Complete!
    echo ==========================================
    echo.
    echo Application is running at: http://localhost:3000
    echo.
    echo Useful commands:
    echo   - View logs:  docker-compose logs -f
    echo   - Stop:       docker-compose down
    echo   - Restart:    docker-compose restart
    echo.
) else (
    echo.
    echo [ERROR] Deployment failed. Check logs with: docker-compose logs
    pause
    exit /b 1
)

pause
