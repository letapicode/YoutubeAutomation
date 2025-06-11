import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = '';
  core.invoke = async (cmd: string, args: any) => {
    called = cmd;
    if (cmd === 'queue_add') {
      assert.strictEqual(args.job.GenerateUpload.params.file, 'a.mp3');
      assert.strictEqual(args.job.GenerateUpload.thumbnail, '/tmp/t.jpg');
    }
  };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-add', 'a.mp3', '--thumbnail', '/tmp/t.jpg'];
  await import('../src/cli');
  assert.strictEqual(called, 'queue_add');
  console.log('cli queue tests passed');
})();
