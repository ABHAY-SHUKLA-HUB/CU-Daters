# Test Email Delivery
Write-Host "Testing email delivery..."

$json = @{
    email = "test@gmail.com"
    name = "Test User" 
    password = "Test1234"
    phone = "9999999999"
    college = "Local Community"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" `
        -Method POST `
        -Body $json `
        -ContentType "application/json" `
        -TimeoutSec 5 `
        -UseBasicParsing
    
    Write-Host "✅ Response received:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
    Write-Host "`nWaiting 2 seconds for background email to send..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    Write-Host "Check your inbox at: test@gmail.com" -ForegroundColor Yellow
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
