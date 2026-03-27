# Test OTP on LOCAL backend
$testData = @{
    name = "Test User"
    email = "localtest$(Get-Random)@gmail.com"
    phone = "9999999999"
    password = "Test1234"
    college = "Local Community"
}

$json = $testData | ConvertTo-Json

Write-Host "Testing LOCAL backend..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:5000/api/auth/send-otp" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method POST -ContentType "application/json" -Body $json -TimeoutSec 10
    
    Write-Host "✅ SUCCESS! (200)" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Green
}
catch {
    $err = $_.Exception.Response
    if ($err) {
        $stream = $err.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $body = $reader.ReadToEnd()
        $reader.Dispose()
        
        $code = [int]$err.StatusCode
        $parsed = $body | ConvertFrom-Json
        
        Write-Host "Status: $code" -ForegroundColor Yellow
        Write-Host "Error: $($parsed.message)" -ForegroundColor Red
    } else {
        Write-Host "❌ Cannot connect to localhost:5000" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "" -ForegroundColor Gray
        Write-Host "Make sure backend is running:" -ForegroundColor Gray
        Write-Host "  npm run server" -ForegroundColor Gray
    }
}
