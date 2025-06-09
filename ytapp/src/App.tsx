import React, { useState } from 'react';
import { generateVideo } from './features/processing';
import YouTubeAuthButton from './components/YouTubeAuthButton';
import GenerateUploadButton from './components/GenerateUploadButton';
import { GenerateParams } from './features/youtube';
import FilePicker from './components/FilePicker';
import BatchPage from './components/BatchPage';
import FontSelector from './components/FontSelector';
import SizeSlider from './components/SizeSlider';
import { languageOptions, Language } from './features/language';

const App: React.FC = () => {
    const [page, setPage] = useState<'single' | 'batch'>('single');
    const [file, setFile] = useState('');
    const [background, setBackground] = useState('');
    const [captions, setCaptions] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [font, setFont] = useState('');
    const [size, setSize] = useState(24);
    const [position, setPosition] = useState('bottom');
    const [language, setLanguage] = useState<Language>('auto');

    const handleGenerate = async () => {
        if (!file) return;
        await generateVideo({
            file,
            captions: captions || undefined,
            captionOptions: { font: font || undefined, size, position },
            background: background || undefined,
            intro: intro || undefined,
            outro: outro || undefined,
        });
    };

    const buildParams = (): GenerateParams => ({
        file,
        captions: captions || undefined,
        captionOptions: { font: font || undefined, size, position },
        background: background || undefined,
        intro: intro || undefined,
        outro: outro || undefined,
    });

    if (page === 'batch') {
        return (
            <div>
                <button onClick={() => setPage('single')}>Back</button>
                <BatchPage />
            </div>
        );
    }

    return (
        <div>
            <h1>Youtube Automation</h1>
            <div>
                <input type="text" placeholder="Audio file" value={file} onChange={(e) => setFile(e.target.value)} />
                <FilePicker label="Browse" onSelect={(p) => {
                    if (typeof p === 'string') setFile(p);
                    else if (Array.isArray(p) && p.length) setFile(p[0]);
                }} />
            </div>
            <div>
                <input type="text" placeholder="Background" value={background} onChange={(e) => setBackground(e.target.value)} />
                <FilePicker
                    label="Background"
                    onSelect={(p) => {
                        if (typeof p === 'string') setBackground(p);
                        else if (Array.isArray(p) && p.length) setBackground(p[0]);
                    }}
                    filters={[
                        { name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] },
                    ]}
                />
            </div>
            <div>
                <input type="text" placeholder="Captions file" value={captions} onChange={(e) => setCaptions(e.target.value)} />
            </div>
            <div>
                <FilePicker
                    label="Intro"
                    onSelect={(p) => {
                        if (typeof p === 'string') setIntro(p);
                        else if (Array.isArray(p) && p.length) setIntro(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {intro && <span>{intro}</span>}
            </div>
            <div>
                <FilePicker
                    label="Outro"
                    onSelect={(p) => {
                        if (typeof p === 'string') setOutro(p);
                        else if (Array.isArray(p) && p.length) setOutro(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {outro && <span>{outro}</span>}
            </div>
            <div>
                <FontSelector value={font} onChange={setFont} />
            </div>
            <div>
                <SizeSlider value={size} onChange={setSize} />
                <span>{size}</span>
            </div>
            <div>
                <select value={position} onChange={(e) => setPosition(e.target.value)}>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                </select>
            </div>
            <div>
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                    {languageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <YouTubeAuthButton />
            <button onClick={handleGenerate}>Generate</button>
            <GenerateUploadButton params={buildParams()} />
            <button onClick={() => setPage('batch')}>Batch Tools</button>
        </div>
    );
};

export default App;
