// Start or stop directory watching via the backend.
import { invoke } from '@tauri-apps/api/core';
import { GenerateParams } from './processing';

export interface WatchParams extends Omit<GenerateParams, 'file' | 'output'> {
  autoUpload?: boolean;
  thumbnail?: string;
  recursive?: boolean;
}

export async function watchDirectory(dir: string, options: WatchParams): Promise<void> {
  await invoke('watch_directory', {
    dir,
    options,
    autoUpload: options.autoUpload,
    recursive: options.recursive,
  });
}

export async function stopWatching(): Promise<void> {
  await invoke('watch_stop');
}
