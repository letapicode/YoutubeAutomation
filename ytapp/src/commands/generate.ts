import { Command } from 'commander';
import path from 'path';
import { invoke } from '@tauri-apps/api/core';
import { parseCsv, CsvRow } from '../utils/csv';
import { generateBatchWithProgress } from '../features/batch';
import { verifyDependencies } from '../features/dependencies';
import { watchDirectory } from '../features/watch';
import type { GenerateParams } from '../schema';
import { mergeProfile, showProgress, withInterrupt, generateVideo, generateAndUpload, transcribeAudio, callWithUploadProgress, callWithProgress } from './utils';

export function registerGenerateCommands(program: Command): void {
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
    .option('--fps <fps>', 'frames per second', (v) => parseInt(v, 10))
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
          fps: options.fps,
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
          ),
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
    .option('--fps <fps>', 'frames per second', (v) => parseInt(v, 10))
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
          fps: options.fps,
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
          ),
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
    .option('--watermark <file>', 'watermark image')
    .option('--watermark-position <pos>', 'watermark position (top-left|top-right|bottom-left|bottom-right)')
    .option('--watermark-opacity <n>', 'watermark opacity (0-1)', (v) => parseFloat(v))
    .option('--watermark-scale <n>', 'watermark scale relative to width', (v) => parseFloat(v))
    .option('--intro <file>', 'intro video or image')
    .option('--outro <file>', 'outro video or image')
    .option('--width <width>', 'output width', (v) => parseInt(v, 10))
    .option('--height <height>', 'output height', (v) => parseInt(v, 10))
    .option('--fps <fps>', 'frames per second', (v) => parseInt(v, 10))
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
              fps: options.fps,
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
                  fps: options.fps,
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
    .option('--fps <fps>', 'frames per second', (v) => parseInt(v, 10))
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
              () => invoke('cancel_generate'),
              () => generateVideo(
                params,
                showProgress,
              )
            );
          }
        } else {
          const result = await withInterrupt(
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
              },
              (i, total) => showProgress((i / total) * 100),
            )
          );
          result.forEach(r => console.log(r));
        }
      } catch (err) {
        console.error('Error generating batch:', err);
        process.exitCode = 1;
      }
    });

  program
    .command('transcribe')
    .description('Transcribe audio to SRT')
    .argument('<file>', 'audio file path')
    .option('-l, --language <lang>', 'language code (auto|ne|hi|en)', 'auto')
    .option('-m, --model-size <size>', 'Whisper model size (tiny|base|small|medium|large)', 'base')
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
    .command('transcribe-cancel')
    .description('Cancel running transcription')
    .action(async () => {
      try {
        await invoke('cancel_transcription');
      } catch (err) {
        console.error('Error canceling transcription:', err);
        process.exitCode = 1;
      }
    });

  program
    .command('generate-cancel')
    .description('Cancel running video generation')
    .action(async () => {
      try {
        await invoke('cancel_generate');
      } catch (err) {
        console.error('Error canceling generation:', err);
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
    .option('--fps <fps>', 'frames per second', (v) => parseInt(v, 10))
    .option('--title <title>', 'video title')
    .option('--description <desc>', 'video description')
    .option('--tags <tags>', 'comma separated tags')
    .option('--publish-at <date>', 'schedule publish date (ISO)')
    .option('--recursive', 'watch subdirectories')
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
        fps: options.fps,
        title: options.title,
        description: options.description,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        publishAt: options.publishAt,
        recursive: options.recursive,
        autoUpload: options.autoUpload,
      } as any);
    });

  program
    .command('watch-stop')
    .description('Stop watching for new audio files')
    .action(async () => {
      try {
        const { stopWatching } = await import('../features/watch');
        await stopWatching();
      } catch (err) {
        console.error('Error stopping watch:', err);
        process.exitCode = 1;
      }
    });
}
