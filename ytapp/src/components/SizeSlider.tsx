import React from 'react';

interface SizeSliderProps {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
}

const SizeSlider: React.FC<SizeSliderProps> = ({ value, onChange, min = 12, max = 72 }) => (
    <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
    />
);

export default SizeSlider;
