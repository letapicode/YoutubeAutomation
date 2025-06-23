import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let args: any;
  core.invoke = async (cmd: string, a: any) => { if (cmd === 'get_logs') args = a; };
  events.listen = async () => () => {};
  process.argv = ['node', 'cli.ts', 'logs', '50', '--level', 'error', '--search', 'fail'];
  await import('../src/cli');
  assert.strictEqual(args.maxLines, 50);
  assert.strictEqual(args.level, 'error');
  assert.strictEqual(args.search, 'fail');
  console.log('cli logs filter test passed');
})();
