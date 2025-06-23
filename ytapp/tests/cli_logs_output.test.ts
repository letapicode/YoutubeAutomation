import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');
const fs = require('fs/promises');

(async () => {
  let args: any;
  core.invoke = async (cmd: string, a: any) => { if (cmd === 'get_logs') args = a; };
  events.listen = async () => () => {};
  fs.writeFile = async () => {};
  process.argv = ['node', 'cli.ts', 'logs', '50', '--level', 'info', '--output', '/tmp/out.log'];
  await import('../src/cli');
  assert.strictEqual(args.maxLines, 50);
  // ensure the command executed and invoked get_logs
  console.log('cli logs output test passed');
})();
