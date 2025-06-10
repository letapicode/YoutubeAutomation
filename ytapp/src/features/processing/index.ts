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

export async function generateVideo(params: GenerateParams, onProgress?: ProgressCallback): Promise<string> {
    let unlisten: (() => void) | undefined;
    if (onProgress) {
        unlisten = await listen<number>('generate_progress', e => {
            if (typeof e.payload === 'number') onProgress(e.payload);
        });
    }
    try {
        const result: string = await invoke('generate_video', params);
        return result;
    } finally {
        if (unlisten) unlisten();
    }
}
