// Wrapper around Tauri commands related to video generation.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface CaptionOptions {
    font?: string;
    fontPath?: string;
    style?: string;
    size?: number;
    position?: string;
    color?: string;
    background?: string;
}

export interface GenerateParams {
    file: string;
    output?: string;
    captions?: string;
    captionOptions?: CaptionOptions;
    background?: string;
    intro?: string;
    outro?: string;
    width?: number;
    height?: number;
    title?: string;
    description?: string;
    tags?: string[];
    publishAt?: string;
}

export type ProgressCallback = (progress: number) => void;
export type CancelCallback = () => void;

/**
 * Generate a video from an audio file using the backend.
 *
 * @param params     Options that control video generation.
 * @param onProgress Optional callback receiving progress percentage.
 */
export async function generateVideo(
  params: GenerateParams,
  onProgress?: ProgressCallback,
  onCancel?: CancelCallback,
): Promise<string> {
    let unlisten: (() => void) | undefined;
    let cancelListen: (() => void) | undefined;
    if (onProgress) {
        unlisten = await listen<number>('generate_progress', e => {
            if (typeof e.payload === 'number') onProgress(e.payload);
        });
    }
    if (onCancel) {
        cancelListen = await listen('generate_canceled', () => onCancel());
    }
    try {
        const result: string = await invoke('generate_video', params as any);
        return result;
    } finally {
        if (unlisten) unlisten();
        if (cancelListen) cancelListen();
    }
}
