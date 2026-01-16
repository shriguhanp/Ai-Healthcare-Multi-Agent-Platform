# Quick script to fix Ollama issues
Write-Host "=== Ollama Troubleshooting Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop Ollama processes
Write-Host "Step 1: Stopping Ollama processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*ollama*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "✓ Ollama processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for Ollama to restart
Write-Host "Step 2: Waiting for Ollama to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: Test Ollama
Write-Host "Step 3: Testing Ollama connection..." -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Ollama is running!" -ForegroundColor Green
    Write-Host ""
    
    # Step 4: Try to re-pull models
    Write-Host "Step 4: Re-pulling models (this may take a while)..." -ForegroundColor Yellow
    Write-Host "Attempting to re-pull mistral:latest..." -ForegroundColor Gray
    
    # Remove and re-pull mistral
    ollama rm mistral:latest 2>&1 | Out-Null
    ollama pull mistral:latest
    
    Write-Host ""
    Write-Host "✓ Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now test with: ollama run mistral:latest 'Hello'" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Ollama is not responding. Please:" -ForegroundColor Red
    Write-Host "  1. Make sure Ollama is installed" -ForegroundColor Yellow
    Write-Host "  2. Start Ollama manually: ollama serve" -ForegroundColor Yellow
    Write-Host "  3. Check if port 11434 is available" -ForegroundColor Yellow
}

