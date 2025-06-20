import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = '';
  let args: any;
  core.invoke = async (cmd: string, a: any) => { called = cmd; args = a; };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-move', '2', '0'];
  await import('../src/cli');
  assert.strictEqual(called, 'queue_move');
  assert.strictEqual(args.from, 2);
  assert.strictEqual(args.to, 0);
  console.log('cli queue-move test passed');
})();
