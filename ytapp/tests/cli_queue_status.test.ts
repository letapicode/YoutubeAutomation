import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  let invoked = false;
  core.invoke = async (cmd: string) => {
    if (cmd === 'queue_list') invoked = true;
    return [
      { job: {}, status: 'pending', retries: 0 },
      { job: {}, status: 'completed', retries: 0 }
    ];
  };
  events.listen = async () => () => {};
  const logs: string[] = [];
  console.log = (msg: string) => { logs.push(msg); };
  process.argv = ['node', 'cli.ts', 'queue-status'];
  await import('../src/cli');
  assert.ok(invoked);
  assert.ok(logs[0].includes('pending'));
  console.log('cli queue-status test passed');
})();
