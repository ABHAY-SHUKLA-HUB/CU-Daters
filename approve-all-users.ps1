# Admin credentials
$adminEmail = "admin@cudaters.com"
$adminPassword = "AdminPassword123!"
$apiBaseUrl = "http://localhost:5000"

Write-Host "Admin Approval Script" -ForegroundColor Cyan

# Step 1: Login and get token
Write-Host "`nLogging in as admin..."
$loginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$apiBaseUrl/api/auth/admin-login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
$loginData = $loginResponse.Content | ConvertFrom-Json
$authToken = $loginData.data.token

Write-Host "Login successful!"

# Step 2: Get pending registrations
Write-Host "`nFetching pending registrations..."
$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type" = "application/json"
}

$approvalsResponse = Invoke-WebRequest -Uri "$apiBaseUrl/api/admin/registration-approvals" -Method GET -Headers $headers
$approvalsData = $approvalsResponse.Content | ConvertFrom-Json
$pendingUsers = $approvalsData.data

Write-Host "Found $($pendingUsers.Count) pending users"

if ($pendingUsers.Count -eq 0) {
    Write-Host "No pending registrations to approve!"
    exit 0
}

# Display pending users
Write-Host "`nPending Users:"
foreach ($user in $pendingUsers) {
    Write-Host "  - $($user.name) ($($user.email))"
}

# Step 3: Approve each user
Write-Host "`nApproving all pending users..."
$approvedCount = 0

foreach ($user in $pendingUsers) {
    Write-Host "Approving $($user.name)..." -NoNewline
    
    $approveBody = @{
        adminNotes = "Auto-approved by script"
    } | ConvertTo-Json
    
    $approveResponse = Invoke-WebRequest -Uri "$apiBaseUrl/api/admin/registrations/$($user._id)/approve" -Method PUT -Headers $headers -Body $approveBody
    Write-Host " OK"
    $approvedCount++
}

Write-Host "`nSummary: Approved $approvedCount users"
Write-Host "All pending users approved!"
