@echo off
REM MentalMap-Tool Deployment Script for Windows
REM Usage: deploy.bat [production|development]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=development

echo 🚀 MentalMap-Tool Deployment
echo Environment: %ENVIRONMENT%
echo Project: mentalmap-tool
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Create necessary directories
echo [INFO] Creating directories...
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads
if not exist "uploads\audio" mkdir uploads\audio
if not exist "logs" mkdir logs
if not exist "config" mkdir config
if not exist "ssl" mkdir ssl

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    copy env.example .env
    echo [WARNING] Please edit .env file with your configuration before running again.
    pause
    exit /b 0
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down 2>nul

REM Remove old images if in production
if "%ENVIRONMENT%"=="production" (
    echo [INFO] Cleaning up old images...
    docker-compose down --rmi all 2>nul
)

REM Build and start containers
echo [INFO] Building and starting containers...
docker-compose up -d --build

REM Wait for services to be ready
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Health check
echo [INFO] Performing health check...
set /a max_attempts=30
set /a attempt=1

:health_check_loop
curl -f http://localhost:3003/api/studies >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Health check passed!
    goto health_check_success
)

if %attempt% equ %max_attempts% (
    echo [ERROR] Health check failed after %max_attempts% attempts
    echo [ERROR] Check container logs: docker-compose logs
    exit /b 1
)

echo [INFO] Health check attempt %attempt%/%max_attempts% failed, retrying in 5 seconds...
timeout /t 5 /nobreak >nul
set /a attempt+=1
goto health_check_loop

:health_check_success

REM Display status
echo [INFO] Deployment completed successfully!
echo.
echo 📊 Service Information:
echo   Frontend: http://localhost:3003
echo   API: http://localhost:3003/api
echo   Health: http://localhost:3003/api/studies
echo.
echo 📁 Data Directories:
echo   Database: %cd%\data
echo   Uploads: %cd%\uploads
echo   Logs: %cd%\logs
echo.
echo 🔧 Management Commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Update services: docker-compose pull ^&^& docker-compose up -d
echo.

REM Create backup script
echo [INFO] Creating backup script...
(
echo @echo off
echo REM MentalMap-Tool Backup Script for Windows
echo.
echo set BACKUP_DIR=backups
echo set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
echo set TIMESTAMP=!TIMESTAMP: =0!
echo.
echo if not exist "%%BACKUP_DIR%%" mkdir %%BACKUP_DIR%%
echo.
echo echo 📦 Creating backup...
echo.
echo REM Backup database
echo if exist "data\mentalmap.db" ^(
echo     copy "data\mentalmap.db" "%%BACKUP_DIR%%\mentalmap_%%TIMESTAMP%%.db"
echo     echo ✅ Database backed up
echo ^)
echo.
echo REM Backup uploads
echo if exist "uploads" ^(
echo     powershell -command "Compress-Archive -Path 'uploads\*' -DestinationPath '%%BACKUP_DIR%%\uploads_%%TIMESTAMP%%.zip' -Force"
echo     echo ✅ Uploads backed up
echo ^)
echo.
echo REM Cleanup old backups ^(keep last 7 days^)
echo forfiles /p "%%BACKUP_DIR%%" /m "*.db" /d -7 /c "cmd /c del @path" 2^>nul
echo forfiles /p "%%BACKUP_DIR%%" /m "*.zip" /d -7 /c "cmd /c del @path" 2^>nul
echo.
echo echo ✅ Backup completed: %%BACKUP_DIR%%
) > backup.bat

echo [INFO] Backup script created: backup.bat

REM Create update script
echo [INFO] Creating update script...
(
echo @echo off
echo REM MentalMap-Tool Update Script for Windows
echo.
echo echo 🔄 Updating MentalMap-Tool...
echo.
echo REM Pull latest images
echo docker-compose pull
echo.
echo REM Rebuild and restart
echo docker-compose up -d --build
echo.
echo echo ✅ Update completed!
) > update.bat

echo [INFO] Update script created: update.bat

echo [INFO] 🎉 MentalMap-Tool is ready!
echo.
echo Next steps:
echo 1. Open http://localhost:3003 in your browser
echo 2. Create your first study
echo 3. Upload audio files if needed
echo 4. Start collecting data!
echo.
echo For support, check the README.md file.
echo.
pause
