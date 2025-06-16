import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listJobs, runQueue, clearCompleted, clearQueue, listenQueue, removeJob } from '../features/queue';

const QueuePage: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);

  const refresh = () => {
    listJobs().then(setJobs);
  };

  useEffect(() => {
    refresh();
    let unlisten: (() => void) | undefined;
    listenQueue(refresh).then((u) => {
      unlisten = u;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <div>
      <h2>{t('queue')}</h2>
      <button onClick={() => runQueue().then(refresh)}>{t('process_queue')}</button>
      <button onClick={() => clearCompleted().then(refresh)}>{t('clear_completed')}</button>
      <button onClick={() => clearQueue().then(refresh)}>{t('clear_all')}</button>
      {jobs.map((j, i) => (
        <div key={i} className="row">
          <span>{JSON.stringify(j.job)}</span>
          <span>{j.status}</span>
          <span>{j.retries}</span>
          <button onClick={() => removeJob(i).then(refresh)}>{t('remove')}</button>
        </div>
      ))}
    </div>
  );
};

export default QueuePage;
