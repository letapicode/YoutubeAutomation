import React from 'react';

interface ActionBarProps {
    children: React.ReactNode;
}

const ActionBar: React.FC<ActionBarProps> = ({ children }) => (
    <div className="action-bar">
        <div className="action-bar__content">
            {children}
        </div>
    </div>
);

export default ActionBar;
