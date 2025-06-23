// Wrapper around Tauri command for reading log files.
import { invoke } from '@tauri-apps/api/core';

/** Retrieve recent log lines from the backend. */
export async function getLogs(maxLines = 200): Promise<string> {
  return await invoke('get_logs', { maxLines });
}

/** Delete the current log file. */
export async function clearLogs(): Promise<void> {
  await invoke('clear_logs');
}
