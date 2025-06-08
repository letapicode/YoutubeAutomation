import { generateVideo, GenerateOptions } from '../processing';

export interface BatchOptions extends GenerateOptions {
    audios: string[];
    outputDir?: string;
}

export async function generateBatch(options: BatchOptions): Promise<string[]> {
    const results: string[] = [];
    const outDir = options.outputDir || '.';
    for (const audio of options.audios) {
        const output = `${outDir}/${audio.replace(/\.[^/.]+$/, '')}.mp4`;
        const res = await generateVideo(audio, { ...options, output });
        results.push(res);
    }
    return results;
}
