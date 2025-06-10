// First-run guide shown on application startup.
import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface OnboardingModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Displays a short guide explaining basic usage on first launch.
 */
const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
    const { t } = useTranslation();
    return (
        <Modal open={open} onClose={onClose}>
            <h2>{t('welcome_title')}</h2>
            <ol>
                <li>{t('guide_select_audio')}</li>
                <li>{t('guide_generate')}</li>
                <li>{t('guide_upload')}</li>
            </ol>
            <button onClick={onClose}>{t('done')}</button>
        </Modal>
    );
};

export default OnboardingModal;
