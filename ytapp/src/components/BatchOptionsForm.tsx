import React from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import FontSelector from './FontSelector';
import SizeSlider from './SizeSlider';
import { BatchOptions } from '../features/batch';

interface BatchOptionsFormProps {
    value: BatchOptions;
    onChange: (opts: BatchOptions) => void;
}

const BatchOptionsForm: React.FC<BatchOptionsFormProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const update = (opts: Partial<BatchOptions>) => {
        onChange({ ...value, ...opts, captionOptions: { ...value.captionOptions, ...opts.captionOptions } });
    };

    return (
        <div className="grid">
            <div className="row">
                <FilePicker
                    label={t('background')}
                    onSelect={(p) => {
                        if (typeof p === 'string') update({ background: p });
                        else if (Array.isArray(p) && p.length) update({ background: p[0] });
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {value.background && <span>{value.background}</span>}
            </div>
            <div className="row">
                <FilePicker
                    label={t('intro')}
                    onSelect={(p) => {
                        if (typeof p === 'string') update({ intro: p });
                        else if (Array.isArray(p) && p.length) update({ intro: p[0] });
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {value.intro && <span>{value.intro}</span>}
            </div>
            <div className="row">
                <FilePicker
                    label={t('outro')}
                    onSelect={(p) => {
                        if (typeof p === 'string') update({ outro: p });
                        else if (Array.isArray(p) && p.length) update({ outro: p[0] });
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {value.outro && <span>{value.outro}</span>}
            </div>
            <div className="row">
                <FontSelector value={value.captionOptions?.font || ''} onChange={(f) => update({ captionOptions: { font: f } })} />
            </div>
            <div className="row">
                <SizeSlider value={value.captionOptions?.size || 24} onChange={(s) => update({ captionOptions: { size: s } })} />
                <span>{value.captionOptions?.size || 24}</span>
            </div>
            <div className="row">
                <select value={value.captionOptions?.position || 'bottom'} onChange={(e) => update({ captionOptions: { position: e.target.value } })}>
                    <option value="top">{t('top')}</option>
                    <option value="center">{t('center')}</option>
                    <option value="bottom">{t('bottom')}</option>
                </select>
            </div>
            <div className="row">
                <label>{t('resolution')}</label>
                <select
                    value={`${value.width || 1280}x${value.height || 720}`}
                    onChange={e => {
                        const [w, h] = e.target.value.split('x').map(v => parseInt(v, 10));
                        update({ width: w, height: h });
                    }}
                >
                    <option value="640x360">640x360</option>
                    <option value="1280x720">1280x720</option>
                    <option value="1920x1080">1920x1080</option>
                </select>
            </div>
        </div>
    );
};

export default BatchOptionsForm;
