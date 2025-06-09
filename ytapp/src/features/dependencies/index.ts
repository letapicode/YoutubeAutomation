import { invoke } from '@tauri-apps/api/core';

export async function checkDependencies(): Promise<void> {
    try {
        await invoke('verify_dependencies');
    } catch {
        // errors are already shown via dialog
    }
}
