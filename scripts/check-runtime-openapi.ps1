param(
    [string]$BackendUrl = "http://127.0.0.1:18000",
    [string[]]$RequireRoute = @(),
    [string]$FrontendUrl = "",
    [string]$FrontendMarkerName = "lumen-demo-app",
    [string]$FrontendMarkerContent = "knowledge-base-workbench",
    [string]$JsonOut = ""
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Join-Url([string]$BaseUrl, [string]$Path) {
    return "$($BaseUrl.TrimEnd('/'))/$($Path.TrimStart('/'))"
}

function Get-ObjectProperty([object]$Object, [string]$Name) {
    if ($null -eq $Object) {
        return $null
    }
    foreach ($property in $Object.PSObject.Properties) {
        if ($property.Name -eq $Name) {
            return $property.Value
        }
    }
    return $null
}

function ConvertTo-RouteRequirement([string]$Spec) {
    $text = $Spec.Trim()
    if ([string]::IsNullOrWhiteSpace($text)) {
        throw "Route requirement must not be empty."
    }

    $method = ""
    $path = ""
    if ($text -match '^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(.+)$') {
        $method = $Matches[1].ToLowerInvariant()
        $path = $Matches[2].Trim()
    } elseif ($text -match '^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD):(.+)$') {
        $method = $Matches[1].ToLowerInvariant()
        $path = $Matches[2].Trim()
    } else {
        $path = $text
    }

    if (-not $path.StartsWith("/")) {
        throw "Route requirement '$Spec' must use an OpenAPI path that starts with '/'."
    }

    [pscustomobject]@{
        Spec = $Spec
        Method = $method
        Path = $path
    }
}

function Test-OpenApiRoute([object]$OpenApi, [object]$Requirement) {
    $pathEntry = Get-ObjectProperty $OpenApi.paths $Requirement.Path
    if ($null -eq $pathEntry) {
        return $false
    }
    if ([string]::IsNullOrWhiteSpace($Requirement.Method)) {
        return $true
    }
    return $null -ne (Get-ObjectProperty $pathEntry $Requirement.Method)
}

function Get-PortOwnersFromUrl([string]$Url) {
    try {
        $uri = [Uri]$Url
        $owners = @(Get-NetTCPConnection -LocalPort $uri.Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            Where-Object { $_ -gt 0 })
        return ,$owners
    } catch {
        return @()
    }
}

$backendBase = $BackendUrl.TrimEnd("/")
$openApiUrl = Join-Url $backendBase "openapi.json"
$requiredRoutes = @($RequireRoute | ForEach-Object { ConvertTo-RouteRequirement $_ })
$routeResults = @()

Write-Host "Checking backend OpenAPI: $openApiUrl"
$openApi = Invoke-RestMethod -Uri $openApiUrl -TimeoutSec 8
if (-not $openApi.openapi -or -not $openApi.paths) {
    throw "Response from $openApiUrl is not an OpenAPI document."
}

$missingRoutes = New-Object 'System.Collections.Generic.List[string]'
foreach ($requirement in $requiredRoutes) {
    $exists = Test-OpenApiRoute $openApi $requirement
    $routeResults += [pscustomobject]@{
        spec = $requirement.Spec
        method = $requirement.Method
        path = $requirement.Path
        exists = $exists
    }
    if (-not $exists) {
        $missingRoutes.Add($requirement.Spec)
    }
}

if ($FrontendUrl) {
    Write-Host "Checking frontend identity: $FrontendUrl"
    $frontendResponse = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 8
    $hasMarkerName = $frontendResponse.Content.Contains("name=`"$FrontendMarkerName`"")
    $hasMarkerContent = $frontendResponse.Content.Contains("content=`"$FrontendMarkerContent`"")
    if (-not ($hasMarkerName -and $hasMarkerContent)) {
        throw "Frontend identity marker mismatch at $FrontendUrl."
    }
}

if ($missingRoutes.Count -gt 0) {
    $available = @($openApi.paths.PSObject.Properties.Name | Sort-Object) -join ", "
    throw "Missing required route(s): $($missingRoutes -join ', '). Backend may be stale. Available paths: $available"
}

$backendOwners = @(Get-PortOwnersFromUrl $backendBase)
$result = [pscustomobject]@{
    ok = $true
    checked_at = (Get-Date).ToString("s")
    backend_url = $backendBase
    openapi_url = $openApiUrl
    backend_port_owners = $backendOwners
    required_routes = $routeResults
    frontend_url = $FrontendUrl
}

if ($JsonOut) {
    $jsonPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($JsonOut)
    $result | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8
    Write-Host "Wrote runtime check result: $jsonPath"
}

Write-Host "Runtime OpenAPI check passed."
if ($requiredRoutes.Count -gt 0) {
    foreach ($routeResult in $routeResults) {
        $methodLabel = if ($routeResult.method) { $routeResult.method.ToUpperInvariant() } else { "ANY" }
        Write-Host "- $methodLabel $($routeResult.path)"
    }
}
