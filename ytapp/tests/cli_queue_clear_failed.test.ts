import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = '';
  core.invoke = async (cmd: string) => { called = cmd; };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-clear-failed'];
  await import('../src/cli');
  assert.strictEqual(called, 'queue_clear_failed');
  console.log('cli queue-clear-failed test passed');
})();
