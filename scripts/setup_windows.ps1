# === YoutubeAutomation Setup for Windows - Simplified & Robust ===
# This script installs all necessary dependencies and sets up the development environment.
# It MUST be run from an elevated PowerShell terminal (Run as Administrator).

# Exit on any error
$ErrorActionPreference = "Stop"

# Script self-elevation check
function Test-IsAdmin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Error "This script requires Administrator privileges. Please re-run from an elevated PowerShell terminal."
    exit 1
}

# Define project root
$ProjectRoot = (Get-Item -Path $PSScriptRoot).Parent.FullName
$AppPath = Join-Path $ProjectRoot "ytapp"

# --- Helper Functions for Logging ---
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# --- Dependency Installation ---
if ($env:YTA_USE_LEGACY_BOOTSTRAP -eq '1') {

# 1. Chocolatey
Write-Info "Checking for Chocolatey..."
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Info "Chocolatey not found. Installing..."
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Err "Chocolatey installation failed. Please install it manually and re-run the script."
        exit 1
    }
} else {
    Write-Success "Chocolatey is already installed."
}

# 2. Core Dependencies via Chocolatey
$chocoPackages = @(
    "nodejs-lts",
    "rust",
    "cmake",
    "llvm",
    "nasm",
    "webview2-runtime",
    "gtk-runtime",
    "ffmpeg",
    "visualstudio2022-workload-vctools"
)

Write-Info "Installing core dependencies via Chocolatey. This may take a while..."
foreach ($pkg in $chocoPackages) {
    Write-Info "Checking for $pkg..."
    # The --exact flag ensures we only match the package name precisely.
    choco search $pkg --local-only --exact | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Installing $pkg..."
        choco install $pkg -y
    } else {
        Write-Success "$pkg is already installed."
    }
}
Write-Success "All core dependencies installed."

# 3. Rust components
Write-Info "Installing Rust components..."
rustup self update
rustup toolchain install stable
rustup update stable
rustup target add wasm32-unknown-unknown
rustup component add rust-src rustfmt clippy
Write-Success "Rust components installed."

# 4. Tauri CLI
Write-Info "Checking for tauri-cli..."
# tauri-cli installs the binary as 'cargo-tauri.exe'. Prefer detecting that.
if (-not (Get-Command cargo-tauri -ErrorAction SilentlyContinue)) {
    Write-Info "Installing tauri-cli..."
    cargo install tauri-cli
    Write-Success "tauri-cli installed."
} else {
    Write-Success "tauri-cli is already installed."
    Write-Info "Checking for tauri-cli updates..."
    cargo install tauri-cli # This will update if a newer version is available
    Write-Success "tauri-cli is up to date."
}

# --- Project Setup ---

# 5. Node.js dependencies
Write-Info "Setting up Node.js dependencies at $AppPath..."
if (-not (Test-Path $AppPath)) {
    Write-Err "Project path not found at $AppPath. Cannot continue."
    exit 1
}
Push-Location $AppPath
Write-Info "Cleaning previous node_modules..."
if (Test-Path ".\node_modules") { Remove-Item -Recurse -Force ".\node_modules" }
Write-Info "Running npm install..."
npm install
Write-Success "Node.js dependencies installed."

# 6. Final Build
Write-Info "Building the project..."
npm run build
Write-Success "Project build completed successfully!"

Pop-Location

Write-Host "`n`n=== YoutubeAutomation Setup Complete! ===" -ForegroundColor Green
Write-Host "The development environment is ready."
Write-Host "To run the app in development mode:" -ForegroundColor Cyan
Write-Host "  cd ytapp" -ForegroundColor Cyan
Write-Host "  npm run tauri:dev" -ForegroundColor Cyan
}

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

function Verify-NodeJS {
    param()
    # Check common Node.js installation paths
    $nodePaths = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs",
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs"
    )
    
    foreach ($path in $nodePaths) {
        if (Test-Path $path) {
            if ($env:Path -notlike "*$path*") {
                $env:Path = "$path;" + $env:Path
                [System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)
                Write-Success "Added Node.js path: $path"
            }
        }
    }
    
    # Force PATH refresh from registry
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + 
                [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Verify node is available
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js verified: $nodeVersion"
        return $true
    }
    
    Write-Err "Node.js not found in PATH"
    return $false
}

function Copy-WhisperLibrary {
    param (
        [string]$sourceFile,
        [string]$targetPath,
        [switch]$force
    )
    try {
        if (-not (Test-Path $sourceFile)) {
            Write-DebugMsg "Source file not found: $sourceFile"
            return $false
        }
        
        $targetDir = Split-Path $targetPath -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }

        Copy-Item $sourceFile $targetPath -Force:$force
        if (Test-Path $targetPath) {
            Write-DebugMsg "Successfully copied library to: $targetPath"
            return $true
        } else {
            Write-WarningMsg "Failed to copy library to: $targetPath"
            return $false
        }        } catch {
            $errorMessage = $_.Exception.Message
            Write-WarningMsg "Error copying library from $sourceFile to $targetPath`: $errorMessage"
            return $false
        }
    }

    function Test-WhisperLibraries {
    param (
        [string[]]$paths
    )
    $missing = @()
    foreach ($path in $paths) {
        if (-not (Test-Path $path)) {
            $missing += $path
        }
    }
    return $missing
}

function Find-WhisperLibrary {
    param (
        [string]$startPath = ".",
        [string[]]$additionalPaths
    )
    
    $searchPaths = @($startPath) + $additionalPaths
    $foundFiles = @()
    
    # Known library names
    $libraryNames = @("libwhisper.a", "whisper.lib", "libwhisper.lib")
    
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            try {
                $files = Get-ChildItem -Path $path -Recurse -Include $libraryNames -ErrorAction SilentlyContinue
                $foundFiles += $files
            } catch {
                Write-DebugMsg "Error searching in path $path`: $_"
            }
        }
    }
    
    return $foundFiles | Select-Object -Unique
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

# Function to clean PATH entries
function Clean-Path {
    param([string]$pathString)
    # Split path into unique entries, removing empty and duplicate entries
    $paths = $pathString -split ';' | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique
    return ($paths -join ';')
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
            # Get current paths and clean them
            $machinePath = Clean-Path ([System.Environment]::GetEnvironmentVariable("Path", "Machine"))
            $userPath = Clean-Path ([System.Environment]::GetEnvironmentVariable("Path", "User"))
            
            # Update session path carefully
            try {
                $env:Path = "$machinePath;$userPath"
            } catch {
                Write-WarningMsg "Could not update session PATH: $_"
            }
            
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
        # Clean any previous failed installs
        if (Test-Path "$projectPath\node_modules") {
            Write-Info "Cleaning previous node_modules..."
            Remove-Item -Recurse -Force "$projectPath\node_modules" -ErrorAction Stop
        }

        # Ensure Node.js is properly in PATH
        if (-not (Ensure-NodePath)) {
            Write-Err "Failed to set up Node.js environment"
            return $false
        }

        # Force environment refresh
        Update-SessionEnvironment

        # Verify Node.js and npm are working
        $nodePath = Split-Path -Parent (Get-Command node -ErrorAction SilentlyContinue).Source
        if (-not $nodePath) {
            Write-Err "Node.js not found in PATH even after setup"
            return $false
        }

        # Get npm.cmd path directly
        $npmCmd = Join-Path $nodePath "npm.cmd"

        # Install all Node project dependencies (Vite included)
        Push-Location $projectPath
        try {


            Write-Info "Running npm install (this may take a couple minutes)..."
            & $npmCmd install
            if ($LASTEXITCODE -ne 0) {
                Write-Err "npm install failed with exit code $LASTEXITCODE"
                return $false
            }
            Write-Success "npm install completed successfully"
        }
        finally {
            Pop-Location
        }

        return $true
    }
    catch {
        Write-Err ("Error installing Node.js dependencies: {0}" -f $_)
        return $false
    }
}

function Invoke-Rust {
param(
    [string]$RustArgs,
    [int[]] $OkExitCodes = @(0)
)

if ([string]::IsNullOrWhiteSpace($RustArgs)) {
    Write-Err "Invalid argument: 'RustArgs' cannot be null or empty."
    return $false
}

# Pass the full argument string as a single argument to Start-Process
$proc = Start-Process -FilePath "rustup.exe" -ArgumentList $RustArgs `
          -NoNewWindow -Wait -PassThru -RedirectStandardOutput "stdout.tmp" `
          -RedirectStandardError  "stderr.tmp"

$stdout = Get-Content .\stdout.tmp
$stderr = Get-Content .\stderr.tmp
Remove-Item .\stdout.tmp, .\stderr.tmp


if ($OkExitCodes -contains $proc.ExitCode) {
    Write-Host "[SUCCESS] rustup $RustArgs" -ForegroundColor Green
    if ($stderr) { Write-Verbose ($stderr -join "`n") }   # optional: surface info when -Verbose
    return $true
}

Write-Host "[ERROR] rustup $RustArgs exited $($proc.ExitCode)`n$stderr" -ForegroundColor Red
return $false
}

# Function to install Rust components
function Install-RustComponents {
    Write-Info "Installing Rust components..."

    # Self-update rustup
    if (-not (Invoke-Rust 'self update')) { return $false }

    # Ensure stable toolchain is installed and up to date
    if (-not (Invoke-Rust 'toolchain install stable')) { return $false }
    if (-not (Invoke-Rust 'update stable')) { return $false }

    # Add required target and components
    $rustSteps = @(
        'target add wasm32-unknown-unknown',
        'component add rust-src',
        'component add rustfmt',
        'component add clippy'
    )
    foreach ($step in $rustSteps) {
        if (-not (Invoke-Rust $step)) { return $false }
    }

    # Install tauri-cli
    Write-Info "Installing tauri-cli. This can take several minutes for the initial setup, please be patient..."
    $process = Start-Process cargo -ArgumentList "install tauri-cli" -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Success "tauri-cli installed/verified successfully"
    } else {
        Write-Err "Failed to install tauri-cli. Please check the cargo output above for errors."
        return $false
    }

    Write-Success "Rust components installed successfully"
    return $true
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


    $vsPath = & $vswherePath -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath

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


            $vsPath = & $vswherePath -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
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
        # Force environment refresh before build
        Update-SessionEnvironment

        # Ensure Node.js is properly in PATH
        if (-not (Ensure-NodePath)) {
            Write-Err "Failed to set up Node.js environment for build"
            return $false
        }

        # Get absolute paths for node and npm
        $nodePath = Split-Path -Parent (Get-Command node -ErrorAction SilentlyContinue).Source
        if (-not $nodePath) {
            Write-Err "Node.js not found in PATH even after setup"
            return $false
        }

        $nodeExe = Join-Path $nodePath "node.exe"
        $npmCmd = Join-Path $nodePath "npm.cmd"

        # Ensure we're working with absolute paths
        $projectPath = if ([System.IO.Path]::IsPathRooted($projectPath)) {
            $projectPath
        } else {
            Join-Path $PWD $projectPath
        }

        if (-not (Test-Path $projectPath)) {
            Write-Err "Project directory not found at $projectPath"
            return $false
        }

        Push-Location $projectPath
        try {
            # Prepare logs directory for optional quiet mode output
            $logsDir = Join-Path $projectPath ".logs"
            if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }
            $viteLog = Join-Path $logsDir "vite-build.log"
            $tauriLog = Join-Path $logsDir "tauri-build.log"

            Write-Info "Building frontend..."
            if ($env:YTA_QUIET -eq '1') {
                Write-Info "Quiet mode on; logging Vite output to $viteLog"
                $viteProc = Start-Process -FilePath $npmCmd -ArgumentList "run build" `
                    -NoNewWindow -Wait -PassThru -RedirectStandardOutput $viteLog -RedirectStandardError $viteLog
                if ($viteProc.ExitCode -ne 0) {
                    Write-Err "Frontend build failed (see $viteLog)"
                    return $false
                }
            } else {
                & $npmCmd run build
                if ($LASTEXITCODE -ne 0) {
                    Write-Err "Frontend build failed with exit code $LASTEXITCODE"
                    return $false
                }
            }

            # Verify dist directory exists
            $distDir = Join-Path $projectPath "dist"
            if (-not (Test-Path $distDir)) {
                Write-Err "Frontend build did not produce dist directory"
                return $false
            }

            # Clear problematic CMake generator overrides that cause MSVC build failures
            $cmakeVars = @('CMAKE_GENERATOR','CMAKE_GENERATOR_TOOLSET','CMAKE_GENERATOR_PLATFORM','CMAKE_MAKE_PROGRAM')
            foreach ($v in $cmakeVars) {
                if (Test-Path "Env:\$v") {
                    $varValue = Get-Item "Env:$v" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Value
                    Write-Info "Unsetting $v (was '$varValue')"
                    Remove-Item "Env:\$v" -ErrorAction SilentlyContinue
                }
            }
            # Also clear compiler overrides that force MinGW/gnu toolchains
            $compilerVars = @('CC','CXX','AR','RANLIB')
            foreach ($v in $compilerVars) {
                if (Test-Path "Env:\$v") {
                    $varValue = Get-Item "Env:$v" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Value
                    Write-Info "Unsetting $v (was '$varValue')"
                    Remove-Item "Env:\$v" -ErrorAction SilentlyContinue
                }
            }
            # Prefer Visual Studio generator explicitly to avoid MinGW on systems with both installed
            $env:CMAKE_GENERATOR = "Visual Studio 17 2022"

            # Ensure aws-lc-sys uses C11 on MSVC (fixes C atomics error)
            $env:AWS_LC_SYS_C_STD = "11"
            # Import VS developer environment for MSVC toolchain & Windows SDK
            Import-VsDevCmdEnv
            # Ensure rustup cargo shim is first in PATH
            Ensure-RustupCargoFirst
            # Use a short Cargo target dir to avoid long path issues on Windows
            Ensure-ShortTargetDir
            # Final diagnostics before building
            Diagnose-BuildEnv

            # Clean Rust artifacts to avoid incompatible crate cache issues
            Write-Info "Cleaning Rust build artifacts..."
            Push-Location (Join-Path $projectPath "src-tauri")
            try {
                rustup run 1.88.0-x86_64-pc-windows-msvc cargo clean
            } finally {
                Pop-Location
            }

            # Ensure Windows icon exists to satisfy tauri-build on Windows
            $srcTauriDir = Join-Path $projectPath "src-tauri"
            $iconIco = Join-Path $srcTauriDir "icons\icon.ico"
            $iconPng = Join-Path $srcTauriDir "icons\icon.png"
            if (-not (Test-Path $iconIco)) {
                if (Test-Path $iconPng) {
                    Write-Info "Generating icon.ico from icon.png..."
                    Push-Location $srcTauriDir
                    try {
                        rustup run 1.88.0-x86_64-pc-windows-msvc cargo tauri icon "icons\icon.png"
                    } finally { Pop-Location }
                } else {
                    Write-WarningMsg "icons\\icon.png not found; skipping icon generation"
                }
            }

            Write-Info "Running Tauri build..."
            $env:TAURI_PRIVATE_KEY = $null # Ensure we're not using any stale signing keys
            if ($env:YTA_QUIET -eq '1') {
                Write-Info "Quiet mode on; logging Tauri build to $tauriLog"
                $buildProc = Start-Process -FilePath "rustup" -ArgumentList "run 1.88.0-x86_64-pc-windows-msvc cargo tauri build" `
                    -NoNewWindow -Wait -PassThru -RedirectStandardOutput $tauriLog -RedirectStandardError $tauriLog
                $buildSuccess = ($buildProc.ExitCode -eq 0)
            } else {
                $buildProc = Start-Process -FilePath "rustup" -ArgumentList "run 1.88.0-x86_64-pc-windows-msvc cargo tauri build" -NoNewWindow -Wait -PassThru
                $buildSuccess = ($buildProc.ExitCode -eq 0)
            }

        if ($buildSuccess) {
            $releaseDir = Join-Path $projectPath "src-tauri\target\release"
            if (Test-Path $releaseDir) {
                Write-Success "Build completed successfully!"
                Write-Success "You can find the executable in: $releaseDir"
            }
            return $true
        } else {
            Write-Err "Build failed. Check the error messages above for details."
            return $false
        }
        }
        finally {
            Pop-Location
        }
    } catch {
        Write-Err ("Error building project: {0}" -f $_)
        return $false
    }
}

# Function to refresh PATH environment
function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + 
                [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# Function to run npm commands with refreshed PATH
function Run-NPMCommand {
    param([string]$Command)
    Refresh-Path
    $npmCmd = "npm $Command"
    Invoke-Expression $npmCmd
    return $LASTEXITCODE -eq 0
}

function Setup-Environment {
    # Set up Node.js environment
    $nodePath = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($nodePath) {
        $nodeDir = Split-Path $nodePath -Parent
        if ($env:Path -notlike "*$nodeDir*") {
            $env:Path = "$nodeDir;" + $env:Path
            [System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)
        }
    }

    # Set up npm cache and prefix
    $npmConfig = npm config get prefix
    if ($LASTEXITCODE -eq 0) {
        $npmPrefix = $npmConfig.Trim()
        if ($env:Path -notlike "*$npmPrefix*") {
            $env:Path = "$npmPrefix;" + $env:Path
            [System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)
        }
    }

    # Force PATH refresh
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + 
                [System.Environment]::GetEnvironmentVariable("Path", "User")
                
    # Verify environment
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js environment verified: $nodeVersion"
        return $true
    }
    
    Write-Err "Failed to verify Node.js environment"
    return $false
}

function Setup-NodeEnvironment {
    # Get Node.js installation path from registry
    $nodePath = (Get-ItemProperty "HKLM:\SOFTWARE\Node.js" -ErrorAction SilentlyContinue).InstallPath
    if (-not $nodePath) {
        $nodePath = "C:\Program Files\nodejs"
    }

    # Update both user and machine PATH
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

    if ($nodePath -and (Test-Path $nodePath)) {
        if ($userPath -notlike "*$nodePath*") {
            [System.Environment]::SetEnvironmentVariable("Path", "$nodePath;$userPath", "User")
        }
        if ($machinePath -notlike "*$nodePath*") {
            [System.Environment]::SetEnvironmentVariable("Path", "$nodePath;$machinePath", "Machine")
        }
        
        # Update current session PATH
        $env:Path = "$nodePath;" + $env:Path
        
        Write-Success "Node.js path configured: $nodePath"
        return $true
    }
    
    Write-Err "Node.js installation path not found"
    return $false
}

function Set-NodePath {
    $nodePaths = @(
        "C:\Program Files\nodejs",
        "${env:ProgramFiles}\nodejs",
        "${env:ProgramFiles(x86)}\nodejs"
    )
    
    # Find the actual Node.js installation
    $nodePath = $null
    foreach ($path in $nodePaths) {
        if (Test-Path "$path\node.exe") {
            $nodePath = $path
            break
        }
    }
    
    if (-not $nodePath) {
        Write-Err "Could not find Node.js installation"
        return $false
    }
    
    # Update PATH in all possible locations
    $paths = @(
        [System.Environment]::GetEnvironmentVariable("Path", "Machine"),
        [System.Environment]::GetEnvironmentVariable("Path", "User"),
        $env:Path
    )
    
    foreach ($path in $paths) {
        if ($path -notlike "*$nodePath*") {
            # Add Node.js path if it's not there
            $newPath = "$nodePath;$path"
            if ($path -eq $paths[0]) {
                [System.Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
            }
            elseif ($path -eq $paths[1]) {
                [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
            }
            $env:Path = "$nodePath;$env:Path"
        }
    }
    
    # Force refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + 
                [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Verify node is available
    try {
        $nodeVersion = & "$nodePath\node.exe" --version
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Node.js path configured: $nodePath (Version: $nodeVersion)"
            return $true
        }
    }
    catch {
        Write-Err "Failed to verify Node.js: $_"
    }
    
    return $false
}

function Ensure-NodePath {
    Write-Info "Ensuring Node.js is in PATH..."
    
    # Get Node.js installation path from multiple possible locations
    $nodePaths = @(
        (Get-ItemProperty "HKLM:\SOFTWARE\Node.js" -ErrorAction SilentlyContinue).InstallPath,
        "C:\Program Files\nodejs",
        "${env:ProgramFiles}\nodejs",
        "${env:ProgramFiles(x86)}\nodejs"
    ) | Where-Object { $_ -and (Test-Path (Join-Path $_ "node.exe")) }

    $nodePath = $nodePaths | Select-Object -First 1
    if (-not $nodePath) {
        Write-Err "Could not find Node.js installation"
        return $false
    }

    # Ensure npm is present; bootstrap via Corepack if missing (Node 20+)
    if (-not (Test-Path (Join-Path $nodePath "npm.cmd"))) {
        Write-WarningMsg "npm not found; installing via Corepack..."
        & "$nodePath\corepack.cmd" prepare npm@latest --activate
    }

    # Add npm global bin to path
    $npmPrefix = ""
    try {
        # Ensure we use the node.exe we found to run npm
        $npmPrefix = & "$nodePath\npm.cmd" prefix -g
        if ($LASTEXITCODE -eq 0) {
            $npmBinPath = Join-Path $npmPrefix "node_modules\npm\bin"
            if (Test-Path $npmBinPath) {
                if ($env:Path -notlike "*$npmBinPath*") {
                    $env:Path = "$npmBinPath;$env:Path"
                }
            }
        }
    } catch {
        Write-WarningMsg "Could not determine npm prefix: $_"
    }

    # Update PATH in current session
    $env:Path = "$nodePath;$env:Path"

    # Update USER path if Node.js path is missing
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$nodePath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$nodePath;$userPath", "User")
    }

    # Update SYSTEM path if Node.js path is missing
    $systemPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($systemPath -notlike "*$nodePath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$nodePath;$systemPath", "Machine")
    }

    # Verify node and npm are available
    try {
        $nodeVersion = & "$nodePath\node.exe" --version
        $npmVersion = & "$nodePath\npm.cmd" --version
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Node.js $nodeVersion and npm $npmVersion are available"
            return $true
        }
    } catch {
        Write-Err "Failed to verify Node.js installation: $_"
    }
    
    return $false
}

# Function to update environment variables in the current session
function Update-SessionEnvironment {
    Write-Info "Refreshing environment variables..."

    # Don't use Chocolatey's refreshenv as it can cause recursion
    # Instead, directly update the environment

    # Even if refreshenv succeeded, we'll do a manual update to be thorough
    $machineEnvPaths = [Environment]::GetEnvironmentVariable('Path', 'Machine') -split ';' | Where-Object { $_ }
    $userEnvPaths = [Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | Where-Object { $_ }
    
    # Combine and remove duplicates while preserving order
    $allPaths = @()
    $seen = @{
    }
    foreach ($path in @($userEnvPaths + $machineEnvPaths)) {
        if (-not $seen.ContainsKey($path.ToLower())) {
            $allPaths += $path
            $seen[$path.ToLower()] = $true
        }
    }

    # Update the current session
    $env:Path = $allPaths -join ';'

    # Update all environment variables
    foreach($level in "Machine","User") {
        [System.Environment]::GetEnvironmentVariables($level).GetEnumerator() | ForEach-Object {
            # Skip Path since we already handled it
            if ($_.Name -ne 'Path') {
                if (Test-Path "env:$($_.Name)") {
                    if ((Get-Content "env:$($_.Name)") -ne $_.Value) {
                        Set-Content "env:$($_.Name)" $_.Value
                    }
                } else {
                    Set-Content "env:$($_.Name)" $_.Value
                }
            }
        }
    }

    # Special handling for critical development paths
    $criticalPaths = @(
        "C:\Program Files\nodejs",
        "${env:ProgramFiles}\nodejs",
        "$env:ChocolateyInstall\bin",
        "$env:USERPROFILE\.cargo\bin"
    )

    foreach ($path in $criticalPaths) {
        if (Test-Path $path) {
            if ($env:Path -notlike "*$path*") {
                $env:Path = "$path;$env:Path"
            }
        }
    }

    Write-Success "Environment variables refreshed"
}

# Ensure rustup shim cargo is first in PATH so downstream tools (like tauri)
# pick it up when they spawn `cargo`.
function Ensure-RustupCargoFirst {
    try {
        $shimDir = Join-Path $env:USERPROFILE ".cargo\bin"
        if (-not (Test-Path $shimDir)) { return }

        $rebuild = {
            param($pathVal)
            $parts = @()
            if ($pathVal) { $parts = $pathVal -split ';' | Where-Object { $_ -and ($_ -ne $shimDir) } }
            return "$shimDir;" + ($parts -join ';')
        }

        $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

        [System.Environment]::SetEnvironmentVariable("Path", (& $rebuild $userPath), "User")
        [System.Environment]::SetEnvironmentVariable("Path", (& $rebuild $machinePath), "Machine")

        # Rebuild current session PATH explicitly
        $env:Path = (& $rebuild $env:Path)

        $cargoPath = (Get-Command cargo -ErrorAction SilentlyContinue).Source
        if ($cargoPath -and ($cargoPath -like 'C:\\ProgramData\\chocolatey\\bin\\cargo.exe')) {
            Write-WarningMsg "Chocolatey cargo shim detected; de-prioritizing for this session"
            $env:Path = ($env:Path -split ';' | Where-Object { $_ -and ($_ -ne 'C:\\ProgramData\\chocolatey\\bin') }) -join ';'
            $cargoPath = (Get-Command cargo -ErrorAction SilentlyContinue).Source
        }
        if ($cargoPath) {
            Write-Info "Using cargo at: $cargoPath"
        } else {
            Write-WarningMsg "cargo not found in PATH after adjustment; ensure Rust is installed"
        }
    } catch {
        Write-WarningMsg "Failed to prioritize rustup cargo shim: $_"
    }
}

# Diagnostics for build prerequisites and environment
function Diagnose-BuildEnv {
    Write-Info "Diagnostics: verifying toolchain and build environment..."
    try {
        $cargoPath = (Get-Command cargo -ErrorAction SilentlyContinue).Source
        if ($cargoPath) { Write-Info "cargo path: $cargoPath" } else { Write-WarningMsg "cargo not in PATH" }

        $tool = (& rustup show active-toolchain 2>$null)
        if ($LASTEXITCODE -eq 0 -and $tool) { Write-Info ("active toolchain: {0}" -f $tool.Trim()) } else { Write-WarningMsg "active toolchain not resolved" }

        $sysroot = (& rustup run 1.88.0-x86_64-pc-windows-msvc rustc --print sysroot 2>$null)
        if ($LASTEXITCODE -eq 0 -and $sysroot) {
            Write-Info "sysroot: $sysroot"
            $coreDir = Join-Path $sysroot "lib\rustlib\x86_64-pc-windows-msvc\lib"
            $core = Get-ChildItem -Path $coreDir -Filter "core*.rlib" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($core) {
                Write-Success ("MSVC core stdlib found: {0}" -f $core.Name)
            } else {
                # Do not fail the setup if this probe is inconclusive; subsequent cargo build will verify.
                Write-WarningMsg "MSVC core stdlib not detected under $coreDir; continuing since build will verify"
            }
        } else {
            Write-WarningMsg "sysroot not resolved via rustup"
        }

        if ($env:VCINSTALLDIR) { Write-Success "VCINSTALLDIR set" } else { Write-WarningMsg "VCINSTALLDIR not set" }
        if ($env:WindowsSdkDir) { Write-Success "WindowsSdkDir set" } else { Write-WarningMsg "WindowsSdkDir not set" }
        if ($env:WindowsSDKVersion) { Write-Success "WindowsSDKVersion set" } else { Write-WarningMsg "WindowsSDKVersion not set" }

        $msbuild = Get-Command msbuild.exe -ErrorAction SilentlyContinue
        if ($msbuild) { Write-Info ("MSBuild: {0}" -f $msbuild.Source) } else { Write-WarningMsg "MSBuild not found in PATH" }
        $cl = Get-Command cl.exe -ErrorAction SilentlyContinue
        if ($cl) { Write-Info ("CL.exe: {0}" -f $cl.Source) } else { Write-WarningMsg "CL.exe not found in PATH" }
    } catch { Write-WarningMsg "Diagnostics failed: $_" }
}

# Import Visual Studio Developer Command Prompt environment (vcvars) so
# CMake/MSBuild picks up proper VC/SDK variables in this PowerShell session.
function Import-VsDevCmdEnv {
    try {
        $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
        if (-not (Test-Path $vswhere)) { Write-WarningMsg "vswhere.exe not found; skipping VS env import"; return }
        $vsPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
        if (-not $vsPath) { Write-WarningMsg "VS Build Tools not found by vswhere; skipping VS env import"; return }
        $vsDevCmd = Join-Path $vsPath "Common7\Tools\VsDevCmd.bat"
        if (-not (Test-Path $vsDevCmd)) { Write-WarningMsg "VsDevCmd.bat not found; skipping VS env import"; return }

        Write-Info "Importing Visual Studio developer environment..."
        $cmd = '"' + $vsDevCmd + '" -arch=x64 -host_arch=x64 >nul && set'
        $vars = & cmd.exe /c $cmd
        foreach ($line in $vars) {
            if ($line -match '^(.*?)=(.*)$') {
                $name = $matches[1]; $val = $matches[2]
                try { [System.Environment]::SetEnvironmentVariable($name, $val, 'Process'); Set-Item -Path "Env:$name" -Value $val -ErrorAction SilentlyContinue } catch {}
            }
        }
        Write-Success "VS developer environment imported"
    } catch {
        Write-WarningMsg "Failed to import VS dev environment: $_"
    }
}

# Shorten Cargo target dir to avoid long Windows paths causing MSBuild/CMake issues
function Ensure-ShortTargetDir {
    try {
        $shortDir = Join-Path $env:USERPROFILE ".ytarget"
        if (-not (Test-Path $shortDir)) { New-Item -ItemType Directory -Path $shortDir -Force | Out-Null }
        $env:CARGO_TARGET_DIR = $shortDir
        Write-Info "CARGO_TARGET_DIR set to $shortDir"
    } catch {
        Write-WarningMsg "Failed to set CARGO_TARGET_DIR: $_"
    }
}

# Ensure Rust uses the MSVC toolchain on Windows and the MSVC target is available
function Ensure-MsvcToolchain {
    Write-Info "Ensuring Rust MSVC toolchain is installed and active..."
    try {
        # Install and activate the MSVC toolchain explicitly (stable)
        Invoke-Rust 'toolchain install stable-x86_64-pc-windows-msvc' | Out-Null
        Invoke-Rust 'default stable-x86_64-pc-windows-msvc' | Out-Null
        Invoke-Rust 'target add x86_64-pc-windows-msvc' | Out-Null

        # Also install the project-pinned MSVC toolchain from rust-toolchain.toml
        # so builds use a consistent host/target pair.
        Invoke-Rust 'toolchain install 1.88.0-x86_64-pc-windows-msvc' | Out-Null
        Invoke-Rust 'target add x86_64-pc-windows-msvc --toolchain 1.88.0-x86_64-pc-windows-msvc' | Out-Null
        Write-Success "MSVC toolchain set as default (stable-x86_64-pc-windows-msvc)"
        return $true
    } catch {
        Write-WarningMsg "Could not ensure MSVC toolchain: $_"
        return $false
    }
}

# Write a Cargo config to force MSVC builds for this workspace
function Ensure-CargoMsvcConfig {
    param([string]$srcTauriPath)
    try {
        $cargoDir = Join-Path $srcTauriPath ".cargo"
        $cfgPath = Join-Path $cargoDir "config.toml"
        if (-not (Test-Path $cargoDir)) {
            New-Item -ItemType Directory -Path $cargoDir -Force | Out-Null
        }
        if (-not (Test-Path $cfgPath)) {
            Write-Info "Writing Cargo MSVC config at $cfgPath"
            @"
[build]
target = "x86_64-pc-windows-msvc"
"@ | Set-Content -Path $cfgPath -Encoding UTF8
        } else {
            Write-Info "Cargo MSVC config already present at $cfgPath"
        }
    } catch {
        Write-WarningMsg "Failed to write Cargo MSVC config: $_"
    }
}

# Ensure the Tauri CLI is available
function Ensure-TauriCli {
    Write-Info "Checking for tauri-cli (cargo tauri)..."
    try {
        & cargo tauri --version | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "tauri-cli is available"
            return $true
        }
    } catch {}
    Write-Info "Installing tauri-cli..."
    $proc = Start-Process rustup -ArgumentList "run 1.88.0-x86_64-pc-windows-msvc cargo install tauri-cli" -Wait -NoNewWindow -PassThru
    if ($proc.ExitCode -eq 0) {
        Write-Success "tauri-cli installed"
        return $true
    } else {
        Write-Err "Failed to install tauri-cli (exit $($proc.ExitCode))"
        return $false
    }
}

# Generate Windows .ico from the provided PNG if missing
function Ensure-TauriIcon {
    param([string]$srcTauriPath)
    $ico = Join-Path $srcTauriPath "icons\icon.ico"
    $png = Join-Path $srcTauriPath "icons\icon.png"
    if (-not (Test-Path $ico)) {
        if (Test-Path $png) {
            Write-Info "Generating Windows icon (icon.ico) from icon.png..."
            Push-Location $srcTauriPath
            try {
                & cargo tauri icon "icons\icon.png"
            } finally { Pop-Location }
        } else {
            Write-WarningMsg "icons\\icon.png not found; cannot generate icon.ico"
        }
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

Write-Info "Skipping MinGW installation to avoid MSVC/MinGW conflicts for Tauri builds."

$packages = @(
    @{Name = "nodejs-lts"; DisplayName = "Node.js LTS"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "rust"; DisplayName = "Rust"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "cmake"; DisplayName = "CMake"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "llvm"; DisplayName = "LLVM"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "nasm"; DisplayName = "NASM"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "webview2-runtime"; DisplayName = "Microsoft Edge WebView2 Runtime"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "gtk-runtime"; DisplayName = "GTK Runtime"; NeedsReboot = $false; Args = '--ignore-checksums'},
    @{Name = "ffmpeg"; DisplayName = "FFmpeg"; NeedsReboot = $false; Args = '--ignore-checksums'}
)

foreach ($pkg in $packages) {
    if ($pkg.Args) {
        Install-Package -packageName $pkg.Name -packageDisplayName $pkg.DisplayName -needsReboot:$pkg.NeedsReboot -packageArgs $pkg.Args
    } else {
        if ($pkg.Name -eq "nodejs-lts") {
            Write-Info "Installing or updating Node.js LTS via Chocolatey..."
            choco install nodejs-lts -y --force
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Failed to install Node.js LTS via Chocolatey."
                exit 1
            }
            Write-Success "Node.js LTS installed successfully."
            # Chocolatey handles the path, but we'll refresh the session env
            Update-SessionEnvironment
        } else {
            Install-Package -packageName $pkg.Name -packageDisplayName $pkg.DisplayName -needsReboot:$pkg.NeedsReboot
        }
    }
}

# Final PATH refresh - with cleanup to avoid length issues
function Clean-Path {
    param([string]$pathString)
    # Split path into unique entries, removing empty and duplicate entries
    $paths = $pathString -split ';' | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique
    return ($paths -join ';')
}

Write-Info "Cleaning up PATH environment variable..."
try {
    # Get and clean machine PATH
    $machinePath = Clean-Path ([System.Environment]::GetEnvironmentVariable("Path", "Machine"))
    [System.Environment]::SetEnvironmentVariable("Path", $machinePath, "Machine")
    
    # Get and clean user PATH
    $userPath = Clean-Path ([System.Environment]::GetEnvironmentVariable("Path", "User"))
    [System.Environment]::SetEnvironmentVariable("Path", $userPath, "User")
    
    # Set current session PATH
    $env:Path = "$machinePath;$userPath"
    
    Write-Success "PATH environment cleaned and updated"
} catch {
    Write-WarningMsg "Error updating PATH: $_"
    Write-WarningMsg "Continuing with installation, but you may need to clean up PATH manually"
}

Write-Success "Package installation completed"

# Install Visual Studio Build Tools
if (-not (Install-VisualStudioBuildTools)) {
    Write-Err "Failed to install Visual Studio Build Tools"
    exit 1
}

# Set the correct project path
$projectRoot = Split-Path -Parent $PSScriptRoot
$ytappPath = Join-Path $projectRoot "ytapp"

if (-not (Test-Path $ytappPath)) {
    Write-Err "Could not find ytapp directory at: $ytappPath"
    exit 1
}

# Ensure Rust uses MSVC and cargo is configured for MSVC target in this repo
Ensure-MsvcToolchain | Out-Null
Ensure-CargoMsvcConfig -srcTauriPath (Join-Path $ytappPath 'src-tauri')
Ensure-RustupCargoFirst

# Ensure this repo directory uses the pinned MSVC toolchain override
try {
    Push-Location (Join-Path $ytappPath 'src-tauri')
    & rustup override set 1.88.0-x86_64-pc-windows-msvc | Out-Null
    Pop-Location
    Write-Success "Pinned toolchain override set to 1.88.0-x86_64-pc-windows-msvc for src-tauri"
} catch {
    Write-WarningMsg "Failed to set rustup override: $_"
}

# Also set the override at the app root so cargo tauri invoked from ytapp uses the same toolchain
try {
    Push-Location $ytappPath
    & rustup override set 1.88.0-x86_64-pc-windows-msvc | Out-Null
    Pop-Location
    Write-Success "Pinned toolchain override set to 1.88.0-x86_64-pc-windows-msvc for ytapp"
} catch {
    Write-WarningMsg "Failed to set rustup override at ytapp: $_"
}

# Change to the project directory
Push-Location $ytappPath
try {
    # Clean previous node_modules if exists
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force node_modules
    }
    
    # Install dependencies
    Write-Info "Installing npm dependencies in $ytappPath..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to install Node.js dependencies"
        exit 1
    }
    
    Write-Success "Node.js dependencies installed successfully"
}
catch {
    Write-Err "Error installing Node.js dependencies: $_"
    exit 1
}
finally {
    Pop-Location
}

# Final guarantee that Node.js & npm are reachable for verification
Ensure-NodePath | Out-Null

# Ensure tauri-cli is available before verification and build
if (-not (Ensure-TauriCli)) {
    Write-Err "tauri-cli is required but could not be installed"
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
    @{Name = "Tauri CLI"; Command = "cargo tauri --version"; Required = $true},
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

if ($allToolsInstalled) {
    Write-Host "`nAll dependencies installed successfully!" -ForegroundColor Green

    # Build the project
    $projectPath = Join-Path $PSScriptRoot "..\ytapp"
    if (-not (Test-Path $projectPath)) {
        $projectPath = Join-Path $PSScriptRoot "..\..\ytapp"
    }
    Write-Info "Building project at $projectPath"
    
        if (Build-Project -projectPath $projectPath) {
            Write-Host "`nProject built successfully!" -ForegroundColor Green
            Write-Info "Launching the Tauri app UI (development mode)..."

            Push-Location $projectPath
            try {
                # Clear any conflicting CMake generator overrides
                $cmakeVars = @('CMAKE_GENERATOR','CMAKE_GENERATOR_TOOLSET','CMAKE_GENERATOR_PLATFORM','CMAKE_MAKE_PROGRAM')
                foreach ($v in $cmakeVars) {
                    if (Test-Path "Env:\$v") {
                        $varValue = Get-Item "Env:$v" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Value
                        Write-Info "Unsetting $v (was '$varValue')"
                        Remove-Item "Env:\$v" -ErrorAction SilentlyContinue
                    }
                }

                # Ensure aws-lc-sys uses C11 on MSVC (fixes C atomics error)
                $env:AWS_LC_SYS_C_STD = "11"
                # Also ensure VS env, rustup cargo shim, and short target dir for dev
                Import-VsDevCmdEnv
                Ensure-RustupCargoFirst
                Ensure-ShortTargetDir

                # Start the dev UI with the pinned MSVC toolchain (blocks until closed)
                # Use rustup run to guarantee the correct cargo is used even if another cargo is first in PATH
                & rustup run 1.88.0-x86_64-pc-windows-msvc cargo tauri dev
            }
            finally {
                Pop-Location
            }
        } else {
        Write-Host "`nProject build failed. You can try building manually with:" -ForegroundColor Yellow
        Write-Host "  cd ytapp" -ForegroundColor Yellow
        Write-Host "  npm run tauri:dev" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nSome required tools are missing:" -ForegroundColor Red
    $missingRequiredTools | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
    Write-Host "`nPlease install missing tools and try again." -ForegroundColor Red
    exit 1
}

if ($script:needsReboot) {
    Write-Host "`nA system reboot is required to complete the installation." -ForegroundColor Yellow
    $reboot = Read-Host "Do you want to restart your computer now? (y/n)"
    if ($reboot -eq 'y' -or $reboot -eq 'Y') {
        Restart-Computer -Force
    } else {
        Write-Host "Please restart your computer when convenient to complete the installation." -ForegroundColor Yellow
    }
}
