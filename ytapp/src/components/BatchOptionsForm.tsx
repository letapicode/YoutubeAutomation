// Form used by BatchProcessor to collect options for each generated video.
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
        <div className="options-form">
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
                    label={t('watermark')}
                    onSelect={(p) => {
                        if (typeof p === 'string') update({ watermark: p });
                        else if (Array.isArray(p) && p.length) update({ watermark: p[0] });
                    }}
                    filters={[{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }]}
                />
                {value.watermark && <span>{value.watermark}</span>}
            </div>
            <div className="row">
                <label>{t('watermark_position')}</label>
                <select value={value.watermarkPosition || 'top-right'} onChange={e => update({ watermarkPosition: e.target.value as any })}>
                    <option value="top-left">{t('top_left')}</option>
                    <option value="top-right">{t('top_right')}</option>
                    <option value="bottom-left">{t('bottom_left')}</option>
                    <option value="bottom-right">{t('bottom_right')}</option>
                </select>
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
                <FontSelector
                    value={value.captionOptions?.font ? {
                        name: value.captionOptions?.font || '',
                        path: value.captionOptions?.fontPath,
                        style: value.captionOptions?.style,
                    } : null}
                    onChange={(f) => update({ captionOptions: { font: f?.name, fontPath: f?.path, style: f?.style } })}
                />
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
                    <option value="720x1280">720x1280</option>
                    <option value="1080x1920">1080x1920</option>
                </select>
            </div>
            <div className="row">
                <FilePicker
                    label={t('thumbnail')}
                    onSelect={(p) => {
                        if (typeof p === 'string') update({ thumbnail: p });
                        else if (Array.isArray(p) && p.length) update({ thumbnail: p[0] });
                    }}
                    filters={[{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }]}
                />
                {value.thumbnail && <span>{value.thumbnail}</span>}
            </div>
        </div>
    );
};

export default BatchOptionsForm;
