import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listJobs, runQueue, clearCompleted, clearQueue } from '../features/queue';

const QueuePage: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);

  const refresh = () => {
    listJobs().then(setJobs);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
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
        </div>
      ))}
    </div>
  );
};

export default QueuePage;
