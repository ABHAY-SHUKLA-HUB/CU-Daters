# Health Check
try {
    Write-Host "Checking backend health..." -ForegroundColor Cyan
    $result = Invoke-RestMethod -Uri "https://cu-daters-backend.onrender.com/api/health" -TimeoutSec 10
    Write-Host "✅ Backend is RUNNING!" -ForegroundColor Green
    Write-Host $result | ConvertTo-Json
}
catch {
    Write-Host "❌ Backend is NOT responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
