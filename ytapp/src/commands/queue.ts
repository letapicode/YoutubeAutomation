import { Command } from 'commander';
import { invoke } from '@tauri-apps/api/core';
import path from 'path';
import { parseCsv, CsvRow } from '../utils/csv';
import { verifyDependencies } from '../features/dependencies';
import { addJob, listJobs, runQueue, clearQueue, clearFailed, clearFinished, removeJob, moveJob, exportQueue, importQueue, getQueueSummary, pauseQueue, resumeQueue } from '../features/queue';
import type { GenerateParams } from '../schema';
import { mergeProfile, showProgress } from './utils';

export function registerQueueCommands(program: Command): void {
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
    .command('queue-add-batch')
    .description('Add multiple jobs to the processing queue')
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
    .option('-p, --profile <name>', 'load profile')
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

        for (const file of files) {
          const meta = csvMap[file] || {};
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
            title: meta.title ?? options.title,
            description: meta.description ?? options.description,
            tags: meta.tags ?? (options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined),
            publishAt: meta.publishAt ?? options.publishAt,
            thumbnail: options.thumbnail,
          });
          const params: GenerateParams = {
            file,
            output: path.join(options.outputDir, path.basename(file, path.extname(file)) + '.mp4'),
            ...merged,
          } as any;
          const dest = path.join(options.outputDir, path.basename(file, path.extname(file)) + '.mp4');
          await addJob({ GenerateUpload: { params, dest, thumbnail: options.thumbnail } } as any);
        }
      } catch (err) {
        console.error('Error adding batch jobs:', err);
        process.exitCode = 1;
      }
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
    .command('queue-status')
    .description('Show summary of queue jobs by status')
    .action(async () => {
      try {
        const summary = await getQueueSummary();
        console.log(JSON.stringify(summary, null, 2));
      } catch (err) {
        console.error('Error getting queue summary:', err);
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
    .command('queue-move')
    .description('Move a job to a new position')
    .argument('<from>', 'current index')
    .argument('<to>', 'destination index')
    .action(async (from: string, to: string) => {
      try {
        await moveJob(parseInt(from, 10), parseInt(to, 10));
      } catch (err) {
        console.error('Error moving job:', err);
        process.exitCode = 1;
      }
    });

  program
    .command('queue-export')
    .description('Export queue to a JSON file')
    .argument('<file>', 'output file')
    .action(async (file: string) => {
      try {
        await exportQueue(file);
      } catch (err) {
        console.error('Error exporting queue:', err);
        process.exitCode = 1;
      }
    });

  program
    .command('queue-import')
    .description('Import queue from a JSON file')
    .argument('<file>', 'input file')
    .option('--append', 'append to existing queue')
    .action(async (file: string, opts: { append?: boolean }) => {
      try {
        await importQueue(file, !!opts.append);
      } catch (err) {
        console.error('Error importing queue:', err);
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
    .command('queue-clear-failed')
    .description('Remove failed jobs from the queue')
    .action(async () => {
      try {
        await clearFailed();
      } catch (err) {
        console.error('Error clearing failed jobs:', err);
        process.exitCode = 1;
      }
    });

  program
    .command('queue-clear-completed')
    .description('Remove completed and failed jobs from the queue')
    .action(async () => {
      try {
        await clearFinished();
      } catch (err) {
        console.error('Error clearing completed and failed jobs:', err);
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
}
