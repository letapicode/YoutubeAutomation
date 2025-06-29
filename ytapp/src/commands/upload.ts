import { Command } from 'commander';
import { invoke } from '@tauri-apps/api/core';
import { parseCsv, CsvRow } from '../utils/csv';
import { verifyDependencies } from '../features/dependencies';
import { listProfiles, saveProfile, deleteProfile } from '../features/profiles';
import type { Profile } from '../schema';
import { uploadVideo, uploadVideos, showProgress, withInterrupt, signIn, signOut, isSignedIn } from './utils';

export function registerUploadCommands(program: Command): void {
  program
    .command('upload')
    .description('Upload video to YouTube')
    .argument('<file>', 'video file')
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
          ),
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
            ),
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
    .command('is-signed-in')
    .description('Check whether YouTube credentials are present')
    .action(async () => {
      try {
        const ok = await isSignedIn();
        console.log(ok ? 'Signed in' : 'Not signed in');
      } catch (err) {
        console.error('Error checking sign-in:', err);
        process.exitCode = 1;
      }
    });

  program
    .command('upload-cancel')
    .description('Cancel running upload')
    .action(async () => {
      try {
        await invoke('cancel_upload');
      } catch (err) {
        console.error('Error canceling upload:', err);
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
      const data = JSON.parse(await (await import('fs/promises')).readFile(file, 'utf-8')) as Profile;
      await saveProfile(name, data);
    });

  program
    .command('profile-delete')
    .description('Delete a profile')
    .argument('<name>', 'profile name')
    .action(async (name: string) => {
      await deleteProfile(name);
    });
}
