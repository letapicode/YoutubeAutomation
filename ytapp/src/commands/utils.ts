import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { GenerateParams } from '../schema';
import { translateSrt } from '../utils/translate';
import type { Profile } from '../schema';
import { getProfile } from '../features/profiles';

export async function callWithProgress<T>(fn: () => Promise<T>, onProgress?: (p: number) => void): Promise<T> {
  let unlisten: (() => void) | undefined;
  if (onProgress) {
    unlisten = await listen<number>('generate_progress', (e) => {
      if (typeof e.payload === 'number') onProgress(e.payload);
    });
  }
  try {
    return await fn();
  } finally {
    if (unlisten) unlisten();
  }
}

export async function callWithUploadProgress<T>(fn: () => Promise<T>, onProgress?: (p: number) => void): Promise<T> {
  let unlisten: (() => void) | undefined;
  if (onProgress) {
    unlisten = await listen<number>('upload_progress', (e) => {
      if (typeof e.payload === 'number') onProgress(e.payload);
    });
  }
  try {
    return await fn();
  } finally {
    if (unlisten) unlisten();
  }
}

export async function withInterrupt<T>(handler: () => void, fn: () => Promise<T>): Promise<T> {
  const sig = () => { handler(); };
  process.once('SIGINT', sig);
  try {
    return await fn();
  } finally {
    process.off('SIGINT', sig);
  }
}

export function showProgress(p: number): void {
  const pct = Math.round(p);
  process.stdout.write(`\r${pct}%`);
  if (pct >= 100) process.stdout.write('\n');
}

export async function mergeProfile(name: string | undefined, params: Partial<Profile>): Promise<Partial<Profile>> {
  if (!name) return params;
  try {
    const prof = await getProfile(name);
    return { ...prof, ...params };
  } catch {
    return params;
  }
}

export async function generateVideo(params: GenerateParams, onProgress?: (p: number) => void): Promise<any> {
  return await callWithProgress(
    () => invoke('generate_video', params as any),
    onProgress,
  );
}

interface UploadParams {
  file: string;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
  thumbnail?: string;
  privacy?: string;
  playlistId?: string;
}

interface UploadBatchParams extends Omit<UploadParams, 'file'> {
  files: string[];
}

export async function uploadVideo(params: UploadParams, onProgress?: (p: number) => void): Promise<any> {
  return await callWithUploadProgress(
    () => invoke('upload_video', params as any),
    onProgress,
  );
}

export async function uploadVideos(params: UploadBatchParams, onProgress?: (p: number) => void): Promise<any> {
  return await callWithUploadProgress(
    () => invoke('upload_videos', params as any),
    onProgress,
  );
}

export async function transcribeAudio(params: { file: string; language?: string; translate?: string[]; modelSize?: string; }): Promise<string[]> {
  const { file, language = 'auto', translate, modelSize } = params;
  const result: string = await invoke('transcribe_audio', { file, language, size: modelSize });
  const outputs: string[] = [result];
  if (translate) {
    for (const t of translate) {
      try {
        outputs.push(
          await translateSrt(
            result,
            t,
            language !== 'auto' ? language : 'en',
          ),
        );
      } catch {
        // ignore translation errors
      }
    }
  }
  return outputs;
}

export async function generateAndUpload(params: GenerateParams, onProgress?: (p: number) => void, onUploadProgress?: (p: number) => void): Promise<any> {
  let unlisten: (() => void) | undefined;
  if (onUploadProgress) {
    unlisten = await listen<number>('upload_progress', (e) => {
      if (typeof e.payload === 'number') onUploadProgress(e.payload);
    });
  }
  try {
    return await callWithProgress(
      () => invoke('generate_upload', params as any),
      onProgress,
    );
  } finally {
    if (unlisten) unlisten();
  }
}

export async function signIn(): Promise<void> {
  await invoke('youtube_sign_in');
}

export async function signOut(): Promise<void> {
  await invoke('youtube_sign_out');
}

export async function isSignedIn(): Promise<boolean> {
  return await invoke('youtube_is_signed_in');
}
