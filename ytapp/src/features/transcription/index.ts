// Helpers for generating SRT subtitles with optional translation.
import { invoke } from '@tauri-apps/api/core';
import { Language } from '../language';
import { translateSrt } from '../../utils/translate';

export interface TranscribeParams {
    file: string;
    language?: Language;
    /**
     * Target language codes to translate the generated SRT file.
     */
    translate?: string[];
    modelSize?: string;
}

/**
 * Transcribe an audio file using the backend and optionally translate the
 * resulting subtitles into additional languages.
 *
 * @param params Options controlling the transcription and translation.
 * @returns Array of generated subtitle paths.
 */
export async function transcribeAudio(params: TranscribeParams): Promise<string[]> {
    const { file, language = 'auto', translate, modelSize } = params;
    const result: string = await invoke('transcribe_audio', { file, language, size: modelSize });
    const outputs: string[] = [result];
    if (translate && Array.isArray(translate)) {
        for (const target of translate) {
            try {
                const out = await translateSrt(
                    result,
                    target,
                    language !== 'auto' ? language : 'en',
                );
                outputs.push(out);
            } catch {
                // ignore translation errors
            }
        }
    }
    return outputs;
}

export async function loadSrt(path: string): Promise<string> {
    return await invoke('load_srt', { path });
}

export async function saveSrt(path: string, data: string): Promise<void> {
    await invoke('save_srt', { path, data });
}
