# Simple OTP Test - PowerShell
# Run: powershell -ExecutionPolicy Bypass -File test-otp-simple.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OTP ENDPOINT TEST" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test URL
$url = "https://cu-daters-backend.onrender.com/api/auth/send-otp"

# Test data
$testData = @{
    name = "Test User"
    email = "test$(Get-Random)@gmail.com"
    phone = "9999999999"
    password = "Test123"
    college = "Local Community"
}

$json = $testData | ConvertTo-Json

Write-Host "Testing: $url" -ForegroundColor Yellow
Write-Host ""
Write-Host "Sending data:" -ForegroundColor Cyan
Write-Host $json -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $json -TimeoutSec 15
    
    $status = $response.StatusCode
    $body = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: $status" -ForegroundColor White
    Write-Host ""
    
    if ($status -eq 200) {
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "Message: $($body.message)" -ForegroundColor Green
    } else {
        Write-Host "Status: $status" -ForegroundColor Yellow
        Write-Host $body -ForegroundColor Yellow
    }
}
catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $status = [int]$errorResponse.StatusCode
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd() | ConvertFrom-Json
        $reader.Dispose()
        
        Write-Host "Status: $status" -ForegroundColor White
        Write-Host ""
        
        if ($status -eq 400) {
            Write-Host "❌ 400 BAD REQUEST" -ForegroundColor Red
            Write-Host "Error: $($body.message)" -ForegroundColor Red
        } elseif ($status -eq 429) {
            Write-Host "⏱️  429 RATE LIMITED" -ForegroundColor Yellow
            Write-Host "Message: $($body.message)" -ForegroundColor Yellow
        } elseif ($status -eq 503) {
            Write-Host "🚨 503 SERVICE ERROR" -ForegroundColor Red
            Write-Host "Message: $($body.message)" -ForegroundColor Red
        } else {
            Write-Host "Status: $status" -ForegroundColor Yellow
            Write-Host $body -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ CONNECTION ERROR" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
