import React from 'react';
import { generateUpload, GenerateParams } from '../features/youtube';

interface Props {
  params: GenerateParams;
}

const GenerateUploadButton: React.FC<Props> = ({ params }) => {
  const handleClick = async () => {
    await generateUpload(params);
  };
  return <button onClick={handleClick}>Generate &amp; Upload</button>;
};

export default GenerateUploadButton;
