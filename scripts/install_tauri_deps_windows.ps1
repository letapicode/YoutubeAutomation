param()

$choco = Get-Command choco -ErrorAction SilentlyContinue
if (-not $choco) {
    Write-Error "Chocolatey is required to install Tauri dependencies."
    exit 1
}

choco install -y microsoft-edge-webview2-runtime gtk-runtime

$pkgPath = "$Env:ChocolateyInstall\lib\gtk-runtime\tools\lib\pkgconfig"
"PKG_CONFIG_PATH=$pkgPath" | Out-File -Encoding ASCII .env.tauri

Write-Host "System dependencies installed for Windows."
Write-Host "A .env.tauri file has been created with PKG_CONFIG_PATH."
