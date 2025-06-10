import { invoke } from '@tauri-apps/api/core';

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
