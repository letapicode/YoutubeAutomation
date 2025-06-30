import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let cancelCalled = false;
  core.invoke = async (cmd: string) => {
    if (cmd === 'generate_video') {
      return new Promise(() => {});
    }
    if (cmd === 'cancel_generate') {
      cancelCalled = true;
    }
  };
  let handler: any;
  events.listen = async (name: string, h: (e: any) => void) => {
    if (name === 'generate_canceled') handler = h;
    return () => {};
  };
  const { generateVideo } = await import('../src/features/processing');
  const p = generateVideo({ file: 'a.mp3' }, undefined, () => { cancelCalled = true; }).catch(() => 'canceled');
  await core.invoke('cancel_generate');
  if (handler) handler({});
  const res = await p;
  assert.strictEqual(res, 'canceled');
  assert.ok(cancelCalled);
  console.log('cancel tests passed');
})();
