import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';
const fsSync = require('fs');
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  const dir = await fs.mkdtemp('/tmp/watch-');
  let called = false;
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'watch_directory') {
      const watcher = fsSync.watch(dir, (event: string, filename: string) => {
        if (event === 'rename') {
          core.invoke('generate_upload', { file: path.join(dir, filename) });
          watcher.close();
        }
      });
      return;
    }
    if (cmd === 'generate_upload') {
      called = true;
      return 'ok';
    }
  };
  events.listen = async () => () => {};
  await (await import('../src/features/watch')).watchDirectory(dir, { autoUpload: true });
  await fs.writeFile(path.join(dir, 'a.mp3'), 'x');
  await new Promise(r => setTimeout(r, 100));
  assert.ok(called);
  console.log('watch directory tests passed');
})();

(async () => {
  let called: string | undefined;
  core.invoke = async (cmd: string) => {
    called = cmd;
  };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'watch-stop'];
  await import('../src/cli');
  assert.strictEqual(called, 'watch_stop');
  console.log('cli watch-stop test passed');
})();

(async () => {
  let args: any;
  core.invoke = async (cmd: string, a: any) => {
    if (cmd === 'watch_directory') args = a;
  };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'watch', '/tmp/in', '--recursive'];
  await import('../src/cli');
  assert.strictEqual(args.dir, '/tmp/in');
  assert.strictEqual(args.recursive, true);
  console.log('cli watch recursive flag passed');
})();

(async () => {
  const dir = await fs.mkdtemp('/tmp/watch-');
  let closed = false;
  let watcher: any;
  core.invoke = async (cmd: string) => {
    if (cmd === 'watch_directory') {
      watcher = fsSync.watch(dir, () => {});
      return;
    }
    if (cmd === 'watch_stop') {
      watcher.close();
      closed = true;
      return;
    }
  };
  events.listen = async () => () => {};
  const mod = await import('../src/features/watch');
  await mod.watchDirectory(dir, {} as any);
  await mod.stopWatching();
  assert.ok(closed);
  console.log('watch-stop removes watcher passed');
})();
