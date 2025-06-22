import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  let q: any[] = [
    { job: { Generate: { params: { file: 'a.mp3' }, dest: 'a.mp4' } }, status: 'failed', retries: 1 },
    { job: { Generate: { params: { file: 'b.mp3' }, dest: 'b.mp4' } }, status: 'pending', retries: 0 }
  ];
  core.invoke = async (cmd: string) => {
    if (cmd === 'queue_clear_failed') { q = q.filter(i => i.status !== 'failed'); return; }
    if (cmd === 'queue_list') { return q; }
  };
  const { clearFailed, listJobs } = await import('../src/features/queue');
  await clearFailed();
  const jobs = await listJobs();
  assert.strictEqual(jobs.length, 1);
  const dest = (jobs[0].job as any).Generate.dest;
  assert.strictEqual(dest, 'b.mp4');
  console.log('queue clearFailed tests passed');
})();
