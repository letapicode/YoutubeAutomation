import React, { useState } from 'react';
import { generateVideo } from './features/processing';

const App: React.FC = () => {
    const [file, setFile] = useState('');
    const [captions, setCaptions] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [font, setFont] = useState('');
    const [size, setSize] = useState(24);
    const [position, setPosition] = useState('bottom');

    const handleGenerate = async () => {
        if (!file) return;
        await generateVideo({
            file,
            captions: captions || undefined,
            captionOptions: { font: font || undefined, size, position },
            intro: intro || undefined,
            outro: outro || undefined,
        });
    };

    return (
        <div>
            <h1>Youtube Automation</h1>
            <div>
                <input type="text" placeholder="Audio file" value={file} onChange={(e) => setFile(e.target.value)} />
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
            <button onClick={handleGenerate}>Generate</button>
        </div>
    );
};

export default App;
