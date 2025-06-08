import { invoke } from '@tauri-apps/api/tauri';

export interface CaptionOptions {
    font?: string;
    size?: number;
    position?: string;
}

export interface GenerateParams {
    file: string;
    output?: string;
    captions?: string;
    captionOptions?: CaptionOptions;
    intro?: string;
    outro?: string;
}

export async function generateVideo(params: GenerateParams): Promise<string> {
    return await invoke('generate_video', params);
}
