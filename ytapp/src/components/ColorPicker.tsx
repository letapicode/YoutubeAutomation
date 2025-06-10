import React from 'react';
import { useTranslation } from 'react-i18next';

interface ColorPickerProps {
    value: string;
    onChange: (c: string) => void;
    label?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
    const { t } = useTranslation();
    return (
        <label>
            {label || t('color')}
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ marginLeft: '0.5em' }}
            />
        </label>
    );
};

export default ColorPicker;
