# SB-OMNICORE MCP Server Deployment Script for Windows
# This script loads environment variables from .env file and deploys to AWS Lambda

Write-Host "🚀 SB-OMNICORE MCP Server Deployment" -ForegroundColor Green

# SB-OMNICORE V2 uses only Layer A tools (no OpenAI API required)
Write-Host "📋 SB-OMNICORE V2 - Enhanced Layer A Tools Only" -ForegroundColor Yellow
Write-Host "✅ No external API keys required for this deployment" -ForegroundColor Green

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
Write-Host "Your SB-OMNICORE MCP Server is now live with enhanced tools!" -ForegroundColor Cyan 