import React from 'react';

interface CaptionPreviewProps {
    font: string;
    size: number;
    color: string;
    background: string;
    position: string;
}

const CaptionPreview: React.FC<CaptionPreviewProps> = ({ font, size, color, background, position }) => {
    const containerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: 80,
        background: '#222',
        marginTop: 8,
    };

    const captionStyle: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: font || 'inherit',
        fontSize: size,
        color,
        backgroundColor: background,
        padding: '2px 4px',
    };

    if (position === 'top') captionStyle.top = 4;
    else if (position === 'center') {
        captionStyle.top = '50%';
        captionStyle.transform = 'translate(-50%, -50%)';
    } else captionStyle.bottom = 4;

    return (
        <div style={containerStyle} aria-hidden="true">
            <div style={captionStyle}>Sample Caption</div>
        </div>
    );
};

export default CaptionPreview;
