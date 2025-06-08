import React, { useState } from 'react';
import { generateVideo } from './features/processing';

const App: React.FC = () => {
    const [audio, setAudio] = useState('');
    const [background, setBackground] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [captions, setCaptions] = useState('');
    const [captionFont, setCaptionFont] = useState('');
    const [captionSize, setCaptionSize] = useState(24);
    const [captionPosition, setCaptionPosition] = useState('bottom');
    const [status, setStatus] = useState('');

    const handleGenerate = async () => {
        if (!audio) return;
        setStatus('Generating...');
        try {
            const result = await generateVideo(audio, {
                background,
                intro,
                outro,
                captions,
                captionFont,
                captionSize,
                captionPosition,
            });
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
            <div>
                <input
                    type="text"
                    placeholder="Intro video/image"
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Outro video/image"
                    value={outro}
                    onChange={(e) => setOutro(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Captions .srt file"
                    value={captions}
                    onChange={(e) => setCaptions(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Caption font"
                    value={captionFont}
                    onChange={(e) => setCaptionFont(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="number"
                    placeholder="Caption size"
                    value={captionSize}
                    onChange={(e) => setCaptionSize(parseInt(e.target.value))}
                />
            </div>
            <div>
                <select value={captionPosition} onChange={(e) => setCaptionPosition(e.target.value)}>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                </select>
            </div>
            <button onClick={handleGenerate}>Generate Video</button>
            <p>{status}</p>
        </div>
    );
};

export default App;
