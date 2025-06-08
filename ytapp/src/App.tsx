import React, { useState } from 'react';
import { generateVideo } from './features/processing';

const App: React.FC = () => {
    const [audio, setAudio] = useState('');
    const [background, setBackground] = useState('');
    const [status, setStatus] = useState('');

    const handleGenerate = async () => {
        if (!audio) return;
        setStatus('Generating...');
        try {
            const result = await generateVideo(audio, { background });
            setStatus(`Created ${result}`);
        } catch (e) {
            setStatus('Error generating video');
        }
    };

    return (
        <div>
            <h1>YouTube Automation</h1>
            <div>
                <input
                    type="text"
                    placeholder="Audio file path"
                    value={audio}
                    onChange={(e) => setAudio(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Background image/video"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                />
            </div>
            <button onClick={handleGenerate}>Generate Video</button>
            <p>{status}</p>
        </div>
    );
};

export default App;
