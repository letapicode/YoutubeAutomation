import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let called = false;
  core.invoke = async (cmd: string) => {
    called = true;
    assert.strictEqual(cmd, 'youtube_is_signed_in');
    return true;
  };
  events.listen = async () => () => {};
  const logs: string[] = [];
  console.log = (msg: string) => { logs.push(msg); };
  process.argv = ['node', 'cli.ts', 'is-signed-in'];
  await import('../src/cli');
  assert.ok(called);
  assert.ok(logs.some(l => l.includes('Signed in')));
  console.log('cli is-signed-in true test passed');
})();
