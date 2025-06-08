import { invoke } from '@tauri-apps/api/core';

export async function transcribeAudio(file: string): Promise<string> {
    return await invoke('transcribe_audio', { file });
}
