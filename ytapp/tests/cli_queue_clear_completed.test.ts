import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  const calls: string[] = [];
  core.invoke = async (cmd: string) => { calls.push(cmd); };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-clear-completed'];
  await import('../src/cli');
  await new Promise(r => setImmediate(r));
  assert.deepStrictEqual(calls, ['queue_clear_completed', 'queue_clear_failed']);
  console.log('cli queue-clear-completed test passed');
})();
