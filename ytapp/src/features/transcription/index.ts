import { invoke } from '@tauri-apps/api/tauri';

export async function transcribeAudio(file: string): Promise<string> {
    return await invoke('transcribe_audio', { file });
}
