// Command line interface mirroring the GUI functionality.
import { program } from 'commander';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import { CaptionOptions, GenerateParams } from './schema';
import { translateSrt } from './utils/translate';
import { parseCsv, CsvRow } from './utils/csv';
import { watchDirectory } from './features/watch';
import { generateBatchWithProgress } from './features/batch';
import { addJob, listJobs, runQueue, clearQueue, clearCompleted, removeJob, pauseQueue, resumeQueue } from './features/queue';
import { listProfiles, getProfile, saveProfile, deleteProfile } from './features/profiles';
import { listFonts } from './features/fonts';
import { fetchPlaylists } from './features/youtube';
import type { Profile } from './schema';
import { verifyDependencies } from './features/dependencies';
import { getLogs } from './features/logs';

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

async function mergeProfile(name: string | undefined, params: Partial<Profile>): Promise<Partial<Profile>> {
  if (!name) return params;
  try {
    const prof = await getProfile(name);
    return { ...prof, ...params };
  } catch {
    return params;
  }
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
  thumbnail?: string;
  privacy?: string;
  playlistId?: string;
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
  modelSize?: string;
}): Promise<string[]> {
  const { file, language = 'auto', translate, modelSize } = params;
  const result: string = await invoke('transcribe_audio', { file, language, size: modelSize });
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
  .command('check-deps')
  .description('Verify required native dependencies')
  .action(async () => {
    try {
      await verifyDependencies();
      console.log('All dependencies present');
    } catch (err) {
      console.error('Dependency check failed:', err);
      process.exitCode = 1;
    }
  });

program
  .command('list-fonts')
  .description('List detected system fonts')
  .action(async () => {
    try {
      const fonts = await listFonts();
      fonts.forEach(f => console.log(`${f.name} (${f.style}) - ${f.path}`));
    } catch (err) {
      console.error('Error listing fonts:', err);
      process.exitCode = 1;
    }
  });

program
  .command('list-playlists')
  .description('List YouTube playlists')
  .action(async () => {
    try {
      const playlists = await fetchPlaylists();
      playlists.forEach(p => console.log(`${p.id} - ${p.title}`));
    } catch (err) {
      console.error('Error listing playlists:', err);
      process.exitCode = 1;
    }
  });

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
  .option('--watermark <file>', 'watermark image')
  .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
  .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
  .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .option('-p, --profile <name>', 'load profile')
  .option('-q, --quiet', 'suppress progress output')
  .action(async (file: string, options: any) => {
    try {
      await verifyDependencies();
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;
      const merged = await mergeProfile(options.profile, {
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
        watermark: options.watermark,
        watermarkPosition: options.watermarkPosition,
        watermarkOpacity: options.watermarkOpacity,
        watermarkScale: options.watermarkScale,
        width: options.width,
        height: options.height,
        title: options.title,
        description: options.description,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        publishAt: options.publishAt,
      });
      const params: GenerateParams = {
        file,
        output: options.output,
        ...merged,
      } as any;
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
  .option('--watermark <file>', 'watermark image')
  .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
  .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
  .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--thumbnail <file>', 'thumbnail image')
  .option('-p, --profile <name>', 'load profile')
  .action(async (file: string, options: any) => {
    try {
      await verifyDependencies();
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;
      const merged = await mergeProfile(options.profile, {
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
        watermark: options.watermark,
        watermarkPosition: options.watermarkPosition,
        watermarkOpacity: options.watermarkOpacity,
        watermarkScale: options.watermarkScale,
        intro: options.intro,
        outro: options.outro,
        width: options.width,
        height: options.height,
        thumbnail: options.thumbnail,
      });
      const params: GenerateParams = {
        file,
        output: options.output,
        ...merged,
      } as any;
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
  .command('queue-add')
  .description('Add a job to the processing queue')
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
  .option('--watermark <file>', 'watermark image')
  .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
  .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
  .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .option('--thumbnail <file>', 'thumbnail image')
  .option('-p, --profile <name>', 'load profile')
  .action(async (file: string, options: any) => {
    try {
      await verifyDependencies();
      if (options.color && !options.captionColor) options.captionColor = options.color;
      if (options.bgColor && !options.captionBg) options.captionBg = options.bgColor;
      const merged = await mergeProfile(options.profile, {
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
        watermark: options.watermark,
        watermarkPosition: options.watermarkPosition,
        watermarkOpacity: options.watermarkOpacity,
        watermarkScale: options.watermarkScale,
        intro: options.intro,
        outro: options.outro,
        width: options.width,
        height: options.height,
        title: options.title,
        description: options.description,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        publishAt: options.publishAt,
        thumbnail: options.thumbnail,
      });
      const params: GenerateParams = {
        file,
        output: options.output,
        ...merged,
      } as any;
      const dest = options.output || path.basename(file, path.extname(file)) + '.mp4';
      await addJob({ GenerateUpload: { params, dest, thumbnail: options.thumbnail } } as any);
    } catch (err) {
      console.error('Error adding job:', err);
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
  .option('--watermark <file>', 'watermark image')
  .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
  .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
  .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .option('--thumbnail <file>', 'thumbnail image')
  .option('--privacy <privacy>', 'video privacy')
  .option('--playlist-id <id>', 'playlist ID')
  .action(async (files: string[], options: any) => {
    try {
      await verifyDependencies();
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
            watermark: options.watermark,
            watermarkPosition: options.watermarkPosition,
            watermarkOpacity: options.watermarkOpacity,
            watermarkScale: options.watermarkScale,
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
                watermark: options.watermark,
                watermarkPosition: options.watermarkPosition,
                watermarkOpacity: options.watermarkOpacity,
                watermarkScale: options.watermarkScale,
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
  .option('--watermark <file>', 'watermark image')
  .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
  .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
  .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
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
      await verifyDependencies();
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
  .option('--thumbnail <file>', 'thumbnail image')
  .option('--privacy <privacy>', 'video privacy')
  .option('--playlist-id <id>', 'playlist ID')
  .action(async (file: string, options: any) => {
    try {
      await verifyDependencies();
      const result = await withInterrupt(
        () => invoke('cancel_upload'),
        () => uploadVideo(
          {
            file,
            title: options.title,
            description: options.description,
            tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
            publishAt: options.publishAt,
            thumbnail: options.thumbnail,
            privacy: options.privacy,
            playlistId: options.playlistId,
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
  .option('--thumbnail <file>', 'thumbnail image')
  .option('--privacy <privacy>', 'video privacy')
  .option('--playlist-id <id>', 'playlist ID')
  .action(async (files: string[], options: any) => {
    try {
      await verifyDependencies();
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
              thumbnail: options.thumbnail,
              privacy: options.privacy,
              playlistId: options.playlistId,
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
              thumbnail: options.thumbnail,
              privacy: options.privacy,
              playlistId: options.playlistId,
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
  .command('profile-list')
  .description('List saved profiles')
  .action(async () => {
    const names = await listProfiles();
    console.log(names.join('\n'));
  });

program
  .command('profile-save')
  .description('Save or update a profile')
  .argument('<name>', 'profile name')
  .argument('<file>', 'json file with profile data')
  .action(async (name: string, file: string) => {
    const data = JSON.parse(await fs.readFile(file, 'utf-8')) as Profile;
    await saveProfile(name, data);
  });

program
  .command('profile-delete')
  .description('Delete a profile')
  .argument('<name>', 'profile name')
  .action(async (name: string) => {
    await deleteProfile(name);
  });

program
  .command('transcribe')
  .description('Transcribe audio to SRT')
  .argument('<file>', 'audio file path')
  .option('-l, --language <lang>', 'language code (auto|ne|hi|en)', 'auto')
  .option('-m, --model-size <size>', 'Whisper model size (tiny|base|small|medium|large)', 'base')
  // Specify one or more target language codes using multiple -t options
  .option('-t, --translate <lang...>', 'translate subtitles to languages')
  .action(async (file: string, options: any) => {
    try {
      await verifyDependencies();
      const results = await transcribeAudio({
        file,
        language: options.language,
        modelSize: options.modelSize,
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
  .option('--watermark <file>', 'watermark image')
  .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
  .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
  .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
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
    await verifyDependencies();
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
      watermark: options.watermark,
      watermarkPosition: options.watermarkPosition,
      watermarkOpacity: options.watermarkOpacity,
      watermarkScale: options.watermarkScale,
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
  .command('queue-list')
  .description('List pending queue jobs')
  .action(async () => {
    try {
      const jobs = await listJobs();
      console.log(JSON.stringify(jobs, null, 2));
    } catch (err) {
      console.error('Error listing queue:', err);
      process.exitCode = 1;
    }
  });

program
  .command('queue-remove')
  .description('Remove a job from the queue by index')
  .argument('<index>', 'job index')
  .action(async (index: string) => {
    try {
      await removeJob(parseInt(index, 10));
    } catch (err) {
      console.error('Error removing job:', err);
      process.exitCode = 1;
    }
  });

program
  .command('queue-clear')
  .description('Remove all jobs from the queue')
  .action(async () => {
    try {
      await clearQueue();
    } catch (err) {
      console.error('Error clearing queue:', err);
      process.exitCode = 1;
    }
  });

program
  .command('queue-clear-completed')
  .description('Remove completed jobs from the queue')
  .action(async () => {
    try {
      await clearCompleted();
    } catch (err) {
      console.error('Error clearing completed jobs:', err);
      process.exitCode = 1;
    }
  });

program
  .command('queue-run')
  .description('Process queued jobs')
  .option('--retry-failed', 'retry previously failed jobs')
  .action(async (opts: any) => {
    try {
      await verifyDependencies();
      await runQueue(!!opts.retryFailed);
    } catch (err) {
      console.error('Error running queue:', err);
      process.exitCode = 1;
    }
  });

program
  .command('queue-pause')
  .description('Pause queue processing')
  .action(async () => {
    try {
      await pauseQueue();
    } catch (err) {
      console.error('Error pausing queue:', err);
      process.exitCode = 1;
    }
  });

program
  .command('queue-resume')
  .description('Resume queue processing')
  .action(async () => {
    try {
      await resumeQueue();
    } catch (err) {
      console.error('Error resuming queue:', err);
      process.exitCode = 1;
    }
  });

program
  .command('logs')
  .description('Print recent log entries')
  .argument('[maxLines]', 'number of lines to show')
  .action(async (maxLines: string | undefined) => {
    try {
      const n = parseInt(maxLines || '', 10);
      const text = await getLogs(isNaN(n) ? 100 : n);
      console.log(text);
    } catch (err) {
      console.error('Error reading logs:', err);
      process.exitCode = 1;
    }
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
