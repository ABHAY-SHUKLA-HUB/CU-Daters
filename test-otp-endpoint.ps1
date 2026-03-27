# Quick OTP Endpoint Tester - PowerShell
# Run with: powershell -ExecutionPolicy Bypass -File test-otp-endpoint.ps1

Write-Host "🧪 CU-Daters OTP Endpoint Tester" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Configuration
$LocalBackend = "http://localhost:5000"
$ProductionBackend = "https://cu-daters-backend.onrender.com"

# Test password (valid: 8+ chars, uppercase, lowercase, digit)
$TestPassword = "Test123"

function Test-Endpoint {
    param(
        [string]$Endpoint,
        [string]$Name,
        [string]$Email = "test-$(Get-Random)@gmail.com",
        [string]$Phone = "9999999999",
        [string]$Password = $TestPassword,
        [string]$College = "Local Community"
    )
    
    $Url = "$Endpoint/api/auth/send-otp"
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    Write-Host "Email: $Email`n" -ForegroundColor Gray
    
    $Body = @{
        name = "Test User"
        email = $Email
        phone = $Phone
        password = $Password
        college = $College
    } | ConvertTo-Json
    
    try {
        $Response = Invoke-WebRequest -Uri $Url `
            -Method POST `
            -ContentType "application/json" `
            -Body $Body `
            -TimeoutSec 10 `
            -SkipHttpErrorCheck
        
        $StatusCode = $Response.StatusCode
        $Content = $Response.Content | ConvertFrom-Json
        
        switch ($StatusCode) {
            200 {
                Write-Host "✅ SUCCESS (200)" -ForegroundColor Green
                Write-Host "Message: $($Content.message)" -ForegroundColor Green
                if ($Content.data) {
                    Write-Host "Response Data:" -ForegroundColor Green
                    $Content.data | ConvertTo-Json | Write-Host
                }
            }
            400 {
                Write-Host "❌ BAD REQUEST (400)" -ForegroundColor Red
                Write-Host "Error: $($Content.message)" -ForegroundColor Red
            }
            429 {
                Write-Host "⏱️  RATE LIMITED (429)" -ForegroundColor Yellow
                Write-Host "Message: $($Content.message)" -ForegroundColor Yellow
            }
            500 {
                Write-Host "❌ SERVER ERROR (500)" -ForegroundColor Red
                Write-Host "Message: $($Content.message)" -ForegroundColor Red
            }
            default {
                Write-Host "⚠️  UNEXPECTED STATUS ($StatusCode)" -ForegroundColor Yellow
                Write-Host $Content -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "❌ CONNECTION ERROR" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n💡 Tip: If localhost fails - backend not running"
        Write-Host "💡 Tip: If production fails - check internet connection`n" -ForegroundColor Yellow
    }
    
    Write-Host "---`n" -ForegroundColor Gray
}

function Test-HealthEndpoint {
    param([string]$Endpoint, [string]$Name)
    
    $Url = "$Endpoint/api/health"
    
    Write-Host "🏥 Health Check: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url`n" -ForegroundColor Gray
    
    try {
        $Response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10
        Write-Host "✅ HEALTHY" -ForegroundColor Green
        Write-Host "Status: $($Response.status)" -ForegroundColor Green
        if ($Response.database) {
            Write-Host "Database: $($Response.database)" -ForegroundColor Green
        }
        if ($Response.email) {
            Write-Host "Email Configured: $($Response.email.configured)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ UNHEALTHY or NOT RESPONDING" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n---`n" -ForegroundColor Gray
}

# Menu
Write-Host "Choose test to run:`n" -ForegroundColor White
Write-Host "1. Health Check - LOCAL" -ForegroundColor White
Write-Host "2. Health Check - PRODUCTION" -ForegroundColor White
Write-Host "3. OTP Test - LOCAL" -ForegroundColor White
Write-Host "4. OTP Test - PRODUCTION" -ForegroundColor White
Write-Host "5. Run All Tests" -ForegroundColor White
Write-Host "6. Exit`n" -ForegroundColor White

$Choice = Read-Host "Enter choice (1-6)"

switch ($Choice) {
    "1" {
        Test-HealthEndpoint -Endpoint $LocalBackend -Name "LOCAL"
    }
    "2" {
        Test-HealthEndpoint -Endpoint $ProductionBackend -Name "PRODUCTION"
    }
    "3" {
        Test-Endpoint -Endpoint $LocalBackend -Name "LOCAL TEST"
    }
    "4" {
        Test-Endpoint -Endpoint $ProductionBackend -Name "PRODUCTION TEST"
    }
    "5" {
        Write-Host "RUNNING ALL TESTS`n" -ForegroundColor Magenta
        Test-HealthEndpoint -Endpoint $LocalBackend -Name "LOCAL"
        Test-HealthEndpoint -Endpoint $ProductionBackend -Name "PRODUCTION"
        Test-Endpoint -Endpoint $LocalBackend -Name "LOCAL TEST"
        Test-Endpoint -Endpoint $ProductionBackend -Name "PRODUCTION TEST"
        Write-Host "✅ ALL TESTS COMPLETE" -ForegroundColor Green
    }
    "6" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}

Read-Host "`nPress Enter to exit"
