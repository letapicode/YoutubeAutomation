import assert from 'assert';
import fs from 'fs/promises';
const fsSync = require('fs');
const child_process = require('child_process');
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  const path = '/tmp/edit.srt';
  await fs.writeFile(path, '1\n00:00:00,000 --> 00:00:02,000\nhello\n');
  child_process.spawn = (_cmd: string, args: string[]) => ({
    on: (ev: string, cb: () => void) => {
      if (ev === 'exit') {
        fsSync.writeFileSync(args[0], 'edited');
        cb();
      }
    }
  });
  core.invoke = async () => {};
  events.listen = async () => () => {};
  process.env.EDITOR = 'vi';
  process.argv = ['node', 'cli.ts', 'edit-srt', path];
  await import("../src/cli");
  await new Promise(r => setTimeout(r, 10));
  const data = await fs.readFile(path, 'utf-8');
  assert.strictEqual(data, 'edited');
  console.log('cli edit-srt test passed');
})();
