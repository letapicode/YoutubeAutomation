// Cross-platform postinstall that ensures OS-specific Tauri deps are installed.
// - Windows: runs PowerShell installer for WebView2
// - macOS:   runs bash script for Tauri deps
// - Linux:   runs bash script for GTK/WebKit deps

const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  return res.status ?? 0;
}

// Scripts live in repo-root/scripts. We are in ytapp/scripts.
const scriptRoot = path.resolve(__dirname, '..', '..', 'scripts');

let status = 0;
if (process.platform === 'win32') {
  status = run('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(scriptRoot, 'install_tauri_deps_windows.ps1'),
  ]);
} else if (process.platform === 'darwin') {
  status = run('bash', [path.join(scriptRoot, 'install_tauri_deps_macos.sh')]);
} else {
  status = run('bash', [path.join(scriptRoot, 'install_tauri_deps.sh')]);
}

process.exit(status);

