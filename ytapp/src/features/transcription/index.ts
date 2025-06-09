import { invoke } from '@tauri-apps/api/core';
import { spawn } from 'child_process';
import { Language } from '../language';

export interface TranscribeParams {
    file: string;
    language?: Language;
    translate?: string;
}

function translateSrt(input: string, target: string): Promise<string> {
    const output = input.replace(/\.srt$/, `.${target}.srt`);
    return new Promise((resolve, reject) => {
        const child = spawn('argos-translate', [
            '--input-file', input,
            '--output-file', output,
            '--from-lang', 'en',
            '--to-lang', target,
        ]);
        child.on('exit', code => {
            if (code === 0) resolve(output); else reject(new Error('translation failed'));
        });
    });
}

export async function transcribeAudio(params: TranscribeParams): Promise<string> {
    const { file, language = 'auto', translate } = params;
    let result: string = await invoke('transcribe_audio', { file, language });
    if (translate) {
        try {
            result = await translateSrt(result, translate);
        } catch {
            // ignore translation errors
        }
    }
    return result;
}
