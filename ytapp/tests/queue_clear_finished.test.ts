import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  let q: any[] = [
    { job: { Generate: { params: { file: 'a.mp3' }, dest: 'a.mp4' } }, status: 'completed', retries: 0 },
    { job: { Generate: { params: { file: 'b.mp3' }, dest: 'b.mp4' } }, status: 'failed', retries: 1 },
    { job: { Generate: { params: { file: 'c.mp3' }, dest: 'c.mp4' } }, status: 'pending', retries: 0 }
  ];
  const calls: string[] = [];
  core.invoke = async (cmd: string) => {
    calls.push(cmd);
    if (cmd === 'queue_clear_completed') { q = q.filter(i => i.status !== 'completed'); return; }
    if (cmd === 'queue_clear_failed') { q = q.filter(i => i.status !== 'failed'); return; }
    if (cmd === 'queue_list') { return q; }
  };
  const { clearFinished, listJobs } = await import('../src/features/queue');
  await clearFinished();
  const jobs = await listJobs();
  assert.strictEqual(jobs.length, 1);
  const dest = (jobs[0].job as any).Generate.dest;
  assert.strictEqual(dest, 'c.mp4');
  assert.deepStrictEqual(calls, ['queue_clear_completed', 'queue_clear_failed']);
  console.log('queue clearFinished tests passed');
})();
