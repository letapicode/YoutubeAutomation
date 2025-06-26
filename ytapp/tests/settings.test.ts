import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'load_settings') return { output: '/tmp/out.mp4', uiFont: 'Arial', theme: 'dark', language: 'fr', watermarkOpacity: 0.8, watermarkScale: 0.3, defaultWidth: 1920, defaultHeight: 1080 };
    if (cmd === 'save_settings') {
      assert.strictEqual(args.settings.output, '/tmp/out.mp4');
      assert.strictEqual(args.settings.uiFont, 'Arial');
      assert.strictEqual(args.settings.theme, 'dark');
      assert.strictEqual(args.settings.language, 'fr');
      assert.strictEqual(args.settings.watermarkOpacity, 0.8);
      assert.strictEqual(args.settings.watermarkScale, 0.3);
      assert.strictEqual(args.settings.defaultWidth, 1920);
      assert.strictEqual(args.settings.defaultHeight, 1080);
      return;
    }
  };
  const { loadSettings, saveSettings } = await import('../src/features/settings');
  const s = await loadSettings();
  assert.strictEqual(s.output, '/tmp/out.mp4');
  assert.strictEqual(s.uiFont, 'Arial');
  assert.strictEqual(s.theme, 'dark');
  assert.strictEqual(s.language, 'fr');
  assert.strictEqual(s.watermarkOpacity, 0.8);
  assert.strictEqual(s.watermarkScale, 0.3);
  assert.strictEqual(s.defaultWidth, 1920);
  assert.strictEqual(s.defaultHeight, 1080);
  await saveSettings({ output: '/tmp/out.mp4', uiFont: 'Arial', theme: 'dark', language: 'fr', watermarkOpacity: 0.8, watermarkScale: 0.3, defaultWidth: 1920, defaultHeight: 1080 });
  console.log('settings feature tests passed');
})();
