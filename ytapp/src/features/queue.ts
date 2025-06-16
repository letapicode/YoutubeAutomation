import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { GenerateParams } from './processing';

export type QueueJob =
  | { Generate: { params: GenerateParams; dest: string } }
  | { GenerateUpload: { params: GenerateParams; dest: string; thumbnail?: string } };

export interface QueueItem {
  job: QueueJob;
  status: 'pending' | 'running' | 'failed' | 'completed';
  retries: number;
  error?: string;
}

export async function addJob(job: QueueJob): Promise<void> {
  await invoke('queue_add', { job });
}

export async function listJobs(): Promise<QueueItem[]> {
  return await invoke('queue_list');
}

/** Remove a job at the specified index. */
export async function removeJob(index: number): Promise<void> {
  await invoke('queue_remove', { index });
}

/** Clear all jobs from the queue. */
export async function clearQueue(): Promise<void> {
  await invoke('queue_clear');
}

/** Remove completed jobs from the queue. */
export async function clearCompleted(): Promise<void> {
  await invoke('queue_clear_completed');
}

export async function runQueue(retryFailed = false): Promise<void> {
  await invoke('queue_process', { retryFailed });
}

/** Listen for queue updates emitted by the backend. Returns an unsubscribe function. */
export async function listenQueue(onChange: () => void): Promise<() => void> {
  const unlisten = await listen('queue_changed', onChange);
  return () => {
    unlisten();
  };
}
