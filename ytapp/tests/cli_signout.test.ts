import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let invoked = false;
  core.invoke = async (cmd: string) => {
    assert.strictEqual(cmd, 'youtube_sign_out');
    invoked = true;
  };
  events.listen = async () => () => {};
  const logs: string[] = [];
  console.log = (msg: string) => { logs.push(msg); };
  process.argv = ['node', 'cli.ts', 'sign-out'];
  await import('../src/cli');
  assert.ok(invoked);
  assert.ok(logs.some(l => l.includes('Signed out')));
  console.log('cli sign-out test passed');
})();
