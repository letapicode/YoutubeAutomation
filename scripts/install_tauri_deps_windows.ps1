param()

$ErrorActionPreference = "Stop"

function Write-Info { param([string]$m) Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Write-Ok   { param([string]$m) Write-Host "[OK]    $m" -ForegroundColor Green }
function Write-Warn { param([string]$m) Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Write-Err  { param([string]$m) Write-Host "[ERROR] $m" -ForegroundColor Red }

# 1) Check if WebView2 Runtime is already installed (Microsoft-documented key)
$wv2Key = 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'
$installed = Get-ItemProperty -Path $wv2Key -ErrorAction SilentlyContinue
if ($installed) {
  Write-Ok "WebView2 Runtime already installed: $($installed.pv)"
} else {
  Write-Info "WebView2 Runtime not found. Attempting installation..."

  # 2) Try winget first (official & quiet)
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  $installedOk = $false
  if ($winget) {
    try {
      Write-Info "Installing WebView2 via winget (Microsoft.EdgeWebView2Runtime)..."
      $p = Start-Process -FilePath $winget.Source -ArgumentList @(
        'install','--id=Microsoft.EdgeWebView2Runtime','--silent',
        '--accept-package-agreements','--accept-source-agreements'
      ) -Wait -PassThru -NoNewWindow
      if ($p.ExitCode -eq 0) { $installedOk = $true }
    } catch { Write-Warn "winget failed: $_" }
  }

  # 3) Fallback to Chocolatey with the correct package id
  if (-not $installedOk) {
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    if ($choco) {
      try {
        Write-Info "Installing WebView2 via Chocolatey (webview2-runtime)..."
        $p = Start-Process -FilePath $choco.Source -ArgumentList 'install webview2-runtime -y --no-progress' -Wait -PassThru -NoNewWindow
        if ($p.ExitCode -eq 0) { $installedOk = $true } else { Write-Warn "Chocolatey exited $($p.ExitCode)" }
      } catch { Write-Warn "Chocolatey failed: $_" }
    } else {
      Write-Warn "Chocolatey not found; skipping choco step"
    }
  }

  # 4) Final fallback: Microsoft Evergreen Bootstrapper
  if (-not $installedOk) {
    $url = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703'
    $tmp = Join-Path $env:TEMP 'webview2bootstrapper.exe'
    try {
      Write-Info "Downloading WebView2 Bootstrapper..."
      Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
      Write-Info "Running Bootstrapper silently..."
      $p = Start-Process -FilePath $tmp -ArgumentList '/silent /install' -Wait -PassThru -NoNewWindow
      if ($p.ExitCode -eq 0) { $installedOk = $true } else { Write-Warn "Bootstrapper exited $($p.ExitCode)" }
    } catch { Write-Err "Bootstrapper failed: $_" }
  }

  # Re-check registry after attempted install
  $installed = Get-ItemProperty -Path $wv2Key -ErrorAction SilentlyContinue
  if (-not $installed) {
    Write-Err "WebView2 installation was not detected."
    exit 1
  }
Write-Ok "WebView2 Runtime installed: $($installed.pv)"
}

# 5) Ensure FFmpeg is present
function Ensure-FFmpeg {
  if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { Write-Ok "FFmpeg present"; return }
  Write-Info "Installing FFmpeg..."
  $installedOk = $false
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    try {
      $p = Start-Process -FilePath $winget.Source -ArgumentList @('install','--id=Gyan.FFmpeg','--silent','--accept-package-agreements','--accept-source-agreements') -Wait -PassThru -NoNewWindow
      if ($p.ExitCode -eq 0) { $installedOk = $true }
    } catch { Write-Warn "winget FFmpeg failed: $_" }
  }
  if (-not $installedOk) {
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    if ($choco) {
      try {
        $p = Start-Process -FilePath $choco.Source -ArgumentList 'install ffmpeg -y --no-progress' -Wait -PassThru -NoNewWindow
        if ($p.ExitCode -eq 0) { $installedOk = $true }
      } catch { Write-Warn "Chocolatey FFmpeg failed: $_" }
    }
  }
  if ($installedOk) { Write-Ok "FFmpeg installed" } else { Write-Warn "FFmpeg install skipped or failed; ensure it is on PATH" }
}

# 6) Ensure Argos Translate CLI is present
function Ensure-ArgosTranslate {
  if (Get-Command argos-translate -ErrorAction SilentlyContinue) { Write-Ok "Argos Translate present"; return }
  Write-Info "Installing Argos Translate (Python package)..."
  # Ensure Python
  $pyOk = $false
  if (Get-Command py -ErrorAction SilentlyContinue) { $pyOk = $true }
  elseif (Get-Command python -ErrorAction SilentlyContinue) { $pyOk = $true }
  else {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
      try {
        $p = Start-Process -FilePath $winget.Source -ArgumentList @('install','--id=Python.Python.3.12','--silent','--accept-package-agreements','--accept-source-agreements') -Wait -PassThru -NoNewWindow
        if ($p.ExitCode -eq 0) { $pyOk = $true }
      } catch { Write-Warn "winget Python failed: $_" }
    }
    if (-not $pyOk) {
      $choco = Get-Command choco -ErrorAction SilentlyContinue
      if ($choco) {
        try {
          $p = Start-Process -FilePath $choco.Source -ArgumentList 'install python -y --no-progress' -Wait -PassThru -NoNewWindow
          if ($p.ExitCode -eq 0) { $pyOk = $true }
        } catch { Write-Warn "Chocolatey Python failed: $_" }
      }
    }
  }

  if (-not $pyOk) { Write-Warn "Python not available; Argos Translate cannot be installed automatically"; return }

  # Install argostranslate for current user
  try {
    if (Get-Command py -ErrorAction SilentlyContinue) {
      & py -m pip install --user --upgrade argostranslate | Out-Null
    } else {
      & python -m pip install --user --upgrade argostranslate | Out-Null
    }
  } catch { Write-Warn "pip install argostranslate failed: $_" }

  # Create a shim in a directory already on PATH (.cargo\bin) so current process can find it immediately
  $shimDir = Join-Path $env:USERPROFILE '.cargo\bin'
  try { if (-not (Test-Path $shimDir)) { New-Item -ItemType Directory -Path $shimDir -Force | Out-Null } } catch {}
  $shimPath = Join-Path $shimDir 'argos-translate.cmd'
  $shim = "@echo off`r`nif exist %SystemRoot%\py.exe (`r`n  py -m argostranslate %*`r`n) else (`r`n  python -m argostranslate %*`r`n)"
  try { Set-Content -Path $shimPath -Value $shim -Encoding ASCII -Force } catch {}

  if (Get-Command argos-translate -ErrorAction SilentlyContinue) { Write-Ok "Argos Translate available" } else { Write-Warn "Argos Translate not detected on PATH; restart may be required" }
}

Ensure-FFmpeg
Ensure-ArgosTranslate

# 7) On Windows, GTK/PKG_CONFIG_PATH is not required. Still create .env.tauri for tooling parity.
"# Windows does not require PKG_CONFIG_PATH for Tauri builds`n" +
"# This file is created to keep tooling consistent across OSes.`n" |
  Out-File -Encoding ASCII .env.tauri

Write-Ok "System dependencies verified for Windows."
