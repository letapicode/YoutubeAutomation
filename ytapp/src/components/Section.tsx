import React from 'react';

interface SectionProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, actions, className, children }) => (
    <section className={['section', className].filter(Boolean).join(' ')}>
        <header className="section__header">
            <div>
                <h2>{title}</h2>
                {description && <p className="section__description">{description}</p>}
            </div>
            {actions && <div className="section__actions">{actions}</div>}
        </header>
        <div className="section__body">
            {children}
        </div>
    </section>
);

export default Section;
