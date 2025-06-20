export interface SystemFont {
  name: string;
  style: string;
  path: string;
}

import { invoke } from '@tauri-apps/api/core';

/**
 * Retrieve available system fonts detected by the backend.
 */
export async function listFonts(): Promise<SystemFont[]> {
  return await invoke('list_fonts');
}
