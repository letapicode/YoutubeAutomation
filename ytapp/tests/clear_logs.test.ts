import assert from 'assert';
import fs from 'fs/promises';
const core = require('@tauri-apps/api/core');

(async () => {
  const file = '/tmp/ytapp.log';
  await fs.writeFile(file, 'data');
  core.invoke = async (cmd: string) => {
    if (cmd === 'clear_logs') await fs.unlink(file);
  };
  const { clearLogs } = await import('../src/features/logs');
  await clearLogs();
  try {
    await fs.access(file);
    assert.fail('log still exists');
  } catch {
    // expected
  }
  console.log('clear logs feature test passed');
})();
