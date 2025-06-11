import assert from 'assert';
import fs from 'fs/promises';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  const csv = '/tmp/cli.csv';
  await fs.writeFile(csv, 'file,title\na.mp3,FromCSV\n');
  let called = false;
  core.invoke = async (cmd: string, args: any) => {
    called = true;
    assert.strictEqual(cmd, 'generate_upload');
    assert.strictEqual(args.file, 'a.mp3');
    assert.strictEqual(args.title, 'FromCSV');
    return 'ok';
  };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'generate-upload-batch', 'a.mp3', '--csv', csv];
  await import('../src/cli');
  await new Promise(r => setTimeout(r, 10));
  assert.ok(called);
  console.log('cli csv test passed');
})();
