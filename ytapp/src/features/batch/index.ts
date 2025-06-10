import { GenerateParams, generateVideo } from '../processing';
export type ProgressCallback = (current: number, total: number, file: string) => void;

export interface BatchOptions extends Omit<GenerateParams, 'file' | 'output'> {
    outputDir?: string;
    background?: string;
}

export async function generateBatch(files: string[], options: BatchOptions): Promise<string[]> {
    const results: string[] = [];
    for (const file of files) {
        const output = options.outputDir
            ? `${options.outputDir}/${file.split('/').pop()?.replace(/\.[^/.]+$/, '.mp4')}`
            : undefined;
        const res = await generateVideo({
            file,
            output,
            captions: options.captions,
            captionOptions: options.captionOptions,
            background: options.background,
            intro: options.intro,
            outro: options.outro,
            width: options.width,
            height: options.height,
        });
        results.push(res);
    }
    return results;
}

export async function generateBatchWithProgress(files: string[], options: BatchOptions, onProgress?: ProgressCallback): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i, files.length, file);
        const output = options.outputDir
            ? `${options.outputDir}/${file.split('/').pop()?.replace(/\.[^/.]+$/, '.mp4')}`
            : undefined;
        const res = await generateVideo({
            file,
            output,
            captions: options.captions,
            captionOptions: options.captionOptions,
            background: options.background,
            intro: options.intro,
            outro: options.outro,
            width: options.width,
            height: options.height,
        });
        results.push(res);
    }
    onProgress?.(files.length, files.length, '');
    return results;
}
