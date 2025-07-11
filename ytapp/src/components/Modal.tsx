// Generic modal dialog used throughout the UI.
import React from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <button className="close" onClick={onClose} aria-label="Close modal">×</button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
