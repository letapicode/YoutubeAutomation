import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  let q: any[] = [];
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'queue_add') { q.push({ job: args.job, status: 'pending', retries: 0 }); return; }
    if (cmd === 'queue_list') { return q; }
    if (cmd === 'queue_process') { q = []; return; }
  };
  const { addJob, listJobs, runQueue } = await import('../src/features/queue');
  await addJob({ Generate: { params: { file: 'a.mp3' }, dest: 'a.mp4' } } as any);
  let jobs = await listJobs();
  assert.strictEqual(jobs.length, 1);
  await runQueue();
  jobs = await listJobs();
  assert.strictEqual(jobs.length, 0);
  console.log('queue feature tests passed');
})();
