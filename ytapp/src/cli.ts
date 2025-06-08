import { program } from 'commander';
import { invoke } from '@tauri-apps/api/tauri';

interface GenerateParams {
  audio: string;
  output?: string;
  background?: string;
  intro?: string;
  outro?: string;
  captions?: string;
}

async function generateVideo(params: GenerateParams) {
  return await invoke('generate_video', params);
}

async function uploadVideo(params: { file: string }) {
  return await invoke('upload_video', params);
}

async function transcribeAudio(params: { file: string }) {
  return await invoke('transcribe_audio', params);
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
  .option('-b, --background <background>', 'background image or video')
  .option('--intro <intro>', 'intro video or image')
  .option('--outro <outro>', 'outro video or image')
  .option('--captions <srt>', 'captions SRT file to burn')
  .action(async (file: string, options) => {
    try {
      const result = await generateVideo({
        audio: file,
        output: options.output,
        background: options.background,
        intro: options.intro,
        outro: options.outro,
        captions: options.captions,
      });
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

program
  .command('transcribe')
  .description('Transcribe audio to SRT')
  .argument('<file>', 'audio file path')
  .action(async (file: string) => {
    try {
      const result = await transcribeAudio({ file });
      console.log(result);
    } catch (err) {
      console.error('Error transcribing audio:', err);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
