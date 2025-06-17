import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ open, onClose }) => {
  const { t } = useTranslation('help');
  if (!open) return null;
  const lines: string[] = t('lines', { returnObjects: true }) as any;
  return (
    <Modal open={open} onClose={onClose}>
      <h2>{t('title')}</h2>
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <button onClick={onClose}>{t('close')}</button>
    </Modal>
  );
};

export default HelpOverlay;
