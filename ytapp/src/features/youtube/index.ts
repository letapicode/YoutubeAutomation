import { invoke } from '@tauri-apps/api/core';
import { GenerateParams } from '../processing';
export type { GenerateParams } from '../processing';

export async function uploadVideo(file: string): Promise<string> {
    return await invoke('upload_video', { file });
}

export async function uploadVideos(files: string[]): Promise<string[]> {
    return await invoke('upload_videos', { files });
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
