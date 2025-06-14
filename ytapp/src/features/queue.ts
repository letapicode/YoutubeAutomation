import { invoke } from '@tauri-apps/api/core';
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
