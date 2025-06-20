import assert from 'assert';
const core = require('@tauri-apps/api/core');
const events = require('@tauri-apps/api/event');

(async () => {
  core.invoke = async (cmd: string) => {
    assert.strictEqual(cmd, 'list_playlists');
    return [{ id: 'p1', title: 'Playlist One' }];
  };
  events.listen = async () => () => {};
  const logs: string[] = [];
  console.log = (msg: string) => { logs.push(msg); };
  process.argv = ['node', 'cli.ts', 'list-playlists'];
  await import('../src/cli');
  assert.ok(logs.some(l => l.includes('Playlist One')));
  console.log('cli list-playlists test passed');
})();
