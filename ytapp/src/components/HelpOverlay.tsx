import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface HelpOverlayProps {
  open: boolean;
  page?: string;
  onClose: () => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ open, page, onClose }) => {
  const { t } = useTranslation('help');
  if (!open) return null;
  const titleKey = page ? `${page}.title` : 'title';
  const linesKey = page ? `${page}.lines` : 'lines';
  const lines: string[] = t(linesKey, { returnObjects: true }) as any;
  return (
    <Modal open={open} onClose={onClose}>
      <h2>{t(titleKey)}</h2>
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
