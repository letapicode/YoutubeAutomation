import assert from 'assert';
import { uploadVideo } from '../src/features/youtube';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

core.invoke = async (cmd: string, args: any) => {
  assert.strictEqual(cmd, 'upload_video');
  assert.strictEqual(args.file, '/tmp/video.mp4');
  assert.strictEqual(args.thumbnail, '/tmp/thumb.jpg');
  return 'ok';
};

events.listen = async (name: string, handler: (e: any) => void) => {
  assert.strictEqual(name, 'upload_progress');
  handler({ payload: 0 });
  handler({ payload: 50 });
  handler({ payload: 100 });
  return () => {};
};

(async () => {
  let called = 0;
  const res = await uploadVideo({ file: '/tmp/video.mp4', thumbnail: '/tmp/thumb.jpg' }, () => called++);
  assert.strictEqual(res, 'ok');
  assert.ok(called > 0);
  console.log('upload tests passed');
})();
