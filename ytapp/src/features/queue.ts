import { invoke } from '@tauri-apps/api/core';
import { GenerateParams } from './processing';

export type QueueJob =
  | { Generate: { params: GenerateParams; dest: string } }
  | { GenerateUpload: { params: GenerateParams; dest: string; thumbnail?: string } };

export async function addJob(job: QueueJob): Promise<void> {
  await invoke('queue_add', { job });
}

export async function listJobs(): Promise<QueueJob[]> {
  return await invoke('queue_list');
}

/** Clear all jobs from the queue. */
export async function clearQueue(): Promise<void> {
  await invoke('queue_clear');
}

export async function runQueue(): Promise<void> {
  await invoke('queue_process');
}
