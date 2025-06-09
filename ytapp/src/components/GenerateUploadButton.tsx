import React from 'react';
import { useTranslation } from 'react-i18next';
import { generateUpload, GenerateParams } from '../features/youtube';

interface Props {
  params: GenerateParams;
}

const GenerateUploadButton: React.FC<Props> = ({ params }) => {
  const { t } = useTranslation();
  const handleClick = async () => {
    await generateUpload(params);
  };
  return <button onClick={handleClick}>{t('generate_upload')}</button>;
};

export default GenerateUploadButton;
