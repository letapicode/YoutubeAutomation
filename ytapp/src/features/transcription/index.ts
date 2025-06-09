import { invoke } from '@tauri-apps/api/core';
import { Language } from '../language';

export interface TranscribeParams {
    file: string;
    language?: Language;
}

export async function transcribeAudio(params: TranscribeParams): Promise<string> {
    const { file, language = 'auto' } = params;
    return await invoke('transcribe_audio', { file, language });
}
