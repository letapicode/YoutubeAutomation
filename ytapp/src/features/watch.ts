// Start or stop directory watching via the backend.
import { invoke } from '@tauri-apps/api/core';
import { GenerateParams } from '../types/generateParams';

export interface WatchParams extends Omit<GenerateParams, 'file' | 'output'> {
  autoUpload?: boolean;
}

export async function watchDirectory(dir: string, options: WatchParams): Promise<void> {
  await invoke('watch_directory', { dir, options, autoUpload: options.autoUpload });
}
