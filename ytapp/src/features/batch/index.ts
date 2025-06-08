import { GenerateParams, generateVideo } from '../processing';

export interface BatchOptions extends Omit<GenerateParams, 'file' | 'output'> {
    outputDir?: string;
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
            intro: options.intro,
            outro: options.outro,
        });
        results.push(res);
    }
    return results;
}
