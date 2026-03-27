$testData = @{
    name = "Test User"
    email = "test@example.com"
    phone = "9999999999"
    password = "Test123"
    college = "Local Community"
} | ConvertTo-Json

Write-Host "`n📧 Testing OTP Endpoint (Local Backend)`n" -ForegroundColor Cyan

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/send-otp" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $testData `
  -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Status: $($_.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $_.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
