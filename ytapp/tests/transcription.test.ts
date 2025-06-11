import assert from 'assert';
import * as transcription from '../src/features/transcription';
const core = require('@tauri-apps/api/core');
core.invoke = async (cmd: string, args: any) => {
  if (cmd === 'load_srt') {
    assert.strictEqual(args.path, '/tmp/test.srt');
    return 'hello';
  }
  if (cmd === 'save_srt') {
    assert.strictEqual(args.path, '/tmp/test.srt');
    assert.strictEqual(args.data, 'world');
    return;
  }
};
(async () => {
  const d = await transcription.loadSrt('/tmp/test.srt');
  assert.strictEqual(d, 'hello');
  await transcription.saveSrt('/tmp/test.srt', 'world');
  console.log('ts tests passed');
})();
