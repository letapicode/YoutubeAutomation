import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  core.invoke = async (cmd: string) => {
    assert.strictEqual(cmd, 'list_fonts');
    return [{ name: 'Arial', style: 'Regular', path: '/fonts/arial.ttf' }];
  };
  events.listen = async () => () => {};
  const logs: string[] = [];
  console.log = (msg: string) => { logs.push(msg); };
  process.argv = ['node', 'cli.ts', 'list-fonts'];
  await import('../src/cli');
  assert.ok(logs.some(l => l.includes('Arial')));
  console.log('cli list-fonts test passed');
})();
