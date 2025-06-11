// Start or stop directory watching via the backend.
import { invoke } from '@tauri-apps/api/core';
import { GenerateParams } from './processing';

export interface WatchParams extends Omit<GenerateParams, 'file' | 'output'> {
  autoUpload?: boolean;
  thumbnail?: string;
}

export async function watchDirectory(dir: string, options: WatchParams): Promise<void> {
  await invoke('watch_directory', { dir, options, autoUpload: options.autoUpload });
}
