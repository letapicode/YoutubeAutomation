import { invoke } from '@tauri-apps/api/tauri';

export interface GenerateOptions {
    background?: string;
    intro?: string;
    outro?: string;
    captions?: string;
    captionFont?: string;
    captionSize?: number;
    captionPosition?: string;
    output?: string;
}

export async function generateVideo(audio: string, options: GenerateOptions = {}): Promise<string> {
    return await invoke('generate_video', { audio, ...options });
}
