# OTP Endpoint Test - PowerShell Script
# Usage: powershell -ExecutionPolicy Bypass -File test-otp-400.ps1

Write-Host "`n🧪 OTP 400 ERROR DIAGNOSTIC TEST`n" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Endpoint to test
$endpoint = "https://cu-daters-backend.onrender.com/api/auth/send-otp"
$localEndpoint = "http://localhost:5000/api/auth/send-otp"

# Test data - Valid format
@{
    name = "Test User"
    email = "testuser$(Get-Random)@gmail.com"
    phone = "9999999999"
    password = "Test123"
    college = "Local Community"
} | ConvertTo-Json | Set-Variable -Name "validPayload"

Write-Host "📝 Test Payload:" -ForegroundColor Yellow
Write-Host $validPayload -ForegroundColor Gray
Write-Host ""

function Test-OTPEndpoint {
    param(
        [string]$Endpoint,
        [string]$EndpointName,
        [string]$Payload,
        [hashtable]$TestCase
    )
    
    Write-Host "🔍 Testing: $EndpointName" -ForegroundColor Cyan
    Write-Host "URL: $Endpoint" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $Response = Invoke-WebRequest -Uri $Endpoint `
            -Method POST `
            -ContentType "application/json" `
            -Body $Payload `
            -TimeoutSec 15 `
            -SkipHttpErrorCheck
        
        $StatusCode = $Response.StatusCode
        $Content = $Response.Content | ConvertFrom-Json
        
        Write-Host "Status Code: $StatusCode" -ForegroundColor White
        
        if ($StatusCode -eq 200) {
            Write-Host "✅ SUCCESS" -ForegroundColor Green
            Write-Host "Message: $($Content.message)" -ForegroundColor Green
            if ($Content.data) {
                Write-Host "Response Data:" -ForegroundColor Green
                $Content.data | ForEach-Object {
                    Write-Host "  - $(($_.PSObject.Properties | %{$_.Name + ': ' + $_.Value}) -join ', ')" -ForegroundColor Green
                }
            }
        } elseif ($StatusCode -eq 400) {
            Write-Host "❌ 400 BAD REQUEST" -ForegroundColor Red
            Write-Host "Error: $($Content.message)" -ForegroundColor Red
            Write-Host "`n🔧 DIAGNOSIS:" -ForegroundColor Yellow
            
            # Analyze the error
            $errorMsg = $Content.message.ToLower()
            if ($errorMsg -like "*password*") {
                Write-Host "  → Password format invalid" -ForegroundColor Yellow
                Write-Host "  → Required: 8+ chars, uppercase, lowercase, digit" -ForegroundColor Yellow
                Write-Host "  → Example that WORKS: Test123, Password1" -ForegroundColor Yellow
            } elseif ($errorMsg -like "*email*") {
                Write-Host "  → Email format invalid" -ForegroundColor Yellow
                Write-Host "  → Required: something@domain.com" -ForegroundColor Yellow
            } elseif ($errorMsg -like "*phone*") {
                Write-Host "  → Phone format invalid" -ForegroundColor Yellow
                Write-Host "  → Required: Exactly 10 digits" -ForegroundColor Yellow
            } elseif ($errorMsg -like "*name*") {
                Write-Host "  → Name is missing or too short" -ForegroundColor Yellow
                Write-Host "  → Required: 2+ characters" -ForegroundColor Yellow
            } elseif ($errorMsg -like "*college*") {
                Write-Host "  → College/Community not selected" -ForegroundColor Yellow
                Write-Host "  → Options: Local Community, Independent / Not Listed, etc." -ForegroundColor Yellow
            }
        } elseif ($StatusCode -eq 429) {
            Write-Host "⏱️  429 TOO MANY REQUESTS" -ForegroundColor Yellow
            Write-Host "Message: $($Content.message)" -ForegroundColor Yellow
        } elseif ($StatusCode -eq 503) {
            Write-Host "🚨 503 SERVICE UNAVAILABLE" -ForegroundColor Red
            Write-Host "Message: $($Content.message)" -ForegroundColor Red
            Write-Host "Likely cause: Email service misconfigured or down" -ForegroundColor Red
        } else {
            Write-Host "⚠️  Status: $StatusCode" -ForegroundColor Yellow
            Write-Host $Content -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ CONNECTION ERROR" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
        if ($Endpoint -like "*localhost*") {
            Write-Host "💡 Tip: Make sure local backend is running (npm run server)" -ForegroundColor Yellow
        } else {
            Write-Host "💡 Tip: Check internet connection or Render backend status" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n" -ForegroundColor Gray
}

# Run tests
Write-Host "RUNNING TESTS`n" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Magenta
Write-Host ""

# Test 1: Valid request to production
Test-OTPEndpoint -Endpoint $endpoint -EndpointName "PRODUCTION - Valid Request"  -Payload $validPayload

# Test 2: Check if production endpoint even responds
Write-Host "Checking if backend is running..." -ForegroundColor Yellow
try {
    $Health = Invoke-RestMethod -Uri "https://cu-daters-backend.onrender.com/api/health" -TimeoutSec 10
    Write-Host "✅ Backend is online" -ForegroundColor Green
    Write-Host "Status: $($Health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not responding" -ForegroundColor Red
    Write-Host "Fix: Deploy backend to Render" -ForegroundColor Red
}

Write-Host ""

# Test various invalid payloads
Write-Host "=" * 50 -ForegroundColor Magenta
Write-Host "TESTING INVALID PAYLOADS (to see different 400 errors)" -ForegroundColor Magenta
Write-Host ""

# Test 3: Invalid password (no uppercase)
$invalidPassword1 = @{
    name = "Test"
    email = "test@gmail.com"
    phone = "9999999999"
    password = "test123"
    college = "Local Community"
} | ConvertTo-Json

Write-Host "Test Case: Password with no uppercase (test123)" -ForegroundColor Yellow
try {
    $R = Invoke-WebRequest -Uri $endpoint -Method POST -ContentType "application/json" `
        -Body $invalidPassword1 -TimeoutSec 10 -SkipHttpErrorCheck
    Write-Host "Result: $($R.StatusCode) - $($($R.Content | ConvertFrom-Json).message)" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Phone with wrong format
$invalidPhone = @{
    name = "Test"
    email = "test@gmail.com"
    phone = "999-999-9999"
    password = "Test123"
    college = "Local Community"
} | ConvertTo-Json

Write-Host "Test Case: Phone with dashes (999-999-9999)" -ForegroundColor Yellow
try {
    $R = Invoke-WebRequest -Uri $endpoint -Method POST -ContentType "application/json" `
        -Body $invalidPhone -TimeoutSec 10 -SkipHttpErrorCheck
    Write-Host "Result: $($R.StatusCode) - $($($R.Content | ConvertFrom-Json).message)" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Missing college
$missingCollege = @{
    name = "Test"
    email = "test@gmail.com"
    phone = "9999999999"
    password = "Test123"
    college = ""
} | ConvertTo-Json

Write-Host "Test Case: College field empty" -ForegroundColor Yellow
try {
    $R = Invoke-WebRequest -Uri $endpoint -Method POST -ContentType "application/json" `
        -Body $missingCollege -TimeoutSec 10 -SkipHttpErrorCheck
    Write-Host "Result: $($R.StatusCode) - $($($R.Content | ConvertFrom-Json).message)" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Magenta
Write-Host "TESTS COMPLETE" -ForegroundColor Magenta
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  If the VALID request succeeded (200) → Backend is working ✅" -ForegroundColor Green
Write-Host "  If VALID failed with 400 → Check field requirements ⚠️" -ForegroundColor Yellow
Write-Host "  If all failed (timeout/connection) → Backend not running ❌" -ForegroundColor Red
Write-Host ""
Write-Host "Next Step: Report the exact error message you see" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
