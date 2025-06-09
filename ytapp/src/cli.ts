import { program } from 'commander';
import { invoke } from '@tauri-apps/api/core';
import path from 'path';

interface CaptionOptions {
  font?: string;
  size?: number;
  position?: string;
}

interface GenerateParams {
  file: string;
  output?: string;
  captions?: string;
  captionOptions?: CaptionOptions;
  background?: string;
  intro?: string;
  outro?: string;
}

async function generateVideo(params: GenerateParams): Promise<any> {
  return await invoke('generate_video', params as any);
}

async function uploadVideo(params: { file: string }): Promise<any> {
  return await invoke('upload_video', params as any);
}

async function uploadVideos(params: { files: string[] }): Promise<any> {
  return await invoke('upload_videos', params as any);
}

async function transcribeAudio(params: { file: string; language?: string }): Promise<any> {
  return await invoke('transcribe_audio', params as any);
}

async function generateAndUpload(params: GenerateParams): Promise<any> {
  return await invoke('generate_upload', params as any);
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
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .action(async (file: string, options: any) => {
    try {
      const params: GenerateParams = {
        file,
        output: options.output,
        captions: options.captions,
        captionOptions: {
          font: options.font,
          size: options.size,
          position: options.position,
        },
        background: options.background,
        intro: options.intro,
        outro: options.outro,
      };
      const result = await generateVideo(params);
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
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .action(async (file: string, options: any) => {
    try {
      const params: GenerateParams = {
        file,
        output: options.output,
        captions: options.captions,
        captionOptions: {
          font: options.font,
          size: options.size,
          position: options.position,
        },
        background: options.background,
        intro: options.intro,
        outro: options.outro,
      };
      const result = await generateAndUpload(params);
      console.log(result);
    } catch (err) {
      console.error('Error generating and uploading video:', err);
      process.exitCode = 1;
    }
  });

program
  .command('generate-upload-batch')
  .description('Generate multiple videos and upload to YouTube')
  .argument('<files...>', 'audio files')
  .option('-d, --output-dir <dir>', 'output directory', '.')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .action(async (files: string[], options: any) => {
    try {
      const result = await invoke('generate_batch_upload', {
        files,
        outputDir: options.outputDir,
        captions: options.captions,
        captionOptions: {
          font: options.font,
          size: options.size,
          position: options.position,
        },
        background: options.background,
        intro: options.intro,
        outro: options.outro,
      } as any);
      console.log(result);
    } catch (err) {
      console.error('Error generating and uploading batch:', err);
      process.exitCode = 1;
    }
  });

program
  .command('batch')
  .description('Generate multiple videos')
  .argument('<files...>', 'list of audio files')
  .option('-d, --output-dir <dir>', 'output directory', '.')
  .option('--captions <srt>', 'captions file path')
  .option('--font <font>', 'caption font')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .action(async (files: string[], options: any) => {
    for (const file of files) {
      const output = path.join(
        options.outputDir,
        path.basename(file, path.extname(file)) + '.mp4'
      );
      try {
        await generateVideo({
          file,
          output,
          captions: options.captions,
          captionOptions: {
            font: options.font,
            size: options.size,
            position: options.position,
          },
          background: options.background,
          intro: options.intro,
          outro: options.outro,
        });
        console.log('Generated', output);
      } catch (err) {
        console.error('Error generating', file, err);
      }
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
  .command('upload-batch')
  .description('Upload multiple videos to YouTube')
  .argument('<files...>', 'video files')
  .action(async (files: string[]) => {
    try {
      const results = await uploadVideos({ files }) as any[];
      results.forEach((res: any) => console.log(res));
    } catch (err) {
      console.error('Error uploading videos:', err);
      process.exitCode = 1;
    }
  });

program
  .command('transcribe')
  .description('Transcribe audio to SRT')
  .argument('<file>', 'audio file path')
  .option('-l, --language <lang>', 'language code (auto|ne|hi|en)', 'auto')
  .action(async (file: string, options: any) => {
    try {
      const result = await transcribeAudio({ file, language: options.language });
      console.log(result);
    } catch (err) {
      console.error('Error transcribing audio:', err);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
