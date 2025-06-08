import { program } from 'commander';
import { invoke } from '@tauri-apps/api/tauri';

async function generateVideo(params: { file: string; output?: string }) {
  return await invoke('generate_video', params);
}

async function uploadVideo(params: { file: string }) {
  return await invoke('upload_video', params);
}

program
  .name('ytcli')
  .description('CLI for generating and uploading videos')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate video from audio')
  .argument('<file>', 'audio file path')
  .option('-o, --output <output>', 'output video path')
  .action(async (file: string, options: { output?: string }) => {
    try {
      const result = await generateVideo({ file, output: options.output });
      console.log(result);
    } catch (err) {
      console.error('Error generating video:', err);
      process.exitCode = 1;
    }
  });

program
  .command('upload')
  .description('Upload video to YouTube')
  .argument('<file>', 'video file path')
  .action(async (file: string) => {
    try {
      const result = await uploadVideo({ file });
      console.log(result);
    } catch (err) {
      console.error('Error uploading video:', err);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
