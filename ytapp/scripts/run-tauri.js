// Cross-platform Tauri runner that ensures the MSVC toolchain and a short,
// per-user Cargo target directory are used for all dev/build runs.
//
// Usage:
//   npm run tauri           -> cargo tauri
//   npm run tauri:dev       -> cargo tauri dev
//   npm run tauri:build     -> cargo tauri build
//
// Env vars:
//   YTA_FORCE_CLEAN=1  -> run `cargo clean` in src-tauri before starting

const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const TOOLCHAIN = '1.88.0-x86_64-pc-windows-msvc';
const sub = process.argv[2] || '';

// Always set a short, stable target dir to avoid path-length and mixing issues
process.env.CARGO_TARGET_DIR = path.join(os.homedir(), '.ytarget');

// On Windows, neutralize MinGW overrides and prefer MSVC for CMake builds
if (process.platform === 'win32') {
  // Clear problematic overrides from the user environment
  const badVars = [
    'CMAKE_GENERATOR',
    'CMAKE_GENERATOR_TOOLSET',
    'CMAKE_GENERATOR_PLATFORM',
    'CMAKE_MAKE_PROGRAM',
    'CC',
    'CXX',
    'AR',
    'RANLIB',
  ];
  for (const v of badVars) delete process.env[v];

  // Force a VS generator for crates like aws-lc-sys (cmake-based)
  process.env.CMAKE_GENERATOR = 'Visual Studio 17 2022';

  // Ensure aws-lc-sys can compile its C11 atomics probe with MSVC
  if (!process.env.AWS_LC_SYS_C_STD) process.env.AWS_LC_SYS_C_STD = '11';
}

// Best-effort: ensure OS-level deps are installed before starting dev/build.
// This is idempotent and fast when already satisfied.
try {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const scriptsRoot = path.join(repoRoot, 'scripts');
  if (process.platform === 'win32') {
    spawnSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', path.join(scriptsRoot, 'install_tauri_deps_windows.ps1'),
    ], { stdio: 'inherit', shell: true });
  } else if (process.platform === 'darwin') {
    spawnSync('bash', [path.join(scriptsRoot, 'install_tauri_deps_macos.sh')], { stdio: 'inherit' });
  } else {
    spawnSync('bash', [path.join(scriptsRoot, 'install_tauri_deps.sh')], { stdio: 'inherit' });
  }
} catch {}

// Optionally clean to avoid cross-toolchain artifact mixing
if (process.env.YTA_FORCE_CLEAN === '1') {
  const tauriDir = path.resolve(__dirname, '..', 'src-tauri');
  if (fs.existsSync(tauriDir)) {
    console.log('[info] Cleaning Rust artifacts (YTA_FORCE_CLEAN=1)');
    spawnSync('rustup', ['run', TOOLCHAIN, 'cargo', 'clean'], {
      cwd: tauriDir,
      stdio: 'inherit',
      shell: true,
    });
  }
}

// Build argument list for the tauri subcommand
const tauriArgs = ['run', TOOLCHAIN, 'cargo', 'tauri'];
if (sub === 'dev' || sub === 'build') tauriArgs.push(sub);

// Run rustup -> cargo tauri ...
const result = spawnSync('rustup', tauriArgs, {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
