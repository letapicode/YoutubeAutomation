import { invoke } from '@tauri-apps/api/core';

export async function uploadVideo(file: string): Promise<string> {
    return await invoke('upload_video', { file });
}

export async function uploadVideos(files: string[]): Promise<string[]> {
    return await invoke('upload_videos', { files });
}

export async function youtubeSignIn(): Promise<void> {
    await invoke('youtube_sign_in');
}

export async function youtubeIsSignedIn(): Promise<boolean> {
    return await invoke('youtube_is_signed_in');
}

import type { GenerateParams } from '../processing';

export async function generateUpload(params: GenerateParams): Promise<string> {
    return await invoke('generate_upload', params);
}
