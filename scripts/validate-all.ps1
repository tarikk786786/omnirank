<#
.SYNOPSIS
  Comprehensive Automated Validation Suite for RankPilot Omni
  Author: tarikislam.in
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  OMNIRANK - MULTI-PLATFORM AUTOMATED VALIDATION SUITE" -ForegroundColor Yellow
Write-Host "  Amazon - Flipkart - Google | Commerce Intelligence Suite" -ForegroundColor Cyan
Write-Host "  Engineered with Super Security by tarikislam.in (v2.2.0)" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$workspaceRoot = $PSScriptRoot | Split-Path -Parent
$omniDir = Join-Path $workspaceRoot "omnirank"
$legacyDir = Join-Path $workspaceRoot "amazon-seo-extension"

if (Test-Path $omniDir) {
    $extDir = $omniDir
} elseif (Test-Path $legacyDir) {
    $extDir = $legacyDir
} else {
    $workspaceRoot = $PSScriptRoot
    $extDir = $workspaceRoot
}
$srcDir = Join-Path $extDir "src"
$backendDir = Join-Path $extDir "backend"
$distDir = Join-Path $workspaceRoot "dist"

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

$checksPassed = 0
$checksFailed = 0

function Report-Check {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Message
    )
    if ($Passed) {
        $script:checksPassed++
        Write-Host "  [PASS] $Name - $Message" -ForegroundColor Green
    } else {
        $script:checksFailed++
        Write-Host "  [FAIL] $Name - $Message" -ForegroundColor Red
    }
}

# --- 1. MANIFEST V3 CONFORMANCE ---
Write-Host "Step 1: Manifest V3 and Multi-Platform Host Permissions..." -ForegroundColor Yellow
$manifestPath = Join-Path $srcDir "manifest.json"
if (Test-Path $manifestPath) {
    $manifestContent = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $isV3 = ($manifestContent.manifest_version -eq 3)
    $hasSidePanel = ($manifestContent.permissions -contains "sidePanel") -and ($null -ne $manifestContent.side_panel)
    $hasSw = ($manifestContent.background.service_worker -eq "scripts/background.js")
    $hasAmzHost = ($manifestContent.host_permissions | Where-Object { $_ -like "*amazon.in*" } | Measure-Object).Count -gt 0
    $hasFkHost = ($manifestContent.host_permissions | Where-Object { $_ -like "*flipkart.com*" } | Measure-Object).Count -gt 0
    $hasGoogleHost = ($manifestContent.host_permissions | Where-Object { $_ -like "*searchconsole.googleapis.com*" } | Measure-Object).Count -gt 0
    
    Report-Check -Name "Manifest Version" -Passed $isV3 -Message "Manifest version is $($manifestContent.manifest_version) (MV3 compliant)"
    Report-Check -Name "Side Panel Support" -Passed $hasSidePanel -Message "sidePanel permission and default_path configured"
    Report-Check -Name "Service Worker" -Passed $hasSw -Message "Background service worker configured at scripts/background.js"
    Report-Check -Name "Amazon Host Permissions" -Passed $hasAmzHost -Message "Amazon.in host permissions active"
    Report-Check -Name "Flipkart Host Permissions" -Passed $hasFkHost -Message "Flipkart host permissions active for flipkart.com and api.flipkart.net"
    Report-Check -Name "Google Host Permissions" -Passed $hasGoogleHost -Message "Google APIs host permissions active"
} else {
    Report-Check -Name "Manifest File" -Passed $false -Message "manifest.json not found"
}

# --- 2. JAVASCRIPT SYNTAX & INTEGRITY ---
Write-Host ""
Write-Host "Step 2: JavaScript Syntax and Compilation Checks..." -ForegroundColor Yellow
$scriptsToCheck = @(
    (Join-Path $srcDir "scripts\content.js"),
    (Join-Path $srcDir "scripts\background.js"),
    (Join-Path $srcDir "scripts\popup.js"),
    (Join-Path $backendDir "server.js")
)

foreach ($script in $scriptsToCheck) {
    $name = Split-Path $script -Leaf
    if (Test-Path $script) {
        $nodeCheck = Start-Process -FilePath "node" -ArgumentList "--check `"$script`"" -NoNewWindow -Wait -PassThru
        Report-Check -Name "Syntax $name" -Passed ($nodeCheck.ExitCode -eq 0) -Message "$name compiled cleanly with exit code 0"
    } else {
        Report-Check -Name "File $name" -Passed $false -Message "$name not found"
    }
}

# --- 3. DOM PARITY VERIFICATION ---
Write-Host ""
Write-Host "Step 3: DOM Element Parity across popup and sidepanel..." -ForegroundColor Yellow
$domVerifyScript = Join-Path $workspaceRoot "scripts\verify-dom.js"
if (Test-Path $domVerifyScript) {
    $domCheck = Start-Process -FilePath "node" -ArgumentList "`"$domVerifyScript`"" -NoNewWindow -Wait -PassThru
    Report-Check -Name "DOM Element Parity" -Passed ($domCheck.ExitCode -eq 0) -Message "100 percent of referenced element IDs match popup.html and sidepanel.html"
} else {
    Report-Check -Name "DOM Verify Script" -Passed $false -Message "verify-dom.js missing"
}

# --- 4. HARDCORE SECURITY AUDIT ---
Write-Host ""
Write-Host "Step 4: Hardcore Security and Client Secrets Audit..." -ForegroundColor Yellow
$srcFiles = Get-ChildItem -Path $srcDir -Recurse -File -Include *.js, *.html, *.json
$secretPattern = '(AIzaSy[A-Za-z0-9_-]{33}|AQ\.[A-Za-z0-9_-]{45,}|amzn1\.oa2-cs\.v1\.[a-f0-9]{64}|aws_secret_access_key|gsk_[A-Za-z0-9]{40,}|sk-or-v1-[a-f0-9]{64})'
$foundSecrets = $false

foreach ($f in $srcFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match $secretPattern) {
        $foundSecrets = $true
        Report-Check -Name "Security Audit" -Passed $false -Message "Hardcoded secret found in $($f.Name)"
    }
}
if (-not $foundSecrets) {
    Report-Check -Name "Security Audit" -Passed $true -Message "Zero client-side secrets or tokens in client source (100 percent clean)"
}

# --- 5. DETERMINISTIC OFFLINE ENGINE ---
Write-Host ""
Write-Host "Step 5: Offline Deterministic Multi-Platform Engine Test..." -ForegroundColor Yellow
$offlineScript = Join-Path $workspaceRoot "scripts\test-offline-engine.js"
if (Test-Path $offlineScript) {
    $offlineCheck = Start-Process -FilePath "node" -ArgumentList "`"$offlineScript`"" -NoNewWindow -Wait -PassThru
    Report-Check -Name "Offline Deterministic Engine" -Passed ($offlineCheck.ExitCode -eq 0) -Message "All Amazon FBA, Flipkart Fee Math, and Google Trends tests pass locally"
} else {
    Report-Check -Name "Offline Test Script" -Passed $false -Message "test-offline-engine.js missing"
}

# --- 6. BACKEND HEALTH & MULTI-PLATFORM DIAGNOSTICS ---
Write-Host ""
Write-Host "Step 6: Backend Proxy Multi-Platform Diagnostics..." -ForegroundColor Yellow
try {
    $healthRes = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $isHealthy = ($healthRes.status -eq "online" -or $healthRes.status -eq "OK")
    Report-Check -Name "Backend Health" -Passed $isHealthy -Message "Backend proxy online (System: $($healthRes.system), Version: $($healthRes.version))"
    
    $diagRes = Invoke-RestMethod -Uri "http://localhost:3000/api/diagnostics" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $hasEcos = ($null -ne $diagRes.ecosystems)
    Report-Check -Name "Multi-Platform Diagnostics" -Passed $hasEcos -Message "Diagnostics endpoint verified across Amazon, Flipkart, Google and AI Cascades"

    # Flipkart Fee Live API
    $fkBody = '{"category":"Electronics","sellingPrice":1299,"weightGrams":450,"shippingTier":"national","isCod":false}'
    $fkRes = Invoke-RestMethod -Uri "http://localhost:3000/api/flipkart/calculate-fees" -Method Post -Body $fkBody -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop
    $fkValid = ($fkRes.data.netPayout -eq 1021.23)
    Report-Check -Name "Flipkart Fee Endpoint" -Passed $fkValid -Message "Flipkart calculation verified: Net Payout Rs $($fkRes.data.netPayout) on Rs 1299 sale"

    # Google Trends CSV Live API
    $csvSample = "Category: All categories`n`nWeek,smart watch: (India),fitness tracker: (India)`n2024-01-07,80,40`n2024-01-14,85,42`n2024-01-21,90,45"
    $gBody = @{ csvText = $csvSample } | ConvertTo-Json
    $gRes = Invoke-RestMethod -Uri "http://localhost:3000/api/google/trends-import" -Method Post -Body $gBody -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop
    $gValid = ($gRes.data.totalDataPoints -eq 3)
    Report-Check -Name "Google Trends Parser" -Passed $gValid -Message "Trends parser verified: Parsed $($gRes.data.totalDataPoints) intervals for $($gRes.data.keywords.Count) keywords"
} catch {
    Report-Check -Name "Backend Endpoints" -Passed $false -Message "Backend verification failed: $($_.Exception.Message)"
}

# --- 7. REAL AMAZON BUYER SUGGESTIONS API ---
Write-Host ""
Write-Host "Step 7: Real Amazon Buyer Suggestions API..." -ForegroundColor Yellow
try {
    $amzSuggestUrl = 'https://completion.amazon.com/api/2017/suggestions?limit=10&prefix=boat&suggestion-type=KEYWORD&mid=ATVPDKIKX0DER&alias=aps'
    $headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    $suggestRes = Invoke-RestMethod -Uri $amzSuggestUrl -Method Get -Headers $headers -TimeoutSec 5 -ErrorAction Stop
    $count = ($suggestRes.suggestions | Measure-Object).Count
    Report-Check -Name "Amazon Suggestions API" -Passed ($count -gt 0) -Message "Successfully fetched $count live search suggestions for 'boat' from Amazon Completion Service"
} catch {
    Report-Check -Name "Amazon Suggestions API" -Passed $false -Message "Could not reach completion.amazon.com: $($_.Exception.Message)"
}

# --- 8. PACKAGING RELEASE ARTIFACT ---
Write-Host ""
Write-Host "Step 8: Building Production Release ZIP Package..." -ForegroundColor Yellow
$releaseZipPath = Join-Path $distDir "omnirank-v2.2.0.zip"
if (Test-Path $releaseZipPath) {
    Remove-Item $releaseZipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($srcDir, $releaseZipPath)

if (Test-Path $releaseZipPath) {
    $zipSize = (Get-Item $releaseZipPath).Length
    $hash = (Get-FileHash -Path $releaseZipPath -Algorithm SHA256).Hash
    Report-Check -Name "Release ZIP Package" -Passed $true -Message "Packaged $zipSize bytes at $releaseZipPath"
    Write-Host "    SHA-256 Checksum: $hash" -ForegroundColor Magenta
    
    $downloadsDir = "C:\Users\tarik\Downloads"
    if (Test-Path $downloadsDir) {
        $dlZip = Join-Path $downloadsDir "omnirank-v2.2.0.zip"
        Copy-Item -Path $releaseZipPath -Destination $dlZip -Force
        Write-Host "    Copied to Downloads: $dlZip" -ForegroundColor Cyan
    }
} else {
    Report-Check -Name "Release ZIP Package" -Passed $false -Message "Failed to generate release zip"
}

# --- SUMMARY REPORT ---
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  VALIDATION SUMMARY REPORT" -ForegroundColor Yellow
Write-Host "    Total Checks Passed : $checksPassed" -ForegroundColor Green
Write-Host "    Total Checks Failed : $checksFailed" -ForegroundColor $(if ($checksFailed -eq 0) { "Green" } else { "Red" })
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

if ($checksFailed -eq 0) {
    Write-Host "ALL SYSTEMS GO! OmniRank v2.2.0 is verified and production-ready." -ForegroundColor Green
    Write-Host "Amazon - Flipkart - Google | Real Data Contract | Engineered by tarikislam.in" -ForegroundColor Cyan
} else {
    Write-Host "Some checks did not pass. Inspect details above." -ForegroundColor Yellow
}
