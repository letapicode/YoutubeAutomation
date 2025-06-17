import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  let q: any[] = [];
  let paused = false;
  core.invoke = async (cmd: string, args: any) => {
    if (cmd === 'queue_add') { q.push({ job: args.job, status: 'pending', retries: 0 }); return; }
    if (cmd === 'queue_list') { return q; }
    if (cmd === 'queue_process') { if (!paused) q = []; return; }
    if (cmd === 'queue_pause') { paused = true; return; }
    if (cmd === 'queue_resume') { paused = false; return; }
  };
  const { addJob, listJobs, runQueue, pauseQueue, resumeQueue } = await import('../src/features/queue');
  await addJob({ Generate: { params: { file: 'a.mp3' }, dest: 'a.mp4' } } as any);
  let jobs = await listJobs();
  assert.strictEqual(jobs.length, 1);
  await runQueue();
  jobs = await listJobs();
  assert.strictEqual(jobs.length, 0);

  await addJob({ Generate: { params: { file: 'b.mp3' }, dest: 'b.mp4' } } as any);
  await pauseQueue();
  await runQueue();
  jobs = await listJobs();
  assert.strictEqual(jobs.length, 1);
  await resumeQueue();
  await runQueue();
  jobs = await listJobs();
  assert.strictEqual(jobs.length, 0);

  console.log('queue tests passed');
})();
