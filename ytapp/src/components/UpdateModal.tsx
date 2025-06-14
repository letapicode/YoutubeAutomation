import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface UpdateModalProps {
    open: boolean;
    onUpdate: () => void;
    onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ open, onUpdate, onClose }) => {
    const { t } = useTranslation();
    if (!open) return null;
    return (
        <Modal open={open} onClose={onClose}>
            <h2>{t('update_available')}</h2>
            <p>{t('update_prompt')}</p>
            <div className="row">
                <button onClick={onUpdate}>{t('update_now')}</button>
                <button onClick={onClose}>{t('later')}</button>
            </div>
        </Modal>
    );
};

export default UpdateModal;
