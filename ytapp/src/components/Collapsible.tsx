import React, { useState } from 'react';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="collapsible">
            <button className="collapsible-toggle" onClick={() => setOpen(!open)}>
                {title}
            </button>
            {open && <div className="collapsible-body">{children}</div>}
        </div>
    );
};

export default Collapsible;
