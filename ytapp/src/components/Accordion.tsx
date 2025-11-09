import React, { useState } from 'react';

interface AccordionProps {
    title: string;
    defaultOpen?: boolean;
    summary?: string;
    children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, defaultOpen, summary, children }) => {
    const [open, setOpen] = useState(Boolean(defaultOpen));

    return (
        <div className={['accordion', open ? 'accordion--open' : ''].join(' ')}>
            <button
                type="button"
                className="accordion__toggle"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                <span>{title}</span>
                {summary && <span className="accordion__summary">{summary}</span>}
                <span className="accordion__chevron" aria-hidden="true" />
            </button>
            {open && (
                <div className="accordion__panel">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;
