import React, { useState } from 'react';
import { generateVideo } from './features/processing';
import FilePicker from './components/FilePicker';
import YouTubeAuthButton from './components/YouTubeAuthButton';
import GenerateUploadButton from './components/GenerateUploadButton';
import { generateUpload } from './features/youtube';
import { languageOptions, Language } from './features/language';

const App: React.FC = () => {
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
                <input type="text" placeholder="Intro video" value={intro} onChange={(e) => setIntro(e.target.value)} />
            </div>
            <div>
                <input type="text" placeholder="Outro video" value={outro} onChange={(e) => setOutro(e.target.value)} />
            </div>
            <div>
                <input type="text" placeholder="Font" value={font} onChange={(e) => setFont(e.target.value)} />
            </div>
            <div>
                <input type="number" placeholder="Font size" value={size} onChange={(e) => setSize(parseInt(e.target.value) || 0)} />
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
            <GenerateUploadButton
                params={{
                    file,
                    captions: captions || undefined,
                    captionOptions: { font: font || undefined, size, position },
                    background: background || undefined,
                    intro: intro || undefined,
                    outro: outro || undefined,
                }}
                onComplete={() => {}}
            />
        </div>
    );
};

export default App;
