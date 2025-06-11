// Functions that interact with the Tauri backend to upload videos.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
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

export type ProgressCallback = (p: number) => void;
export type CancelCallback = () => void;

export async function uploadVideoWithProgress(
    opts: UploadOptions,
    onProgress: ProgressCallback,
    onCancel?: CancelCallback,
): Promise<string> {
    const unlisten = await listen<number>('upload_progress', e => {
        if (typeof e.payload === 'number') onProgress(e.payload);
    });
    const cancelListen = onCancel ? await listen('upload_canceled', () => onCancel()) : undefined;
    try {
        return await invoke('upload_video', opts as any);
    } finally {
        unlisten();
        if (cancelListen) cancelListen();
    }
}

/**
 * Upload a single video file via the backend.
 */
export async function uploadVideo(
    opts: UploadOptions,
    onProgress?: ProgressCallback,
    onCancel?: CancelCallback,
): Promise<string> {
    if (onProgress) {
        return uploadVideoWithProgress(opts, onProgress, onCancel);
    }
    return await invoke('upload_video', opts as any);
}

/**
 * Upload multiple video files sequentially.
 */
export async function uploadVideos(
    opts: UploadBatchOptions,
    onProgress?: ProgressCallback,
    onCancel?: CancelCallback,
): Promise<string[]> {
    if (onProgress) {
        const unlisten = await listen<number>('upload_progress', e => {
            if (typeof e.payload === 'number') onProgress(e.payload);
        });
        const cancelListen = onCancel ? await listen('upload_canceled', () => onCancel()) : undefined;
        try {
            return await invoke('upload_videos', opts as any);
        } finally {
            unlisten();
            if (cancelListen) cancelListen();
        }
    }
    return await invoke('upload_videos', opts as any);
}

/**
 * Generate a video and upload it directly.
 */
export async function generateUpload(params: GenerateParams, onCancel?: CancelCallback): Promise<string> {
    const cancelListen = onCancel ? await listen('upload_canceled', () => onCancel()) : undefined;
    try {
        return await invoke('generate_upload', params as any);
    } finally {
        if (cancelListen) cancelListen();
    }
}

export interface BatchGenerateParams extends Omit<GenerateParams, 'file' | 'output'> {
    files: string[];
    outputDir?: string;
}

/**
 * Generate and upload multiple videos in sequence.
 */
export async function generateBatchUpload(params: BatchGenerateParams, onCancel?: CancelCallback): Promise<string[]> {
    const cancelListen = onCancel ? await listen('upload_canceled', () => onCancel()) : undefined;
    try {
        return await invoke('generate_batch_upload', params as any);
    } finally {
        if (cancelListen) cancelListen();
    }
}

/**
 * Trigger OAuth sign-in for YouTube.
 */
export async function signIn(): Promise<void> {
    await invoke('youtube_sign_in');
}

/**
 * Sign out and remove stored YouTube tokens.
 */
export async function signOut(): Promise<void> {
    await invoke('youtube_sign_out');
}

/**
 * Check whether a valid YouTube session exists.
 */
export async function isSignedIn(): Promise<boolean> {
    return await invoke('youtube_is_signed_in');
}
