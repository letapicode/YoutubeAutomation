import assert from 'assert';
import { translateSrt } from '../src/utils/translate';
const child = require('child_process');

(async () => {
  let called = false;
  child.spawn = (cmd: string, args: string[]) => {
    called = true;
    assert.strictEqual(cmd, 'argos-translate');
    const idx = args.indexOf('--from-lang');
    assert.ok(idx >= 0);
    assert.strictEqual(args[idx + 1], 'fr');
    return {
      on: (ev: string, cb: (code: number) => void) => {
        if (ev === 'exit') setTimeout(() => cb(0), 0);
      },
    } as any;
  };

  const out = await translateSrt('/tmp/test.srt', 'es', 'fr');
  assert.strictEqual(out, '/tmp/test.es.srt');
  assert.ok(called);
  console.log('translate tests passed');
})();
