import React, { useEffect, useState } from 'react';
import { youtubeIsSignedIn, youtubeSignIn } from '../features/youtube';

const YouTubeAuthButton: React.FC = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      const status = await youtubeIsSignedIn();
      setSignedIn(status);
    } catch {
      setSignedIn(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleClick = async () => {
    if (signedIn) return;
    try {
      await youtubeSignIn();
      setSignedIn(true);
    } catch {
      setSignedIn(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={signedIn}>
      {signedIn ? 'Signed in to YouTube' : 'Sign in with YouTube'}
    </button>
  );
};

export default YouTubeAuthButton;

