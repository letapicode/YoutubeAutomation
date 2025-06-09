import React from 'react';
import { generateUpload } from '../features/youtube';
import type { GenerateParams } from '../features/processing';

interface Props {
  params: GenerateParams;
  onComplete?: (result: string) => void;
}

const GenerateUploadButton: React.FC<Props> = ({ params, onComplete }) => {
  const handleClick = async () => {
    const res = await generateUpload(params);
    if (onComplete) {
      onComplete(res);
    }
  };

  return <button onClick={handleClick}>Generate &amp; Upload</button>;
};

export default GenerateUploadButton;

