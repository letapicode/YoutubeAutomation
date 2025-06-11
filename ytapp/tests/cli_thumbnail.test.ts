import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let args: any;
  core.invoke = async (cmd: string, a: any) => {
    if (cmd === 'upload_video') args = a;
  };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'upload', 'video.mp4', '--thumbnail', 'thumb.jpg'];
  await import('../src/cli');
  assert.strictEqual(args.thumbnail, 'thumb.jpg');
  console.log('cli thumbnail test passed');
})();
