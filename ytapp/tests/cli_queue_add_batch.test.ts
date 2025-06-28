import assert from 'assert';
import fs from 'fs/promises';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  const csv = '/tmp/queue_batch.csv';
  await fs.writeFile(csv, 'file,title\na.mp3,First\n');
  const calls: any[] = [];
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'queue_add') calls.push(args);
  };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-add-batch', 'a.mp3', '--csv', csv, '-d', '/out'];
  await import('../src/cli');
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].job.GenerateUpload.params.file, 'a.mp3');
  assert.strictEqual(calls[0].job.GenerateUpload.dest, '/out/a.mp4');
  console.log('cli queue-add-batch test passed');
})();
