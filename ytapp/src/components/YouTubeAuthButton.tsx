// Button that handles OAuth sign-in with YouTube.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signIn, signOut, isSignedIn } from '../features/youtube';

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

  const handleSignIn = async () => {
    await signIn();
    setSignedIn(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setSignedIn(false);
  };

  if (loading) return <button disabled>{t('checking')}</button>;
  return signedIn ? (
    <button onClick={handleSignOut}>{t('sign_out')}</button>
  ) : (
    <button onClick={handleSignIn}>{t('sign_in')}</button>
  );
};

export default YouTubeAuthButton;
