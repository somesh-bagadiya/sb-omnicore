# Portfolio MCP Server Deployment Script for Windows
# This script loads environment variables from .env file and deploys to AWS Lambda

Write-Host "🚀 Portfolio MCP Server Deployment" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your OPENAI_API_KEY" -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env file
Write-Host "📄 Loading environment variables from .env file..." -ForegroundColor Yellow
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        Write-Host "✅ Loaded: $name" -ForegroundColor Green
    }
}

# Verify OPENAI_API_KEY is loaded
$apiKey = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "Process")
if (-not $apiKey) {
    Write-Host "❌ Error: OPENAI_API_KEY not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ OpenAI API Key loaded successfully" -ForegroundColor Green

# Build the project
Write-Host "🔨 Building TypeScript project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to AWS Lambda
Write-Host "🚀 Deploying to AWS Lambda..." -ForegroundColor Yellow
npx serverless deploy --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your Portfolio MCP Server is now live with AI-powered tools!" -ForegroundColor Cyan 