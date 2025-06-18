import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'load_settings') return { output: '/tmp/out.mp4' };
    if (cmd === 'save_settings') {
      assert.strictEqual(args.settings.output, '/tmp/out.mp4');
      return;
    }
  };
  const { loadSettings, saveSettings } = await import('../src/features/settings');
  const s = await loadSettings();
  assert.strictEqual(s.output, '/tmp/out.mp4');
  await saveSettings({ output: '/tmp/out.mp4' });
  console.log('settings feature tests passed');
})();
