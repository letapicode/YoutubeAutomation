// Command line interface mirroring the GUI functionality.
import { program } from 'commander';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import { translateSrt } from './utils/translate';
import { parseCsv, CsvRow } from './utils/csv';
import { watchDirectory } from './features/watch';
import { generateBatchWithProgress } from './features/batch';

async function callWithProgress<T>(
  fn: () => Promise<T>,
  onProgress?: (p: number) => void,
): Promise<T> {
  let unlisten: (() => void) | undefined;
  if (onProgress) {
    unlisten = await listen<number>('generate_progress', (e) => {
      if (typeof e.payload === 'number') onProgress(e.payload);
    });
  }
  try {
    return await fn();
  } finally {
    if (unlisten) unlisten();
  }
}

async function callWithUploadProgress<T>(
  fn: () => Promise<T>,
  onProgress?: (p: number) => void,
): Promise<T> {
  let unlisten: (() => void) | undefined;
  if (onProgress) {
    unlisten = await listen<number>('upload_progress', (e) => {
      if (typeof e.payload === 'number') onProgress(e.payload);
    });
  }
  try {
    return await fn();
  } finally {
    if (unlisten) unlisten();
  }
}

async function withInterrupt<T>(handler: () => void, fn: () => Promise<T>): Promise<T> {
  const sig = () => { handler(); };
  process.once('SIGINT', sig);
  try {
    return await fn();
  } finally {
    process.off('SIGINT', sig);
  }
}

function showProgress(p: number): void {
  const pct = Math.round(p);
  process.stdout.write(`\r${pct}%`);
  if (pct >= 100) process.stdout.write('\n');
}

interface CaptionOptions {
  font?: string;
  fontPath?: string;
  style?: string;
  size?: number;
  position?: string;
  color?: string;
  background?: string;
}

interface GenerateParams {
  file: string;
  output?: string;
  captions?: string;
  captionOptions?: CaptionOptions;
  background?: string;
  intro?: string;
  outro?: string;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
}

/**
 * Invoke the backend to generate a single video.
 */
async function generateVideo(
  params: GenerateParams,
  onProgress?: (p: number) => void,
): Promise<any> {
  return await callWithProgress(
    () => invoke('generate_video', params as any),
    onProgress,
  );
}

interface UploadParams {
  file: string;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
}

interface UploadBatchParams extends Omit<UploadParams, 'file'> {
  files: string[];
}

/**
 * Upload a single video file to YouTube.
 */
async function uploadVideo(
  params: UploadParams,
  onProgress?: (p: number) => void,
): Promise<any> {
  return await callWithUploadProgress(
    () => invoke('upload_video', params as any),
    onProgress,
  );
}

/**
 * Upload multiple videos to YouTube sequentially.
 */
async function uploadVideos(
  params: UploadBatchParams,
  onProgress?: (p: number) => void,
): Promise<any> {
  return await callWithUploadProgress(
    () => invoke('upload_videos', params as any),
    onProgress,
  );
}

/**
 * Transcribe an audio file and optionally translate the subtitles.
 */
async function transcribeAudio(params: {
  file: string;
  language?: string;
  translate?: string[];
}): Promise<string[]> {
  const { file, language = 'auto', translate } = params;
  const result: string = await invoke('transcribe_audio', { file, language });
  const outputs: string[] = [result];
  if (translate) {
    for (const t of translate) {
      try {
        outputs.push(
          await translateSrt(
            result,
            t,
            language !== 'auto' ? language : 'en',
          ),
        );
      } catch {
        // ignore translation errors
      }
    }
  }
  return outputs;
}

/**
 * Convenience helper that generates a video and uploads it in a single step.
 */
async function generateAndUpload(
  params: GenerateParams,
  onProgress?: (p: number) => void,
  onUploadProgress?: (p: number) => void,
): Promise<any> {
  let unlisten: (() => void) | undefined;
  if (onUploadProgress) {
    unlisten = await listen<number>('upload_progress', (e) => {
      if (typeof e.payload === 'number') onUploadProgress(e.payload);
    });
  }
  try {
    return await callWithProgress(
      () => invoke('generate_upload', params as any),
      onProgress,
    );
  } finally {
    if (unlisten) unlisten();
  }
}

/**
 * Start the OAuth flow for YouTube.
 */
async function signIn(): Promise<void> {
  await invoke('youtube_sign_in');
}

/**
 * Remove stored YouTube tokens.
 */
async function signOut(): Promise<void> {
  await invoke('youtube_sign_out');
}

program
  .name('ytcli')
  .description('CLI for generating and uploading videos. Press Ctrl+C to cancel operations.')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate video from audio')
  .argument('<file>', 'audio file path')
  .option('-o, --output <output>', 'output video path')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--caption-color <color>', 'caption text color (hex)')
  .option('--color <color>', 'alias for --caption-color')
  .option('--caption-bg <color>', 'caption background color (hex)')
  .option('--bg-color <color>', 'alias for --caption-bg')
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .option('-q, --quiet', 'suppress progress output')
  .action(async (file: string, options: any) => {
    try {
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;
      const params: GenerateParams = {
        file,
        output: options.output,
        captions: options.captions,
        captionOptions: {
          font: options.font,
          fontPath: options.fontPath,
          style: options.style,
          size: options.size,
          position: options.position,
          color: options.captionColor,
          background: options.captionBg,
        },
        background: options.background,
        intro: options.intro,
        outro: options.outro,
        width: options.width,
        height: options.height,
        title: options.title,
        description: options.description,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        publishAt: options.publishAt,
      };
      const result = await withInterrupt(
        () => invoke('cancel_generate'),
        () => generateVideo(
          params,
          options.quiet ? undefined : showProgress,
        )
      );
      console.log(result);
    } catch (err) {
      console.error('Error generating video:', err);
      process.exitCode = 1;
    }
  });

program
  .command('generate-upload')
  .description('Generate video and upload to YouTube')
  .argument('<file>', 'audio file path')
  .option('-o, --output <output>', 'output video path')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--caption-color <color>', 'caption text color (hex)')
  .option('--color <color>', 'alias for --caption-color')
  .option('--caption-bg <color>', 'caption background color (hex)')
  .option('--bg-color <color>', 'alias for --caption-bg')
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .action(async (file: string, options: any) => {
    try {
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;
      const params: GenerateParams = {
        file,
        output: options.output,
        captions: options.captions,
        captionOptions: {
          font: options.font,
          fontPath: options.fontPath,
          style: options.style,
          size: options.size,
          position: options.position,
          color: options.captionColor,
          background: options.captionBg,
        },
        background: options.background,
        intro: options.intro,
        outro: options.outro,
        width: options.width,
        height: options.height,
      };
      const result = await withInterrupt(
        () => { invoke('cancel_generate'); invoke('cancel_upload'); },
        () => generateAndUpload(
          params,
          showProgress,
          showProgress,
        )
      );
      console.log(result);
    } catch (err) {
      console.error('Error generating and uploading video:', err);
      process.exitCode = 1;
    }
  });

program
  .command('generate-upload-batch')
  .description('Generate multiple videos and upload to YouTube')
  .argument('[files...]', 'audio files')
  .option('--csv <file>', 'CSV metadata file')
  .option('-d, --output-dir <dir>', 'output directory', '.')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--caption-color <color>', 'caption text color (hex)')
  .option('--color <color>', 'alias for --caption-color')
  .option('--caption-bg <color>', 'caption background color (hex)')
  .option('--bg-color <color>', 'alias for --caption-bg')
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .action(async (files: string[], options: any) => {
    try {
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;

      let csvMap: Record<string, CsvRow> = {};
      if (options.csv) {
        const rows = await parseCsv(options.csv);
        csvMap = Object.fromEntries(rows.map(r => [r.file, r]));
        if (!files.length) files = rows.map(r => r.file);
      }

      if (options.csv) {
        for (const file of files) {
          const meta = csvMap[file] || {};
          const params: GenerateParams = {
            file,
            output: path.join(
              options.outputDir,
              path.basename(file, path.extname(file)) + '.mp4'
            ),
            captions: options.captions,
            captionOptions: {
              font: options.font,
              fontPath: options.fontPath,
              style: options.style,
              size: options.size,
              position: options.position,
              color: options.captionColor,
              background: options.captionBg,
            },
            background: options.background,
            intro: options.intro,
            outro: options.outro,
            width: options.width,
            height: options.height,
            title: meta.title ?? options.title,
            description: meta.description ?? options.description,
            tags: meta.tags ?? (options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined),
            publishAt: meta.publishAt ?? options.publishAt,
          } as any;
          await withInterrupt(
            () => { invoke('cancel_generate'); invoke('cancel_upload'); },
            () => generateAndUpload(params, showProgress, showProgress)
          );
        }
      } else {
        const result = await withInterrupt(
          () => { invoke('cancel_generate'); invoke('cancel_upload'); },
          () => callWithUploadProgress(
            () => callWithProgress(
              () => invoke('generate_batch_upload', {
                files,
                outputDir: options.outputDir,
                captions: options.captions,
                captionOptions: {
                  font: options.font,
                  fontPath: options.fontPath,
                  style: options.style,
                  size: options.size,
                  position: options.position,
                  color: options.captionColor,
                  background: options.captionBg,
                },
                background: options.background,
                intro: options.intro,
                outro: options.outro,
                width: options.width,
                height: options.height,
                title: options.title,
                description: options.description,
                tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
                publishAt: options.publishAt,
              } as any),
              showProgress,
            ),
            showProgress,
          )
        );
        console.log(result);
      }
    } catch (err) {
      console.error('Error generating and uploading batch:', err);
      process.exitCode = 1;
    }
  });

program
  .command('generate-batch')
  .alias('batch')
  .description('Generate multiple videos')
  .argument('[files...]', 'audio files')
  .option('--csv <file>', 'CSV metadata file')
  .option('-d, --output-dir <dir>', 'output directory', '.')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--caption-color <color>', 'caption text color (hex)')
  .option('--color <color>', 'alias for --caption-color')
  .option('--caption-bg <color>', 'caption background color (hex)')
  .option('--bg-color <color>', 'alias for --caption-bg')
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .action(async (files: string[], options: any) => {
    try {
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;

      let csvMap: Record<string, CsvRow> = {};
      if (options.csv) {
        const rows = await parseCsv(options.csv);
        csvMap = Object.fromEntries(rows.map(r => [r.file, r]));
        if (!files.length) files = rows.map(r => r.file);
      }

      if (options.csv) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const meta = csvMap[file] || {};
          const params: GenerateParams = {
            file,
            output: path.join(
              options.outputDir,
              path.basename(file, path.extname(file)) + '.mp4'
            ),
            captions: options.captions,
            captionOptions: {
              font: options.font,
              fontPath: options.fontPath,
              style: options.style,
              size: options.size,
              position: options.position,
              color: options.captionColor,
              background: options.captionBg,
            },
            background: options.background,
            intro: options.intro,
            outro: options.outro,
            width: options.width,
            height: options.height,
            title: meta.title ?? options.title,
            description: meta.description ?? options.description,
            tags: meta.tags ?? (options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined),
            publishAt: meta.publishAt ?? options.publishAt,
          } as any;
          await withInterrupt(
            () => invoke('cancel_generate'),
            () => generateVideo(
              params,
              (p) => showProgress(((i + p / 100) / files.length) * 100),
            )
          );
        }
        showProgress(100);
      } else {
        const results = await withInterrupt(
          () => invoke('cancel_generate'),
          () => generateBatchWithProgress(
            files,
            {
              outputDir: options.outputDir,
              captions: options.captions,
              captionOptions: {
                font: options.font,
                fontPath: options.fontPath,
                style: options.style,
                size: options.size,
                position: options.position,
                color: options.captionColor,
                background: options.captionBg,
              },
              background: options.background,
              intro: options.intro,
              outro: options.outro,
              width: options.width,
              height: options.height,
              title: options.title,
              description: options.description,
              tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
              publishAt: options.publishAt,
            },
            (cur, total) => showProgress((cur / total) * 100),
          )
        );
        results.forEach(r => console.log(r));
      }
    } catch (err) {
      console.error('Error generating batch:', err);
      process.exitCode = 1;
    }
  });

program
  .command('upload')
  .description('Upload video to YouTube')
  .argument('<file>', 'video file path')
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .action(async (file: string, options: any) => {
    try {
      const result = await withInterrupt(
        () => invoke('cancel_upload'),
        () => uploadVideo(
          {
            file,
            title: options.title,
            description: options.description,
            tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
            publishAt: options.publishAt,
          },
          showProgress,
        )
      );
      console.log(result);
    } catch (err) {
      console.error('Error uploading video:', err);
      process.exitCode = 1;
    }
  });

program
  .command('upload-batch')
  .description('Upload multiple videos to YouTube')
  .argument('[files...]', 'video files')
  .option('--csv <file>', 'CSV metadata file')
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .action(async (files: string[], options: any) => {
    try {
      let csvMap: Record<string, CsvRow> = {};
      if (options.csv) {
        const rows = await parseCsv(options.csv);
        csvMap = Object.fromEntries(rows.map(r => [r.file, r]));
        if (!files.length) files = rows.map(r => r.file);
      }

      if (options.csv) {
        for (const file of files) {
          const meta = csvMap[file] || {};
          const res = await uploadVideo(
            {
              file,
              title: meta.title ?? options.title,
              description: meta.description ?? options.description,
              tags: meta.tags ?? (options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined),
              publishAt: meta.publishAt ?? options.publishAt,
            },
            showProgress,
          );
          console.log(res);
        }
      } else {
        const results = await withInterrupt(
          () => invoke('cancel_upload'),
          () => uploadVideos(
            {
              files,
              title: options.title,
              description: options.description,
              tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
              publishAt: options.publishAt,
            },
            showProgress,
          )
        ) as any[];
        results.forEach((res: any) => console.log(res));
      }
    } catch (err) {
      console.error('Error uploading videos:', err);
      process.exitCode = 1;
    }
  });

program
  .command('sign-in')
  .description('Authenticate with YouTube')
  .action(async () => {
    try {
      await signIn();
      console.log('Sign-in complete');
    } catch (err) {
      console.error('Error during sign-in:', err);
      process.exitCode = 1;
    }
  });

program
  .command('sign-out')
  .description('Remove stored YouTube credentials')
  .action(async () => {
    try {
      await signOut();
      console.log('Signed out');
    } catch (err) {
      console.error('Error during sign-out:', err);
      process.exitCode = 1;
    }
  });

program
  .command('transcribe')
  .description('Transcribe audio to SRT')
  .argument('<file>', 'audio file path')
  .option('-l, --language <lang>', 'language code (auto|ne|hi|en)', 'auto')
  // Specify one or more target language codes using multiple -t options
  .option('-t, --translate <lang...>', 'translate subtitles to languages')
  .action(async (file: string, options: any) => {
    try {
      const results = await transcribeAudio({
        file,
        language: options.language,
        translate: options.translate,
      });
      results.forEach(r => console.log(r));
    } catch (err) {
      console.error('Error transcribing audio:', err);
      process.exitCode = 1;
    }
  });

program
  .command('watch')
  .description('Watch directory for new audio files')
  .argument('<dir>', 'directory path')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--caption-color <color>', 'caption text color (hex)')
  .option('--color <color>', 'alias for --caption-color')
  .option('--caption-bg <color>', 'caption background color (hex)')
  .option('--bg-color <color>', 'alias for --caption-bg')
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .option('--auto-upload', 'upload after generating')
  .action(async (dir: string, options: any) => {
    if (options.color && !options.captionColor) options.captionColor = options.color;
    if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;
    await watchDirectory(dir, {
      captions: options.captions,
      captionOptions: {
        font: options.font,
        fontPath: options.fontPath,
        style: options.style,
        size: options.size,
        position: options.position,
        color: options.captionColor,
        background: options.captionBg,
      },
      background: options.background,
      intro: options.intro,
      outro: options.outro,
      width: options.width,
      height: options.height,
      title: options.title,
      description: options.description,
      tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
      publishAt: options.publishAt,
      autoUpload: options.autoUpload,
    } as any);
  });

program
  .command('edit-srt')
  .description('Edit an SRT file using $EDITOR')
  .argument('<file>', 'subtitle file')
  .action(async (file: string) => {
    const editor = process.env.EDITOR || 'vi';
    const tmp = path.join(os.tmpdir(), `edit-${Date.now()}.srt`);
    await fs.copyFile(file, tmp);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(editor, [tmp], { stdio: 'inherit' });
      child.on('exit', () => resolve());
      child.on('error', reject);
    });
    const data = await fs.readFile(tmp, 'utf-8');
    await fs.writeFile(file, data);
    await fs.unlink(tmp);
  });

program.parseAsync(process.argv);
