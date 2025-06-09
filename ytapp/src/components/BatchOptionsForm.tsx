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
        <div>
            <div>
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
            <div>
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
            <div>
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
            <div>
                <FontSelector value={value.captionOptions?.font || ''} onChange={(f) => update({ captionOptions: { font: f } })} />
            </div>
            <div>
                <SizeSlider value={value.captionOptions?.size || 24} onChange={(s) => update({ captionOptions: { size: s } })} />
                <span>{value.captionOptions?.size || 24}</span>
            </div>
            <div>
                <select value={value.captionOptions?.position || 'bottom'} onChange={(e) => update({ captionOptions: { position: e.target.value } })}>
                    <option value="top">{t('top')}</option>
                    <option value="center">{t('center')}</option>
                    <option value="bottom">{t('bottom')}</option>
                </select>
            </div>
        </div>
    );
};

export default BatchOptionsForm;
