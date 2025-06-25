import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'load_settings') return { output: '/tmp/out.mp4', uiFont: 'Arial', theme: 'dark' };
    if (cmd === 'save_settings') {
      assert.strictEqual(args.settings.output, '/tmp/out.mp4');
      assert.strictEqual(args.settings.uiFont, 'Arial');
      assert.strictEqual(args.settings.theme, 'dark');
      return;
    }
  };
  const { loadSettings, saveSettings } = await import('../src/features/settings');
  const s = await loadSettings();
  assert.strictEqual(s.output, '/tmp/out.mp4');
  assert.strictEqual(s.uiFont, 'Arial');
  assert.strictEqual(s.theme, 'dark');
  await saveSettings({ output: '/tmp/out.mp4', uiFont: 'Arial', theme: 'dark' });
  console.log('settings feature tests passed');
})();
