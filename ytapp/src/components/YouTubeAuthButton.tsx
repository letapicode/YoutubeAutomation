import React, { useEffect, useState } from 'react';
import { signIn, isSignedIn } from '../features/youtube';

const YouTubeAuthButton: React.FC = () => {
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

  if (loading) return <button disabled>Checking...</button>;
  return (
    <button onClick={handleClick} disabled={signedIn}>
      {signedIn ? 'Signed in to YouTube' : 'Sign in to YouTube'}
    </button>
  );
};

export default YouTubeAuthButton;
