$base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
$dataUrlImage = "data:image/png;base64,$base64Image"
$uniqueEmail = "testuser_$(Get-Random)@example.com"
$uniquePhone = "98765432" + (Get-Random -Minimum 10 -Maximum 99)
$json = @{
    name="Test User"
    email=$uniqueEmail
    phone=$uniquePhone
    password="Pass123!"
    college="Test University"
    gender="Male"
    fieldOfWork="Software Development"
    experienceYears=3
    bio="This is a test bio for the registration"
    liveSelfie=$dataUrlImage
    idProofFile=$dataUrlImage
    idProofType="Aadhar"
} | ConvertTo-Json

Write-Host "Testing signup endpoint..." -ForegroundColor Green
Write-Host $json

Write-Host "Sending request..." -ForegroundColor Cyan
Write-Host "Payload size: $($json.Length) bytes" -ForegroundColor Cyan

$jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$jsonFile = "request-body.json"
Set-Content -Path $jsonFile -Value $json -Encoding UTF8

& cmd /c "curl.exe -X POST http://localhost:5000/api/auth/signup -H `"Content-Type: application/json`" -d `@$jsonFile"

Remove-Item $jsonFile -Force
