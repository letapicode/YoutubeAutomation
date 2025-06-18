// Utilities for generating multiple videos in a row.
// These functions wrap `generateVideo` from the processing module and optionally
// report progress back to the caller.

import { GenerateParams, generateVideo } from '../processing';
export type ProgressCallback = (current: number, total: number, file: string) => void;

export interface BatchOptions extends Omit<GenerateParams, 'file' | 'output'> {
    /** Directory to place generated files. When omitted, `generateVideo` decides */
    outputDir?: string;
    background?: string;
    watermark?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    watermarkOpacity?: number;
    watermarkScale?: number;
}

// Derive an output file path based on the input file and optional directory.
function outputPath(file: string, dir?: string): string | undefined {
    if (!dir) return undefined;
    const base = file.split('/').pop()?.replace(/\.[^/.]+$/, '.mp4');
    return base ? `${dir}/${base}` : undefined;
}

async function generateOne(file: string, options: BatchOptions): Promise<string> {
    return generateVideo({
        file,
        output: outputPath(file, options.outputDir),
        captions: options.captions,
        captionOptions: options.captionOptions,
        background: options.background,
        watermark: options.watermark,
        watermarkPosition: options.watermarkPosition,
        watermarkOpacity: options.watermarkOpacity,
        watermarkScale: options.watermarkScale,
        intro: options.intro,
        outro: options.outro,
        width: options.width,
        height: options.height,
    });
}

/**
 * Generate videos sequentially without progress callbacks.
 */
export async function generateBatch(files: string[], options: BatchOptions): Promise<string[]> {
    const results: string[] = [];
    for (const f of files) {
        results.push(await generateOne(f, options));
    }
    return results;
}

/**
 * Generate videos sequentially while reporting progress to the caller.
 */
export async function generateBatchWithProgress(
    files: string[],
    options: BatchOptions,
    onProgress?: ProgressCallback,
): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i, files.length, file);
        results.push(await generateOne(file, options));
    }
    onProgress?.(files.length, files.length, '');
    return results;
}
