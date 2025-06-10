import React from 'react';
import { useTranslation } from 'react-i18next';
import { generateUpload, GenerateParams } from '../features/youtube';
import { UploadIcon } from '../icons';

interface Props {
  params: GenerateParams;
}

const GenerateUploadButton: React.FC<Props> = ({ params }) => {
  const { t } = useTranslation();
  const handleClick = async () => {
    await generateUpload(params);
  };
  return (
    <button onClick={handleClick}>
      <UploadIcon /> {t('generate_upload')}
    </button>
  );
};

export default GenerateUploadButton;
