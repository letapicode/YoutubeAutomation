import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signIn, isSignedIn } from '../features/youtube';

const YouTubeAuthButton: React.FC = () => {
  const { t } = useTranslation();
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        setSignedIn(await isSignedIn());
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  const handleClick = async () => {
    if (signedIn) return;
    await signIn();
    setSignedIn(true);
  };

  if (loading) return <button disabled>{t('checking')}</button>;
  return (
    <button onClick={handleClick} disabled={signedIn}>
      {signedIn ? t('signed_in') : t('sign_in')}
    </button>
  );
};

export default YouTubeAuthButton;
