import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'profile_list') return ['a'];
    if (cmd === 'profile_get') { assert.strictEqual(args.name, 'a'); return { background: 'b' }; }
    if (cmd === 'profile_save') { assert.strictEqual(args.name, 'b'); assert.deepStrictEqual(args.profile, { background: 'x' }); return; }
    if (cmd === 'profile_delete') { assert.strictEqual(args.name, 'b'); return; }
  };
  const { listProfiles, getProfile, saveProfile, deleteProfile } = await import('../src/features/profiles');
  const names = await listProfiles();
  assert.deepStrictEqual(names, ['a']);
  const prof = await getProfile('a');
  assert.strictEqual(prof.background, 'b');
  await saveProfile('b', { background: 'x' } as any);
  await deleteProfile('b');
  console.log('profile feature tests passed');
})();
