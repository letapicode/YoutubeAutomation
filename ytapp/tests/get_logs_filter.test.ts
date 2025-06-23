import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  core.invoke = async (cmd: string, args: any) => {
    assert.strictEqual(cmd, 'get_logs');
    assert.strictEqual(args.maxLines, 50);
    assert.strictEqual(args.level, 'info');
    assert.strictEqual(args.search, 'foo');
    return 'ok';
  };
  const { getLogs } = await import('../src/features/logs');
  const text = await getLogs(50, 'info', 'foo');
  assert.strictEqual(text, 'ok');
  console.log('get logs filter test passed');
})();
