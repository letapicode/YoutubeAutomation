// Utility used at startup to ensure native dependencies like FFmpeg are present.
import { invoke } from '@tauri-apps/api/core';

/**
 * Verify that required native tools like FFmpeg are installed.
 * Throws an error if verification fails.
 */
export async function verifyDependencies(): Promise<void> {
  await invoke('verify_dependencies');
}

/**
 * Ensure native dependencies like FFmpeg are installed. Prompts the user to
 * run the provided installation script when verification fails.
 */
export async function checkDependencies(): Promise<void> {
  try {
    await invoke('verify_dependencies');
  } catch {
    // Auto-install silently without prompting the user. If installation
    // subsequently fails, do not interrupt the user; log guidance instead.
    try {
      await invoke('install_tauri_deps');
      await invoke('verify_dependencies').catch(() => {
        console.warn('[deps] verification still failing; run platform installer manually:\n' +
          ' - Windows: scripts/ install_tauri_deps_windows.ps1\n' +
          ' - Linux:   scripts/ install_tauri_deps.sh\n' +
          ' - macOS:   scripts/ install_tauri_deps_macos.sh');
      });
    } catch (e) {
      console.warn('[deps] auto-install failed; run platform installer manually:\n' +
        ' - Windows: scripts/ install_tauri_deps_windows.ps1\n' +
        ' - Linux:   scripts/ install_tauri_deps.sh\n' +
        ' - macOS:   scripts/ install_tauri_deps_macos.sh', e);
    }
  }
}
