# YouTube Automation Setup for Windows - Enhanced Version
# This script installs all required dependencies for the YouTube Automation project
# Requires: PowerShell 5.1 or later, Administrator privileges

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    Write-Host "Right-click on PowerShell and select 'Run as administrator', then run this script again." -ForegroundColor Yellow
    Start-Sleep 5
    exit 1
}

# Set error action preference
$ErrorActionPreference = "Stop"

# Set security protocol to use TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Set variables
$script:needsReboot = $false
$installStartTime = Get-Date

# Function to write colored output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if a command exists
function Test-CommandExists {
    param(
        [string]$command
    )

    $commandPath = (Get-Command $command -ErrorAction SilentlyContinue).Source
    return [bool]$commandPath
}

# Function to check if a program is installed
function Test-ProgramInstalled {
    param([string]$programName)

    $uninstallPaths = @(
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )

    $installed = $uninstallPaths | ForEach-Object {
        Get-ItemProperty $_ -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -like "*$programName*" }
    }

    $inPath = Test-CommandExists $programName

    return ($null -ne $installed) -or $inPath
}

# Function to install Chocolatey if not present
function Install-Chocolatey {
    Write-Info "Checking for Chocolatey..."

    if (Test-CommandExists -command "choco") {
        Write-Success "Chocolatey is already installed"
        return $true
    }

    Write-Info "Installing Chocolatey..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        if (Test-CommandExists -command "choco") {
            Write-Success "Chocolatey installed successfully"
            return $true
        } else {
            Write-Err "Failed to install Chocolatey"
            return $false
        }
    } catch {
        Write-Err "Error installing Chocolatey: $_"
        return $false
    }
}

# Function to install a package using Chocolatey
function Install-Package {
    param(
        [string]$packageName,
        [string]$packageDisplayName,
        [switch]$needsReboot = $false,
        [string]$packageArgs = $null
    )

    Write-Info "Checking for $packageDisplayName..."

    if (Test-ProgramInstalled -programName $packageDisplayName) {
        Write-Success "$packageDisplayName is already installed"
        return $true
    }

    Write-Info "Installing $packageDisplayName..."
    try {
        $installCmd = "choco install $packageName -y --no-progress --ignore-checksums"
        if ($packageArgs) {
            $installCmd += " $packageArgs"
        }

        $output = Invoke-Expression $installCmd 2>&1 | Out-String

        if ($LASTEXITCODE -eq 0) {
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                       [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Success "$packageDisplayName installed successfully"
            if ($needsReboot) {
                $script:needsReboot = $true
                Write-WarningMsg "A system reboot will be required to complete the installation of $packageDisplayName"
            }
            return $true
        } else {
            Write-Err "Failed to install $packageDisplayName. Exit code: $LASTEXITCODE"
            Write-Err "Command output: $output"
            return $false
        }
    } catch {
        Write-Err ("Error installing {0}: {1}" -f $packageDisplayName, $_)
        return $false
    }
}

# Function to install Node.js and npm packages
function Install-NodeDependencies {
    param(
        [string]$projectPath = "./ytapp"
    )

    Write-Info "Installing Node.js dependencies..."

    try {
        if (Test-Path $projectPath) {
            Push-Location $projectPath
        } else {
            Write-WarningMsg "Project directory not found at $projectPath. Creating it..."
            New-Item -ItemType Directory -Path $projectPath -Force
            Push-Location $projectPath
            if (-not (Test-Path "package.json")) {
                npm init -y
            }
        }

        Write-Info "Running npm install..."
        npm install

        Write-Info "Installing Tauri CLI..."
        npm install -g @tauri-apps/cli

        Pop-Location
        Write-Success "Node.js dependencies installed successfully"
        return $true
    } catch {
        Write-Err ("Error installing Node.js dependencies: {0}" -f $_)
        Pop-Location -ErrorAction SilentlyContinue
        return $false
    }
}

# Function to install Rust components
function Install-RustComponents {
    Write-Info "Installing Rust components..."
    try {
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                   [System.Environment]::GetEnvironmentVariable("Path","User") + ";" +
                   "$env:USERPROFILE\.cargo\bin"

        rustup default stable
        rustup update
        rustup target add wasm32-unknown-unknown
        rustup component add rust-src
        rustup component add rustfmt
        rustup component add clippy

        cargo install tauri-cli

        Write-Success "Rust components installed successfully"
        return $true
    } catch {
        Write-Err ("Error installing Rust components: {0}" -f $_)
        return $false
    }
}

# Function to install MinGW
function Install-MinGW {
    Write-Info "Installing MinGW for required build tools..."
    try {
        if (Test-CommandExists "gcc") {
            Write-Success "MinGW is already installed"
            return $true
        }

        $result = Install-Package -packageName "mingw" -packageDisplayName "MinGW" -needsReboot:$false -packageArgs "--params /NoPath"

        if ($result) {
            $mingwPath = "C:\\mingw64";
            $env:Path = "$mingwPath\bin;" + $env:Path
            [System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)

            if (Test-CommandExists "gcc") {
                Write-Success "MinGW installed successfully"
                return $true
            }
        }

        Write-Err "Failed to install MinGW"
        return $false
    } catch {
        Write-Err ("Error installing MinGW: {0}" -f $_)
        return $false
    }
}

# Function to install Visual Studio Build Tools
function Install-VisualStudioBuildTools {
    Write-Info "Installing Visual Studio Build Tools..."
    $vswherePath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"

    if (-not (Test-Path $vswherePath)) {
        Write-WarningMsg "vswhere.exe not found. Visual Studio Build Tools may not be properly installed."
        Write-WarningMsg "Attempting to continue, but you may encounter build issues."
        return $true
    }

    $vsPath = & $vswherePath -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath -errorAction SilentlyContinue

    if ($vsPath) {
        Write-Success "Visual Studio Build Tools are already installed at $vsPath"
        return $true
    }

    $chocoPath = (Get-Command choco -ErrorAction SilentlyContinue).Source
    if (-not $chocoPath) {
        $chocoPath = "$env:ProgramData\chocolatey\bin\choco.exe"
        if (-not (Test-Path $chocoPath)) {
            Write-Err "Chocolatey executable not found. Please install Chocolatey first."
            return $false
        }
    }

    Write-Info "Installing Visual Studio Build Tools (this may take a while, please be patient)..."
    try {
        $vsParams = @(
            "--add Microsoft.VisualStudio.Workload.VCTools",
            "--add Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
            "--add Microsoft.VisualStudio.Component.Windows10SDK",
            "--includeRecommended",
            "--passive",
            "--norestart",
            "--wait"
        ) -join ' '

        Write-Info "Running: $chocoPath install visualstudio2022buildtools -y --no-progress --ignore-checksums --package-parameters=\"$vsParams\""
        $process = Start-Process -FilePath $chocoPath -ArgumentList "install visualstudio2022buildtools -y --no-progress --ignore-checksums --package-parameters=\"$vsParams\"" -NoNewWindow -PassThru -Wait

        if ($process.ExitCode -ne 0) {
            Write-WarningMsg "Visual Studio Build Tools installation returned exit code $($process.ExitCode). Checking if installation was actually successful..."

            $vsPath = & $vswherePath -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath -errorAction SilentlyContinue
            if ($vsPath) {
                Write-Success "Visual Studio Build Tools were successfully installed at $vsPath"
                return $true
            }

            throw "Visual Studio Build Tools installation failed with exit code $($process.ExitCode)"
        }

        return $true
    } catch {
        Write-Err ("Error installing Visual Studio Build Tools: {0}" -f $_)
        Write-WarningMsg "You may need to install Visual Studio Build Tools manually from: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
        return $false
    }
}

# Function to build the project
function Build-Project {
    param(
        [string]$projectPath = "./ytapp"
    )

    Write-Info "Building the project..."

    try {
        if (-not (Test-Path $projectPath)) {
            Write-Err "Project directory not found at $projectPath"
            return $false
        }

        Push-Location $projectPath

        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing Node.js dependencies..."
            npm install
        }

        Write-Info "Running build..."
        npm run tauri build

        $buildSuccess = $LASTEXITCODE -eq 0

        if ($buildSuccess) {
            $releaseDir = "$PSScriptRoot\ytapp\src-tauri\target\release"
            Write-Success "Build completed successfully!"
            Write-Host "You can find the executable in: $releaseDir" -ForegroundColor Green
            return $true
        } else {
            Write-Err "Build failed. Check the error messages above for details."
            return $false
        }
    } catch {
        Write-Err ("Error building project: {0}" -f $_)
        return $false
    } finally {
        Pop-Location -ErrorAction SilentlyContinue
    }
}

Write-Host "=== YoutubeAutomation Setup for Windows ===" -ForegroundColor Cyan
Write-Host "This script will install all necessary dependencies and set up the development environment." -ForegroundColor Cyan
Write-Host "Please run this script as Administrator." -ForegroundColor Yellow
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Err "This script must be run as Administrator. Please restart PowerShell as Administrator and try again."
    exit 1
}

$script:needsReboot = $false

if (-not (Install-Chocolatey)) {
    Write-Err "Failed to install Chocolatey. Please install it manually and run this script again."
    exit 1
}

if (-not (Install-MinGW)) {
    Write-WarningMsg "MinGW installation failed. Some build tools might be missing."
}

$packages = @(
    @{Name = "nodejs-lts"; DisplayName = "Node.js LTS"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "rust"; DisplayName = "Rust"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "microsoft-edge-webview2-runtime"; DisplayName = "Microsoft Edge WebView2 Runtime"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "gtk-runtime"; DisplayName = "GTK Runtime"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "ffmpeg"; DisplayName = "FFmpeg"; NeedsReboot = $false; Args = '--ignore-checksums'}
)

if (-not (Install-VisualStudioBuildTools)) {
    Write-Err "Failed to install Visual Studio Build Tools"
    exit 1
}

foreach ($pkg in $packages) {
    if ($pkg.Args) {
        Install-Package -packageName $pkg.Name -packageDisplayName $pkg.DisplayName -needsReboot:$pkg.NeedsReboot -packageArgs $pkg.Args
    } else {
        Install-Package -packageName $pkg.Name -packageDisplayName $pkg.DisplayName -needsReboot:$pkg.NeedsReboot
    }
}

Write-Info "Setting up environment variables..."
try {
    $pkgPath = "$Env:ChocolateyInstall\lib\gtk-runtime\tools\lib\pkgconfig"
    if (-not (Test-Path $pkgPath)) {
        Write-WarningMsg "GTK runtime path not found at $pkgPath"
    } else {
        [System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', $pkgPath, [System.EnvironmentVariableTarget]::Machine)
        $env:PKG_CONFIG_PATH = $pkgPath
        Write-Success "Set PKG_CONFIG_PATH to $pkgPath"
        try {
            "PKG_CONFIG_PATH=$pkgPath" | Out-File -Encoding ASCII -NoNewline "$PSScriptRoot/.env.tauri"
            Write-Info ".env.tauri updated"
        } catch {
            Write-WarningMsg "Failed to write .env.tauri: $_"
        }
    }

    $cargoBin = "$env:USERPROFILE\.cargo\bin"
    $newPath = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path","User") + ";" +
              $cargoBin

    if ($env:Path -notlike "*$cargoBin*") {
        $env:Path = $newPath
        Write-Success "Updated PATH to include Rust and Cargo"
    }
} catch {
    Write-Err ("Error setting up environment variables: {0}" -f $_)
}

if (-not (Install-RustComponents)) {
    Write-Err "Failed to install Rust components"
    exit 1
}

if (-not (Install-NodeDependencies)) {
    Write-Err "Failed to install Node.js dependencies"
    exit 1
}

Write-Info "Verifying installation..."
$driveName = if ($PWD -and $PWD.Drive) { $PWD.Drive.Name } else { 'C' }
$disk = Get-PSDrive -Name $driveName
$requiredSpaceGB = 10
if (($disk.Free / 1GB) -lt $requiredSpaceGB) {
    Write-WarningMsg "Low disk space detected. At least ${requiredSpaceGB}GB free space is recommended."
    Write-WarningMsg "Current free space: $([math]::Round($disk.Free / 1GB, 2))GB"
}

$osInfo = Get-CimInstance -ClassName Win32_OperatingSystem
$totalRamGB = [math]::Round($osInfo.TotalVisibleMemorySize / 1MB, 2)
if ($totalRamGB -lt 8) {
    Write-WarningMsg "Low system memory detected. At least 8GB RAM is recommended."
    Write-WarningMsg "Current RAM: ${totalRamGB}GB"
}

$tools = @(
    @{Name = "Node.js"; Command = "node --version"; Required = $true},
    @{Name = "npm"; Command = "npm --version"; Required = $true},
    @{Name = "Rust"; Command = "rustc --version"; Required = $true},
    @{Name = "Cargo"; Command = "cargo --version"; Required = $true},
    @{Name = "Tauri CLI"; Command = "tauri --version"; Required = $true},
    @{Name = "Python"; Command = "python --version"; Required = $false},
    @{Name = "Git"; Command = "git --version"; Required = $false}
)

$allToolsInstalled = $true
$missingRequiredTools = @()

foreach ($tool in $tools) {
    try {
        $version = Invoke-Expression $tool.Command 2>&1 | Select-Object -First 1
        if ($LASTEXITCODE -eq 0 -or $?) {
            Write-Success ("{0,-12} installed: {1}" -f $tool.Name, $version.Trim())
        } else {
            $msg = "{0} not found" -f $tool.Name
            if ($tool.Required) {
                Write-Err $msg
                $missingRequiredTools += $tool.Name
                $allToolsInstalled = $false
            } else {
                Write-WarningMsg $msg
            }
        }
    } catch {
        $msg = "{0} not found" -f $tool.Name
        if ($tool.Required) {
            Write-Err $msg
            $missingRequiredTools += $tool.Name
            $allToolsInstalled = $false
        } else {
            Write-WarningMsg $msg
        }
    }
}

$installTime = (Get-Date) - $installStartTime
$installTimeFormatted = "{0:hh\:mm\:ss}" -f [timespan]::fromseconds($installTime.TotalSeconds)

Write-Host ""; Write-Host "=== Setup Completed in $installTimeFormatted ===" -ForegroundColor Green
Write-Host "`n=== System Information ===" -ForegroundColor Cyan
Write-Host ("{0,-20}: {1}" -f "OS Version", $osInfo.Caption)
Write-Host ("{0,-20}: {1}GB" -f "Total RAM", $totalRamGB)
Write-Host ("{0,-20}: {1}GB" -f "Free Disk Space", [math]::Round($disk.Free / 1GB, 2))

if ($missingRequiredTools.Count -gt 0) {
    Write-Host "`n=== Missing Required Tools ===" -ForegroundColor Red
    $missingRequiredTools | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
    Write-Host "`nPlease install the missing tools and try again." -ForegroundColor Red
}

if ($script:needsReboot) {
    Write-Host "A system reboot is required to complete the installation." -ForegroundColor Yellow
    $reboot = Read-Host "Do you want to restart your computer now? (y/n)"
    if ($reboot -eq 'y' -or $reboot -eq 'Y') {
        Restart-Computer -Force
    } else {
        Write-Host "Please restart your computer when convenient to complete the installation." -ForegroundColor Yellow
    }
}

if ($allToolsInstalled) {
    Write-Host "All dependencies have been installed successfully!" -ForegroundColor Green

    if (Build-Project) {
        Write-Host "`nSetup completed successfully!" -ForegroundColor Green
        Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
        Write-Host "1. Run the application in development mode:" -ForegroundColor Cyan
        Write-Host "   cd ytapp" -ForegroundColor Cyan
        Write-Host "   npm run tauri dev" -ForegroundColor Cyan
        Write-Host "`n2. Or run the built executable from:" -ForegroundColor Cyan
        Write-Host "   $PSScriptRoot\ytapp\src-tauri\target\release" -ForegroundColor Cyan
        Write-Host "`n3. If you encounter any issues, try restarting your terminal or computer" -ForegroundColor Yellow
    } else {
        Write-Host "`nDependencies were installed, but the project build failed." -ForegroundColor Yellow
        Write-Host "You can try building manually with:" -ForegroundColor Yellow
        Write-Host "  cd ytapp" -ForegroundColor Yellow
        Write-Host "  npm run tauri build" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "`nSome tools failed to install. Please check the error messages above." -ForegroundColor Red
    exit 1
}
