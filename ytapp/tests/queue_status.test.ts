import assert from 'assert';
const core = require('@tauri-apps/api/core');

(async () => {
  const q = [
    { job: { Generate: { params: { file: 'a.mp3' }, dest: 'a.mp4' } }, status: 'pending', retries: 0 },
    { job: { Generate: { params: { file: 'b.mp3' }, dest: 'b.mp4' } }, status: 'running', retries: 0 },
    { job: { Generate: { params: { file: 'c.mp3' }, dest: 'c.mp4' } }, status: 'failed', retries: 1 },
    { job: { Generate: { params: { file: 'd.mp3' }, dest: 'd.mp4' } }, status: 'completed', retries: 0 }
  ];
  core.invoke = async (cmd: string) => {
    if (cmd === 'queue_list') return q;
  };
  const { getQueueSummary } = await import('../src/features/queue');
  const summary = await getQueueSummary();
  assert.deepStrictEqual(summary, { pending: 1, running: 1, failed: 1, completed: 1 });
  console.log('queue status tests passed');
})();
