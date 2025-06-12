import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listProfiles, getProfile, saveProfile, deleteProfile } from '../features/profiles';
import type { Profile } from '../schema';

interface ProfilesPageProps {
    onLoad: (profile: Profile) => void;
}

const ProfilesPage: React.FC<ProfilesPageProps> = ({ onLoad }) => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState<string[]>([]);
    const [name, setName] = useState('');
    const [profile, setProfile] = useState<Profile>({} as Profile);

    const refresh = () => {
        listProfiles().then(setProfiles).catch(() => setProfiles([]));
    };

    useEffect(() => { refresh(); }, []);

    const handleLoad = async (n: string) => {
        const p = await getProfile(n);
        onLoad(p);
    };

    const handleEdit = async (n: string) => {
        const p = await getProfile(n);
        setName(n);
        setProfile(p);
    };

    const handleDelete = async (n: string) => {
        await deleteProfile(n);
        refresh();
    };

    const handleSave = async () => {
        const p: Profile = { ...profile };
        await saveProfile(name, p);
        setName('');
        setProfile({} as Profile);
        refresh();
    };

    const handleProfileChange = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setProfile(prev => ({ ...prev, [key]: value }));
    };

    const handleNumberChange = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setProfile(prev => ({ ...prev, [key]: val ? parseInt(val, 10) : undefined }));
    };

    const handleCaptionChange = (key: keyof NonNullable<Profile['captionOptions']>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setProfile(prev => ({ ...prev, captionOptions: { ...(prev.captionOptions || {}), [key]: key === 'size' ? (value ? parseInt(value, 10) : undefined) : value } }));
    };

    return (
        <div>
            <h1>{t('profiles')}</h1>
            {profiles.map(p => (
                <div className="row" key={p}>
                    <span>{p}</span>
                    <button onClick={() => handleLoad(p)}>{t('load')}</button>
                    <button onClick={() => handleEdit(p)}>{t('edit')}</button>
                    <button onClick={() => handleDelete(p)}>{t('delete_profile')}</button>
                </div>
            ))}
            <h2>{t('save_profile')}</h2>
            <div className="row">
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="row">
                <input type="text" placeholder="Captions" value={profile.captions || ''} onChange={handleProfileChange('captions')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Background" value={profile.background || ''} onChange={handleProfileChange('background')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Intro" value={profile.intro || ''} onChange={handleProfileChange('intro')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Outro" value={profile.outro || ''} onChange={handleProfileChange('outro')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Watermark" value={profile.watermark || ''} onChange={handleProfileChange('watermark')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Watermark Position" value={profile.watermarkPosition || ''} onChange={handleProfileChange('watermarkPosition')} />
            </div>
            <div className="row">
                <input type="number" placeholder="Width" value={profile.width || ''} onChange={handleNumberChange('width')} />
                <input type="number" placeholder="Height" value={profile.height || ''} onChange={handleNumberChange('height')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Title" value={profile.title || ''} onChange={handleProfileChange('title')} />
            </div>
            <div className="row">
                <textarea placeholder="Description" value={profile.description || ''} onChange={handleProfileChange('description')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Tags" value={(profile.tags || []).join(', ')} onChange={e => setProfile(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} />
            </div>
            <div className="row">
                <input type="datetime-local" value={profile.publishAt || ''} onChange={handleProfileChange('publishAt')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Thumbnail" value={profile.thumbnail || ''} onChange={handleProfileChange('thumbnail')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Font" value={profile.captionOptions?.font || ''} onChange={handleCaptionChange('font')} />
                <input type="text" placeholder="Font Path" value={profile.captionOptions?.fontPath || ''} onChange={handleCaptionChange('fontPath')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Style" value={profile.captionOptions?.style || ''} onChange={handleCaptionChange('style')} />
                <input type="number" placeholder="Size" value={profile.captionOptions?.size || ''} onChange={handleCaptionChange('size')} />
            </div>
            <div className="row">
                <input type="text" placeholder="Position" value={profile.captionOptions?.position || ''} onChange={handleCaptionChange('position')} />
            </div>
            <div className="row">
                <input type="color" value={profile.captionOptions?.color || '#ffffff'} onChange={handleCaptionChange('color')} />
                <input type="color" value={profile.captionOptions?.background || '#000000'} onChange={handleCaptionChange('background')} />
            </div>
            <div className="row">
                <button onClick={handleSave}>{t('save_profile')}</button>
            </div>
        </div>
    );
};

export default ProfilesPage;
