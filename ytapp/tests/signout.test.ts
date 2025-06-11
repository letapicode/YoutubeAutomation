import assert from 'assert';
import fs from 'fs/promises';
import { signOut } from '../src/features/youtube';
const core = require('@tauri-apps/api/core');

(async () => {
  const path = '/tmp/youtube_tokens.enc';
  await fs.writeFile(path, 'x');
  core.invoke = async (cmd: string) => {
    assert.strictEqual(cmd, 'youtube_sign_out');
    await fs.unlink(path);
  };
  await signOut();
  try {
    await fs.stat(path);
    assert.fail('token file still exists');
  } catch {
    // expected
  }
  console.log('sign-out tests passed');
})();
