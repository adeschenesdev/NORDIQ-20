# setup-iis.ps1
# Configure un site IIS local pour l'ICQ-20.
# A executer une seule fois en tant qu'Administrateur dans PowerShell.
#
# Usage :
#   .\setup-iis.ps1
#   .\setup-iis.ps1 -Port 8080 -SiteName "ICQ20"

param(
    [int]    $Port     = 8080,
    [string] $SiteName = "ICQ20"
)

$distPath = Join-Path $PSScriptRoot "web\dist"

# Verification que le build existe
if (-not (Test-Path (Join-Path $distPath "index.html"))) {
    Write-Error "web\dist\index.html introuvable. Lancez d'abord : npm run build:local"
    exit 1
}

# Import du module WebAdministration
Import-Module WebAdministration -ErrorAction Stop

# Creation du pool d'applications (No Managed Code -- site statique)
if (-not (Test-Path "IIS:\AppPools\$SiteName")) {
    New-WebAppPool -Name $SiteName | Out-Null
    Set-ItemProperty "IIS:\AppPools\$SiteName" managedRuntimeVersion ""
    Write-Host "[OK] Pool d'applications '$SiteName' cree"
} else {
    Write-Host "     Pool '$SiteName' deja existant"
}

# Suppression de l'ancien site s'il existe
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Remove-Website -Name $SiteName
    Write-Host "     Ancien site '$SiteName' supprime"
}

# Creation du site
New-Website -Name $SiteName `
            -PhysicalPath $distPath `
            -Port $Port `
            -ApplicationPool $SiteName | Out-Null

Write-Host "[OK] Site '$SiteName' cree sur le port $Port"

# Ajout du type MIME application/json si absent
$mimeMap = Get-WebConfigurationProperty `
    -Filter "system.webServer/staticContent" `
    -PSPath "IIS:\Sites\$SiteName" `
    -Name collection |
    Where-Object { $_.fileExtension -eq ".json" }

if (-not $mimeMap) {
    Add-WebConfigurationProperty `
        -Filter "system.webServer/staticContent" `
        -PSPath "IIS:\Sites\$SiteName" `
        -Name collection `
        -Value @{ fileExtension = ".json"; mimeType = "application/json" }
    Write-Host "[OK] Type MIME application/json ajoute"
}

# Document par defaut : index.html
Add-WebConfiguration `
    -Filter "system.webServer/defaultDocument/files" `
    -PSPath "IIS:\Sites\$SiteName" `
    -Value @{ value = "index.html" } `
    -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Installation terminee ==="
Write-Host "Site disponible : http://localhost:$Port"
Write-Host ""
Write-Host "Flux de travail quotidien :"
Write-Host "  1. npm run update   (apres 16h00 HNE, met a jour data.json et dist/)"
Write-Host "  2. Rafraichir http://localhost:$Port dans le navigateur"
