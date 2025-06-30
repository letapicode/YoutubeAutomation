// Wrapper around Tauri commands related to video generation.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { CaptionOptions, GenerateParams } from '../../schema';
export type { CaptionOptions, GenerateParams } from '../../schema';

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
    const cleanup = () => {
        if (unlisten) {
            unlisten();
            unlisten = undefined;
        }
        if (cancelListen) {
            cancelListen();
            cancelListen = undefined;
        }
    };

    return new Promise<string>(async (resolve, reject) => {
        if (onProgress) {
            unlisten = await listen<number>('generate_progress', e => {
                if (typeof e.payload === 'number') onProgress(e.payload);
            });
        }
        cancelListen = await listen('generate_canceled', () => {
            if (onCancel) onCancel();
            cleanup();
            reject(new Error('canceled'));
        });
        try {
            const result: string = await invoke('generate_video', params as any);
            cleanup();
            resolve(result);
        } catch (err) {
            cleanup();
            reject(err as any);
        }
    });
}
