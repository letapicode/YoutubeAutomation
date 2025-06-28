import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = '';
  let args: any;
  core.invoke = async (cmd: string, a: any) => { called = cmd; args = a; };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'queue-import', '/tmp/q.json', '--append'];
  await import('../src/cli');
  assert.strictEqual(called, 'queue_import');
  assert.strictEqual(args.path, '/tmp/q.json');
  assert.strictEqual(args.append, true);
  console.log('cli queue-import test passed');
})();
