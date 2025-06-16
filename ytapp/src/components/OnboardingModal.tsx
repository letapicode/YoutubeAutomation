// First-run guide shown on application startup.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface OnboardingModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Displays a short guide explaining basic usage on first launch.
 */
const steps = ['guide_select_audio', 'guide_generate', 'guide_upload'];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);

    const next = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else onClose();
    };
    const prev = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <h2>{t('welcome_title')}</h2>
            <p>{t(steps[step])}</p>
            <div className="row">
                {step > 0 && <button onClick={prev}>{t('back')}</button>}
                <button onClick={next}>{step < steps.length - 1 ? t('next') : t('done')}</button>
            </div>
        </Modal>
    );
};

export default OnboardingModal;
