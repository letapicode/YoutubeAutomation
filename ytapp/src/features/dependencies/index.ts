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
    if (window.confirm('Required components are missing. Install now?')) {
      try {
        await invoke('install_tauri_deps');
        await invoke('verify_dependencies');
      } catch {
        window.alert('Failed to install dependencies. Please run scripts/install_tauri_deps.sh manually.');
      }
    }
  }
}
