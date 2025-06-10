import { program } from 'commander';
import { invoke } from '@tauri-apps/api/core';
import path from 'path';
import { spawn } from 'child_process';

interface CaptionOptions {
  font?: string;
  fontPath?: string;
  style?: string;
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
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
}

async function generateVideo(params: GenerateParams): Promise<any> {
  return await invoke('generate_video', params as any);
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

async function uploadVideo(params: UploadParams): Promise<any> {
  return await invoke('upload_video', params as any);
}

async function uploadVideos(params: UploadBatchParams): Promise<any> {
  return await invoke('upload_videos', params as any);
}

async function transcribeAudio(params: { file: string; language?: string; translate?: string[] }): Promise<string[]> {
  const { file, language = 'auto', translate } = params;
  const result: string = await invoke('transcribe_audio', { file, language });
  const outputs: string[] = [result];
  if (translate) {
    for (const t of translate) {
      try {
        outputs.push(await translateSrt(result, t));
      } catch {
        // ignore translation errors
      }
    }
  }
  return outputs;
}

function translateSrt(input: string, target: string): Promise<string> {
  const output = input.replace(/\.srt$/, `.${target}.srt`);
  return new Promise((resolve, reject) => {
    const child = spawn('argos-translate', [
      '--input-file', input,
      '--output-file', output,
      '--from-lang', 'en',
      '--to-lang', target,
    ]);
    child.on('exit', code => {
      if (code === 0) resolve(output); else reject(new Error('translation failed'));
    });
  });
}

async function generateAndUpload(params: GenerateParams): Promise<any> {
  return await invoke('generate_upload', params as any);
}

async function signIn(): Promise<void> {
  await invoke('youtube_sign_in');
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
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
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
  .action(async (file: string, options: any) => {
    try {
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
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
  .option('--position <pos>', 'caption position (top|center|bottom)')
  .option('-b, --background <file>', 'background image or video')
  .option('--intro <file>', 'intro video or image')
  .option('--outro <file>', 'outro video or image')
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
  .action(async (file: string, options: any) => {
    try {
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
        },
        background: options.background,
        intro: options.intro,
        outro: options.outro,
        width: options.width,
        height: options.height,
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
  .option('--font-path <path>', 'caption font file')
  .option('--style <style>', 'caption font style')
  .option('--size <size>', 'caption font size', (v) => parseInt(v, 10))
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
      const result = await invoke('generate_batch_upload', {
        files,
        outputDir: options.outputDir,
        captions: options.captions,
        captionOptions: {
          font: options.font,
          fontPath: options.fontPath,
          style: options.style,
          size: options.size,
          position: options.position,
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
  .option('--width <width>', 'output width', (v) => parseInt(v, 10))
  .option('--height <height>', 'output height', (v) => parseInt(v, 10))
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
            fontPath: options.fontPath,
            style: options.style,
            size: options.size,
            position: options.position,
          },
          background: options.background,
          intro: options.intro,
          outro: options.outro,
          width: options.width,
          height: options.height,
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
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .action(async (file: string, options: any) => {
    try {
      const result = await uploadVideo({
        file,
        title: options.title,
        description: options.description,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        publishAt: options.publishAt,
      });
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
  .option('--title <title>', 'video title')
  .option('--description <desc>', 'video description')
  .option('--tags <tags>', 'comma separated tags')
  .option('--publish-at <date>', 'schedule publish date (ISO)')
  .action(async (files: string[], options: any) => {
    try {
      const results = await uploadVideos({
        files,
        title: options.title,
        description: options.description,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
        publishAt: options.publishAt,
      }) as any[];
      results.forEach((res: any) => console.log(res));
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

program.parseAsync(process.argv);
