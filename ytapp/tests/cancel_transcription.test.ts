import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let cancelCalled = false;
  let rejectFn: (() => void) | null = null;
  core.invoke = async (cmd: string) => {
    if (cmd === 'transcribe_audio') {
      return new Promise((_r, rej) => { rejectFn = () => rej(new Error('canceled')); });
    }
    if (cmd === 'cancel_transcription') {
      cancelCalled = true;
      if (rejectFn) rejectFn();
    }
  };
  let handler: any;
  events.listen = async (name: string, h: (e: any) => void) => {
    if (name === 'transcribe_canceled') handler = h;
    return () => {};
  };
  const { transcribeAudio, cancelTranscription } = await import('../src/features/transcription');
  const p = transcribeAudio({ file: 'a.mp3' }).catch(() => 'canceled');
  await cancelTranscription();
  if (handler) handler({});
  const res = await p;
  assert.strictEqual(res, 'canceled');
  assert.ok(cancelCalled);
  console.log('transcription cancel tests passed');
})();
