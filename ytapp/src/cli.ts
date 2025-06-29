// Command line interface mirroring the GUI functionality.
import { program } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import { listFonts } from './features/fonts';
import { fetchPlaylists } from './features/youtube';
import { verifyDependencies } from './features/dependencies';
import { getLogs, clearLogs } from './features/logs';
import { registerGenerateCommands } from './commands/generate';
import { registerUploadCommands } from './commands/upload';
import { registerQueueCommands } from './commands/queue';

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
  .command('list-languages')
  .description('List available transcription languages')
  .action(async () => {
    const dir = path.join(__dirname, 'features/languages/defs');
    try {
      const files = await fs.readdir(dir);
      const defs = await Promise.all(files.map(async f => {
        const data = await fs.readFile(path.join(dir, f), 'utf-8');
        return JSON.parse(data) as { value: string; label: string };
      }));
      defs.sort((a, b) => a.label.localeCompare(b.label));
      defs.forEach(l => console.log(`${l.value} - ${l.label}`));
    } catch (err) {
      console.error('Error listing languages:', err);
      process.exitCode = 1;
    }
  });

registerGenerateCommands(program);
registerUploadCommands(program);
registerQueueCommands(program);

program
  .command('logs')
  .description('Print recent log entries')
  .argument('[maxLines]', 'number of lines to show')
  .option('--level <level>', 'filter by level')
  .option('--search <text>', 'filter by text')
  .option('-o, --output <file>', 'write logs to file')
  .action(async (maxLines: string | undefined, opts: { level?: string; search?: string; output?: string }) => {
    try {
      const n = parseInt(maxLines || '', 10);
      const text = await getLogs(isNaN(n) ? 100 : n, opts.level, opts.search);
      if (opts.output) {
        await fs.writeFile(opts.output, text);
      } else {
        console.log(text);
      }
    } catch (err) {
      console.error('Error reading logs:', err);
      process.exitCode = 1;
    }
  });

program
  .command('logs-clear')
  .description('Delete the log file')
  .action(async () => {
    try {
      await clearLogs();
    } catch (err) {
      console.error('Error clearing logs:', err);
      process.exitCode = 1;
    }
  });

program
  .command('shift-srt')
  .description('Shift SRT timestamps by the given offset in seconds')
  .argument('<file>', 'subtitle file')
  .argument('<offset>', 'offset in seconds')
  .option('-o, --output <file>', 'write to different file')
  .action(async (file: string, offset: string, opts: { output?: string }) => {
    try {
      const { shiftSrt } = await import('./utils/srt');
      await shiftSrt(file, parseFloat(offset), opts.output);
    } catch (err) {
      console.error('Error shifting srt:', err);
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
