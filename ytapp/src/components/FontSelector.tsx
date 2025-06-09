import React from 'react';

interface FontSelectorProps {
    value: string;
    onChange: (font: string) => void;
}

const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'];

const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}>
            <option value="">Default</option>
            {fonts.map(f => (
                <option key={f} value={f}>{f}</option>
            ))}
        </select>
    );
};

export default FontSelector;
