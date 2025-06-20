import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  events.listen = async () => () => {};
  const logs: string[] = [];
  console.log = (msg: string) => { logs.push(msg); };
  process.argv = ['node', 'cli.ts', 'list-languages'];
  await import('../src/cli');
  assert.ok(logs.some(l => l.includes('en')));
  console.log('cli list-languages test passed');
})();
