# PowerShell Script to update the MySQL database with user approval functionality
# This script will add the required columns to the users table

Write-Host "Mental Maps Database Update Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your database configuration." -ForegroundColor Yellow
    Write-Host "You can copy from env.example and modify the values." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "Host: $DB_HOST" -ForegroundColor White
Write-Host "User: $DB_USER" -ForegroundColor White
Write-Host "Database: $DB_NAME" -ForegroundColor White
Write-Host ""

# Check if mysql command is available
try {
    mysql --version | Out-Null
} catch {
    Write-Host "Error: MySQL client not found!" -ForegroundColor Red
    Write-Host "Please install MySQL client or use the SQL script manually." -ForegroundColor Yellow
    Write-Host "You can run the update_database.sql file directly in your MySQL client." -ForegroundColor Yellow
    exit 1
}

Write-Host "Updating database schema..." -ForegroundColor Yellow

# Execute the SQL script
try {
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
        ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT TRUE;
        DESCRIBE users;
        SELECT 'Database updated successfully!' as Status;
    "
    
    Write-Host ""
    Write-Host "Database update completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your application server" -ForegroundColor White
    Write-Host "2. Test the new user registration and approval functionality" -ForegroundColor White
    Write-Host "3. Check the admin interface for user management" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "Error updating database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual alternative:" -ForegroundColor Yellow
    Write-Host "Run the update_database.sql file manually in your MySQL client." -ForegroundColor White
    exit 1
}