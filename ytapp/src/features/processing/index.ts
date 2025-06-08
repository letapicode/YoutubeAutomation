import { invoke } from '@tauri-apps/api/tauri';

export async function generateVideo(file: string, output?: string): Promise<string> {
    return await invoke('generate_video', { file, output });
}
