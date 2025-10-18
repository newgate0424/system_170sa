# ⚡ Quick Start Script for Windows PowerShell
# Run this script to set up your authentication system quickly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Admin Auth System - Quick Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Project directory confirmed" -ForegroundColor Green
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1/5: Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Setup environment
Write-Host "Step 2/5: Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env and update DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   Example: DATABASE_URL='mysql://root:password@localhost:3306/admin_auth'" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Have you configured your .env file? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please edit .env file and run this script again" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "Step 3/5: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Push database schema
Write-Host "Step 4/5: Creating database schema..." -ForegroundColor Yellow
Write-Host "Make sure your MySQL server is running and database exists!" -ForegroundColor Gray
$dbReady = Read-Host "Is your database ready? (y/n)"
if ($dbReady -eq "y") {
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database schema created!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to push schema" -ForegroundColor Red
        Write-Host "Please check your DATABASE_URL in .env" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Please create your database first:" -ForegroundColor Yellow
    Write-Host "  CREATE DATABASE admin_auth;" -ForegroundColor Gray
    exit 0
}
Write-Host ""

# Step 5: Create admin user
Write-Host "Step 5/5: Creating admin user..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this SQL in your MySQL database:" -ForegroundColor Cyan
Write-Host @"
USE admin_auth;

INSERT INTO User (id, username, password, role, teams, isLocked, createdAt, updatedAt)
VALUES (
  'admin001',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5i4I3NqqMbzIi',
  'ADMIN',
  '[]',
  false,
  NOW(),
  NOW()
);
"@ -ForegroundColor White
Write-Host ""
$userCreated = Read-Host "Have you created the admin user? (y/n)"
if ($userCreated -ne "y") {
    Write-Host "Please create the admin user and run 'npm run dev' when ready" -ForegroundColor Yellow
    exit 0
}
Write-Host ""

# All done!
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your authentication system is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then visit:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember to change the admin password after first login!" -ForegroundColor Yellow
Write-Host ""

$startNow = Read-Host "Start development server now? (y/n)"
if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "Starting server..." -ForegroundColor Green
    npm run dev
}
