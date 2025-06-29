import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = false;
  core.invoke = async (cmd: string) => { if (cmd === 'cancel_upload') called = true; };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'upload-cancel'];
  await import('../src/cli');
  assert.ok(called);
  console.log('cli upload-cancel test passed');
})();
