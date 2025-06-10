import { invoke } from '@tauri-apps/api/core';
import { GenerateParams } from '../processing';
export type { GenerateParams } from '../processing';

export interface UploadOptions {
    file: string;
    title?: string;
    description?: string;
    tags?: string[];
    publishAt?: string;
}

export interface UploadBatchOptions extends Omit<UploadOptions, 'file'> {
    files: string[];
}

export async function uploadVideo(opts: UploadOptions): Promise<string> {
    return await invoke('upload_video', opts);
}

export async function uploadVideos(opts: UploadBatchOptions): Promise<string[]> {
    return await invoke('upload_videos', opts);
}

export async function generateUpload(params: GenerateParams): Promise<string> {
    return await invoke('generate_upload', params);
}

export interface BatchGenerateParams extends Omit<GenerateParams, 'file' | 'output'> {
    files: string[];
    outputDir?: string;
}

export async function generateBatchUpload(params: BatchGenerateParams): Promise<string[]> {
    return await invoke('generate_batch_upload', params);
}

export async function signIn(): Promise<void> {
    await invoke('youtube_sign_in');
}

export async function isSignedIn(): Promise<boolean> {
    return await invoke('youtube_is_signed_in');
}
