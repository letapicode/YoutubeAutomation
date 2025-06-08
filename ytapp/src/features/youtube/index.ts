import { invoke } from '@tauri-apps/api/tauri';

export async function uploadVideo(file: string): Promise<string> {
    return await invoke('upload_video', { file });
}
