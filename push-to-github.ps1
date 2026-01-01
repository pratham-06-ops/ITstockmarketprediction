# PowerShell script to push project to GitHub
# Make sure Git is installed before running this script

$REPO_URL = "https://github.com/pratham-06-ops/AI-Based-Stock-Market-Prediction-Trading-Analysis-System.git"
$BRANCH = "main"

Write-Host "🚀 Pushing project to GitHub..." -ForegroundColor Cyan
Write-Host "Repository: $REPO_URL" -ForegroundColor Yellow
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or install using winget: winget install Git.Git" -ForegroundColor Yellow
    exit 1
}

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

# Check if remote exists
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔗 Adding remote repository..." -ForegroundColor Cyan
    git remote add origin $REPO_URL
    Write-Host "✅ Remote added" -ForegroundColor Green
} else {
    Write-Host "🔄 Updating remote URL..." -ForegroundColor Cyan
    git remote set-url origin $REPO_URL
    Write-Host "✅ Remote URL updated" -ForegroundColor Green
}

# Add all files
Write-Host "📝 Adding files to staging area..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Cyan
    git commit -m "Initial commit: AI-Based Stock Market Prediction Trading Analysis System"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
}

# Check current branch
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    Write-Host "🌿 Creating main branch..." -ForegroundColor Cyan
    git checkout -b $BRANCH
    Write-Host "✅ Branch '$BRANCH' created" -ForegroundColor Green
} else {
    Write-Host "✅ Current branch: $currentBranch" -ForegroundColor Green
}

# Push to GitHub
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "⚠️  You may be prompted for credentials" -ForegroundColor Yellow

try {
    git push -u origin $BRANCH
    Write-Host ""
    Write-Host "🎉 Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository URL: $REPO_URL" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Error pushing to GitHub" -ForegroundColor Red
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Authentication required - use GitHub credentials or personal access token" -ForegroundColor Yellow
    Write-Host "2. If using personal access token, use it as password when prompted" -ForegroundColor Yellow
    Write-Host "3. Make sure you have push access to the repository" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create a personal access token:" -ForegroundColor Cyan
    Write-Host "1. Go to GitHub Settings > Developer settings > Personal access tokens" -ForegroundColor White
    Write-Host "2. Generate a new token with 'repo' permissions" -ForegroundColor White
    Write-Host "3. Use the token as your password when prompted" -ForegroundColor White
    exit 1
}

