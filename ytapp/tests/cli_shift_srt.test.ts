import assert from 'assert';
import fs from 'fs/promises';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  const path = '/tmp/shift.srt';
  await fs.writeFile(path, '1\n00:00:00,000 --> 00:00:01,000\nhi\n');
  core.invoke = async () => {};
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'shift-srt', path, '1'];
  await import('../src/cli');
  await new Promise(r => setTimeout(r, 10));
  const data = await fs.readFile(path, 'utf-8');
  assert.ok(data.includes('00:00:01,000 --> 00:00:02,000'));
  console.log('cli shift-srt test passed');
})();
