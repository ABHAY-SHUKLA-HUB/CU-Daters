#!/usr/bin/env pwsh
<#
.SYNOPSIS
SIMPLE TEST: User Registration and Admin Approval Flow
Tests the registration and approval workflow using PowerShell
#>

$API_URL = "http://localhost:5000"
$ADMIN_EMAIL = "admin@cudaters.com"
$ADMIN_PASSWORD = "AdminPassword123"
$COOKIE_JAR = "$PSScriptRoot\cookies.txt"
$CSRF_TOKEN = ""

# Clean up old cookie jar
if (Test-Path $COOKIE_JAR) {
    Remove-Item $COOKIE_JAR -Force
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n$('=' * 70)" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "$('=' * 70)`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message"
}

function Create-TestImage {
    # Simple 1x1 PNG image as base64
    $png = [byte[]]@(
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
        0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x6e, 0x6b, 0xd5, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    )
    $base64 = [Convert]::ToBase64String($png)
    return "data:image/png;base64,$base64"
}

function Invoke-API {
    param(
        [string]$Method,
        [string]$Endpoint,
        $Body,
        [hashtable]$Headers = @{}
    )
    
    $url = "$API_URL$Endpoint"
    $params = @{
        Uri = $url
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
        CookieJar = $COOKIE_JAR
    }
    
    if ($Body) {
        $params.Body = $Body | ConvertTo-Json -Depth 10
    }
    
    try {
        $response = Invoke-WebRequest @params
        return $response | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        $err = $_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        Write-Host "Error Response: $err" -ForegroundColor Red
        throw $_
    }
}

# ===== TEST START =====
Write-Header "USER REGISTRATION & ADMIN APPROVAL FLOW TEST"

$timestamp = [int](Get-Date -UFormat %s) * 1000
$testImage = Create-TestImage

try {
    # TEST 1: Register User 1
    Write-Header "TEST 1: Register User for Approval"
    
    $email1 = "approve-$timestamp@test.local"
    $phone = (Get-Random -Minimum 1000000000 -Maximum 9999999999).ToString().Substring(0, 10)
    
    Write-Info "Registering user: $email1"
    
    $signup1 = @{
        name = "Test User $timestamp"
        email = $email1
        phone = $phone
        password = "TestPass123!"
        college = "IIT Delhi"
        gender = "male"
        fieldOfWork = "Engineering"
        experienceYears = 2
        bio = "Test profile for registration approval workflow with enough characters."
        liveSelfie = $testImage
        idProofFile = $testImage
        idProofType = "student_id"
    }
    
    $reg1Response = Invoke-API -Method POST -Endpoint "/api/auth/signup" -Body $signup1
    $user1Data = ($reg1Response | ConvertFrom-Json).data.user
    
    if ($user1Data.status -eq "pending") {
        Write-Success "User 1 registered and pending: $email1"
        $user1Id = $user1Data._id
    } else {
        throw "User 1 not pending"
    }

    # TEST 2: Admin Login
    Write-Header "TEST 2: Admin Login"
    
    Write-Info "Logging in as admin..."
    
    $adminLogin = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    }
    
    $loginResponse = Invoke-API -Method POST -Endpoint "/api/admin/login" -Body $adminLogin
    $loginData = ($loginResponse | ConvertFrom-Json).data
    
    if ($loginData.token) {
        Write-Success "Admin logged in successfully"
        $adminToken = $loginData.token
        $CSRF_TOKEN = $loginData.csrfToken
        Write-Info "CSRF Token: $($CSRF_TOKEN.Substring(0, 20))..."
    } else {
        throw "Admin login failed"
    }

    # TEST 3: Get Pending Registrations
    Write-Header "TEST 3: Fetch Pending Registrations"
    
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "x-csrf-token" = $CSRF_TOKEN
    }
    
    $pendingResponse = Invoke-API -Method GET -Endpoint "/api/admin/registration-approvals" -Headers $headers
    $pendingData = ($pendingResponse | ConvertFrom-Json).data.data
    
    $user1Found = $pendingData | Where-Object { $_._id -eq $user1Id }
    
    if ($user1Found) {
        Write-Success "Test user found in pending list"
    } else {
        throw "Test user not found in pending list"
    }

    # TEST 4: Approve User
    Write-Header "TEST 4: Approve User"
    
    Write-Info "Approving user $email1..."
    
    $approvePayload = @{
        adminNotes = "Test approval - documents look good"
    }
    
    $approveHeaders = $headers.Clone()
    $approveHeaders["x-admin-pin"] = "1234"
    
    $approveResponse = Invoke-API -Method PUT -Endpoint "/api/admin/registrations/$user1Id/approve" -Body $approvePayload -Headers $approveHeaders
    $approveData = ($approveResponse | ConvertFrom-Json).data
    
    if ($approveData.status -eq "active") {
        Write-Success "User approved successfully! Status: active"
    } else {
        throw "User not approved. Status: $($approveData.status)"
    }

    # TEST 5: Verify User Not in Pending
    Write-Header "TEST 5: Verify User Removed from Pending"
    
    $pendingAfter = Invoke-API -Method GET -Endpoint "/api/admin/registration-approvals" -Headers $headers
    $pendingAfterData = ($pendingAfter | ConvertFrom-Json).data.data
    
    $stillPending = $pendingAfterData | Where-Object { $_._id -eq $user1Id }
    
    if (-not $stillPending) {
        Write-Success "User removed from pending queue after approval"
    } else {
        Write-Error "User still in pending queue"
    }

    # TEST 6: User Can Login
    Write-Header "TEST 6: Approved User Can Login"
    
    $userLogin = @{
        email = $email1
        password = "TestPass123!"
    }
    
    $userLoginResponse = Invoke-API -Method POST -Endpoint "/api/auth/login" -Body $userLogin
    $userData = ($userLoginResponse | ConvertFrom-Json).data
    
    if ($userData.user.status -eq "active") {
        Write-Success "Approved user can login successfully"
    } else {
        throw "User login failed"
    }

    Write-Header "ALL TESTS PASSED! ✅"
    Write-Host "Registration and approval workflow is working correctly." -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Error "Test failed: $_"
    Write-Host ""
    exit 1
}
