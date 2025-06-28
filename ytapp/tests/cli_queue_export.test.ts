import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = '';
  let args: any;
  core.invoke = async (cmd: string, a: any) => { called = cmd; args = a; };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-export', '/tmp/q.json'];
  await import('../src/cli');
  assert.strictEqual(called, 'queue_export');
  assert.strictEqual(args.path, '/tmp/q.json');
  console.log('cli queue-export test passed');
})();
