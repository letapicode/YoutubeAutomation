import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listJobs, runQueue, pauseQueue, resumeQueue, clearCompleted, clearQueue, listenQueue, removeJob, listenProgress, moveJob, QueueProgress } from '../features/queue';

const QueuePage: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const refresh = () => {
    listJobs().then(setJobs);
  };

  useEffect(() => {
    refresh();
    let unlisten: (() => void) | undefined;
    let progUn: (() => void) | undefined;
    listenQueue(refresh).then((u) => {
      unlisten = u;
    });
    listenProgress((p: QueueProgress) => {
      setProgressMap(m => ({ ...m, [p.index]: p.progress }));
    }).then(u => { progUn = u; });
    return () => {
      if (unlisten) unlisten();
      if (progUn) progUn();
    };
  }, []);

  return (
    <div>
      <h2>{t('queue')}</h2>
      <button onClick={() => runQueue().then(refresh)}>{t('process_queue')}</button>
      <button onClick={() => pauseQueue().then(refresh)} aria-label={t('pause')}>
        {t('pause')}
      </button>
      <button onClick={() => resumeQueue().then(refresh)} aria-label={t('resume')}>
        {t('resume')}
      </button>
      <button onClick={() => clearCompleted().then(refresh)}>{t('clear_completed')}</button>
      <button onClick={() => clearQueue().then(refresh)}>{t('clear_all')}</button>
      {jobs.map((j, i) => (
        <div
          key={i}
          className="row"
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== i) {
              moveJob(dragIndex, i).then(refresh);
            }
            setDragIndex(null);
          }}
        >
          <span>{JSON.stringify(j.job)}</span>
          <span>{j.status}</span>
          <span>{j.retries}</span>
          {j.status === 'running' && (
            <progress value={progressMap[i] || 0} max={100} />
          )}
          <button onClick={() => removeJob(i).then(refresh)}>{t('remove')}</button>
        </div>
      ))}
    </div>
  );
};

export default QueuePage;
