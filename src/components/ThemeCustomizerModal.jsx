import React, { useState, useContext } from 'react';
import { 
    ThemeContext, 
    EVENT_THEME_PRESETS, 
    VIDEO_PRESETS, 
    IMAGE_PRESETS, 
    GRADIENT_PRESETS 
} from '../context/ThemeContext';
import { 
    FaPalette, 
    FaVideo, 
    FaImage, 
    FaMagic, 
    FaSlidersH, 
    FaTimes, 
    FaCheck, 
    FaUndo, 
    FaLink, 
    FaPlay, 
    FaLaptopCode, 
    FaMusic, 
    FaPaintBrush, 
    FaRunning, 
    FaBriefcase, 
    FaGlassCheers,
    FaYoutube,
    FaFacebook,
    FaCalendarAlt
} from 'react-icons/fa';

const categoryIconMap = {
    Tech: <FaLaptopCode />,
    Music: <FaMusic />,
    Art: <FaPaintBrush />,
    Sports: <FaRunning />,
    Conference: <FaBriefcase />,
    Party: <FaGlassCheers />
};

const ThemeCustomizerModal = () => {
    const { 
        themeConfig, 
        activeEvent,
        setActiveEvent,
        isCustomizerOpen, 
        setIsCustomizerOpen, 
        setVideoBackground, 
        setImageBackground, 
        setGradientBackground, 
        applyEventCategoryPreset, 
        setOverlayOpacity, 
        setBlur, 
        setAccentTheme, 
        resetToDefault 
    } = useContext(ThemeContext);

    // Active tab in modal: 'events' | 'video' | 'image' | 'gradient' | 'adjust'
    const [activeTab, setActiveTab] = useState('events');

    // Input states for custom URLs
    const [customVideoUrl, setCustomVideoUrl] = useState('');
    const [customImageUrl, setCustomImageUrl] = useState('');
    const [urlFeedback, setUrlFeedback] = useState('');

    // Target scope: 'all' (entire site) or 'event' (only active event)
    const [applyScope, setApplyScope] = useState(activeEvent ? 'event' : 'all');

    if (!isCustomizerOpen) return null;

    const targetEventId = applyScope === 'event' && activeEvent ? activeEvent._id : null;

    const handleApplyCustomVideo = (e) => {
        if (e) e.preventDefault();
        const trimmed = customVideoUrl.trim();
        if (!trimmed) {
            setUrlFeedback('Please enter a valid video link (YouTube, Facebook, or direct MP4).');
            return;
        }

        let label = 'Custom Video Link';
        if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) label = 'YouTube Background Video';
        else if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) label = 'Facebook Background Video';

        setVideoBackground(trimmed, label, themeConfig.accent, targetEventId);
        setUrlFeedback(`Video background successfully applied${targetEventId ? ' to this event' : ' globally'}!`);
        setTimeout(() => setUrlFeedback(''), 3500);
    };

    const handleApplyCustomImage = (e) => {
        if (e) e.preventDefault();
        const trimmed = customImageUrl.trim();
        if (!trimmed) {
            setUrlFeedback('Please enter a valid image URL.');
            return;
        }
        setImageBackground(trimmed, 'Custom Wallpaper', themeConfig.accent, targetEventId);
        setUrlFeedback(`Custom wallpaper successfully applied${targetEventId ? ' to this event' : ' globally'}!`);
        setTimeout(() => setUrlFeedback(''), 3500);
    };

    const accentOptions = [
        { id: 'indigo', name: 'Indigo Aura', color: 'bg-indigo-500' },
        { id: 'cyan', name: 'Cyber Cyan', color: 'bg-cyan-400' },
        { id: 'purple', name: 'Neon Purple', color: 'bg-purple-500' },
        { id: 'emerald', name: 'Matrix Emerald', color: 'bg-emerald-400' },
        { id: 'amber', name: 'Solar Amber', color: 'bg-amber-400' },
        { id: 'rose', name: 'Velvet Rose', color: 'bg-rose-500' }
    ];

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 transition-all animate-in fade-in duration-200"
            onClick={() => {
                setIsCustomizerOpen(false);
                setActiveEvent(null);
            }}
        >
            <div 
                className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* MODAL HEADER */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white shrink-0">
                            <FaPalette size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display tracking-tight flex items-center gap-2">
                                Background & Video Customizer
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                                    LIVE AESTHETIC
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Active: <span className="text-indigo-300 font-semibold">{themeConfig.name}</span> ({themeConfig.type.toUpperCase()})
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setIsCustomizerOpen(false);
                            setActiveEvent(null);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Close Customizer"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* TARGET SCOPE SELECTOR IF AN EVENT IS ACTIVE */}
                {activeEvent && (
                    <div className="bg-indigo-950/40 border-b border-indigo-900/50 px-5 py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-indigo-300 font-semibold truncate max-w-xs sm:max-w-md">
                            <FaCalendarAlt size={12} className="text-indigo-400 shrink-0" />
                            <span>Editing for: <strong className="text-white">{activeEvent.title}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => setApplyScope('event')}
                                className={`px-2.5 py-1 rounded transition ${applyScope === 'event' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                This Event
                            </button>
                            <button
                                type="button"
                                onClick={() => setApplyScope('all')}
                                className={`px-2.5 py-1 rounded transition ${applyScope === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                All Events
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL NAVIGATION TABS */}
                <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/50 p-2 gap-1.5 no-scrollbar shrink-0 text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition shrink-0 ${
                            activeTab === 'events' 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <FaMagic /> Category Themes
                    </button>
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition shrink-0 ${
                            activeTab === 'video' 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <FaVideo /> Video BG & Link
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition shrink-0 ${
                            activeTab === 'image' 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <FaImage /> Image Wallpaper
                    </button>
                    <button
                        onClick={() => setActiveTab('gradient')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition shrink-0 ${
                            activeTab === 'gradient' 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <FaPalette /> Gradients & Accents
                    </button>
                    <button
                        onClick={() => setActiveTab('adjust')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition shrink-0 ${
                            activeTab === 'adjust' 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <FaSlidersH /> Aesthetic Controls
                    </button>
                </div>

                {/* MODAL BODY (SCROLLABLE) */}
                <div className="p-5 overflow-y-auto space-y-6 flex-grow">

                    {/* Feedback message banner if custom URL applied */}
                    {urlFeedback && (
                        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
                            <FaCheck className="text-emerald-400 shrink-0" />
                            {urlFeedback}
                        </div>
                    )}

                    {/* TAB 1: EVENT THEME PRESETS */}
                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1">Event Category Presets</h3>
                                <p className="text-xs text-slate-400">
                                    Click any event style to transform the background, video aura, and ambient lighting to match that event!
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.keys(EVENT_THEME_PRESETS).map((catKey) => {
                                    const preset = EVENT_THEME_PRESETS[catKey];
                                    const isSelected = themeConfig.eventCategory === catKey || themeConfig.name === preset.name;
                                    return (
                                        <div 
                                            key={preset.id}
                                            onClick={() => applyEventCategoryPreset(catKey, targetEventId)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                                                isSelected 
                                                    ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500' 
                                                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-indigo-400 text-sm">
                                                        {categoryIconMap[catKey] || <FaMagic />}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 transition">
                                                            {preset.name}
                                                        </h4>
                                                        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                                                            {catKey} • {preset.type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                                                        <FaCheck />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 line-clamp-2">
                                                {preset.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: VIDEO BACKGROUNDS & CUSTOM VIDEO LINK */}
                    {activeTab === 'video' && (
                        <div className="space-y-6">
                            {/* CUSTOM VIDEO LINK ENTER FORM */}
                            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <FaLink className="text-indigo-400 text-sm" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                                        Enter Any Video Link
                                    </h3>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                        <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/40 font-mono">
                                            <FaYoutube /> YouTube
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40 font-mono">
                                            <FaFacebook /> Facebook
                                        </span>
                                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40 font-mono">
                                            Direct MP4 / CDN
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-3">
                                    Paste any YouTube video link (e.g. <code>https://youtube.com/watch?v=...</code>), Facebook video URL (e.g. <code>https://fb.watch/...</code>), or any direct video link (<code>.mp4</code>, <code>.webm</code>). Press Enter or click Apply to set as live background!
                                </p>

                                <form onSubmit={handleApplyCustomVideo} className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                        type="url"
                                        placeholder="https://youtube.com/watch?v=... OR https://fb.watch/... OR https://...video.mp4"
                                        value={customVideoUrl}
                                        onChange={(e) => setCustomVideoUrl(e.target.value)}
                                        className="flex-grow bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition font-mono"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
                                    >
                                        <FaPlay size={10} /> Apply Video
                                    </button>
                                </form>

                                {/* Quick Test Sample Buttons */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex-wrap">
                                    <span className="font-semibold text-slate-500">Working Test Samples:</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31911-large.mp4';
                                            setCustomVideoUrl(url);
                                            setVideoBackground(url, 'Cyber Matrix Code', 'cyan', targetEventId);
                                        }}
                                        className="text-indigo-400 hover:text-white underline cursor-pointer"
                                    >
                                        Matrix Code (MP4)
                                    </button>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = 'https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-41717-large.mp4';
                                            setCustomVideoUrl(url);
                                            setVideoBackground(url, 'Neon EDM Concert', 'purple', targetEventId);
                                        }}
                                        className="text-indigo-400 hover:text-white underline cursor-pointer"
                                    >
                                        EDM Concert (MP4)
                                    </button>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = 'https://www.youtube.com/watch?v=5qap5aO4i9A';
                                            setCustomVideoUrl(url);
                                            setVideoBackground(url, 'Neo City Ambient Loop', 'cyan', targetEventId);
                                        }}
                                        className="text-red-400 hover:text-white underline cursor-pointer"
                                    >
                                        YouTube Cyber Loop
                                    </button>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-lights-in-motion-32771-large.mp4';
                                            setCustomVideoUrl(url);
                                            setVideoBackground(url, 'Hyperdrive Tunnel', 'indigo', targetEventId);
                                        }}
                                        className="text-indigo-400 hover:text-white underline cursor-pointer"
                                    >
                                        Lights Tunnel
                                    </button>
                                </div>
                            </div>

                            {/* CURATED VIDEO PRESETS LIST */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                                    Curated HD Video Presets
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {VIDEO_PRESETS.map((vid) => {
                                        const isSelected = themeConfig.type === 'video' && themeConfig.source === vid.source;
                                        return (
                                            <div
                                                key={vid.id}
                                                onClick={() => setVideoBackground(vid.source, vid.name, themeConfig.accent, targetEventId)}
                                                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center text-xs">
                                                        <FaVideo />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">{vid.name}</h4>
                                                        <span className="text-[10px] text-slate-400">{vid.category} • {vid.tag}</span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                                                        <FaCheck />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: IMAGE BACKGROUNDS & CUSTOM IMAGE LINK */}
                    {activeTab === 'image' && (
                        <div className="space-y-6">
                            {/* CUSTOM IMAGE LINK ENTER FORM */}
                            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaLink className="text-indigo-400 text-sm" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                                        Enter Any Custom Image URL
                                    </h3>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-3">
                                    Paste any image URL from Unsplash, Imgur, or direct CDN. Press Enter or click Apply to set as your event/site background!
                                </p>

                                <form onSubmit={handleApplyCustomImage} className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                        type="url"
                                        placeholder="https://images.unsplash.com/photo-..."
                                        value={customImageUrl}
                                        onChange={(e) => setCustomImageUrl(e.target.value)}
                                        className="flex-grow bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition font-mono"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
                                    >
                                        <FaImage size={11} /> Apply Image
                                    </button>
                                </form>
                            </div>

                            {/* CURATED IMAGE PRESETS GRID */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                                    Curated HD Wallpaper Presets
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {IMAGE_PRESETS.map((img) => {
                                        const isSelected = themeConfig.type === 'image' && themeConfig.source === img.source;
                                        return (
                                            <div
                                                key={img.id}
                                                onClick={() => setImageBackground(img.source, img.name, themeConfig.accent, targetEventId)}
                                                className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition aspect-video ${
                                                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-lg' : 'border-slate-800 hover:border-slate-600'
                                                }`}
                                            >
                                                <img 
                                                    src={img.source} 
                                                    alt={img.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 flex flex-col justify-end">
                                                    <span className="text-[10px] font-bold text-white truncate">{img.name}</span>
                                                    <span className="text-[8px] text-slate-400">{img.category}</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] shadow">
                                                        <FaCheck />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: GRADIENTS & ACCENT COLORS */}
                    {activeTab === 'gradient' && (
                        <div className="space-y-6">
                            {/* GRADIENT PRESETS */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                                    Atmospheric Ambient Gradients
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {GRADIENT_PRESETS.map((grad) => {
                                        const isSelected = themeConfig.type === 'gradient' && themeConfig.source === grad.gradient;
                                        return (
                                            <div
                                                key={grad.id}
                                                onClick={() => setGradientBackground(grad.gradient, grad.name, grad.accent, targetEventId)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                                                    isSelected
                                                        ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-md'
                                                        : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                                style={{ background: grad.gradient }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs text-white">
                                                        <FaPalette />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white">{grad.name}</h4>
                                                        <span className="text-[10px] text-slate-300 capitalize">Accent: {grad.accent}</span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px]">
                                                        <FaCheck />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: AESTHETIC CONTROLS (OPACITY, BLUR, ACCENTS) */}
                    {activeTab === 'adjust' && (
                        <div className="space-y-6">
                            {/* ACCENT COLOR SELECTOR */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                    Cyber Ambient Accent Orb Color
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {accentOptions.map(acc => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => setAccentTheme(acc.id)}
                                            className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 cursor-pointer ${
                                                themeConfig.accent === acc.id
                                                    ? 'bg-slate-800 border-indigo-400 ring-1 ring-indigo-400'
                                                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <span className={`w-6 h-6 rounded-full ${acc.color} shadow-lg`}></span>
                                            <span className="text-[10px] font-bold text-slate-300">{acc.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* OPACITY SLIDER */}
                            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-white">Dark Dimmer Overlay Darkness</span>
                                    <span className="font-mono text-indigo-400 font-bold">{Math.round((themeConfig.opacity ?? 0.70) * 100)}%</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0.30"
                                    max="0.95"
                                    step="0.05"
                                    value={themeConfig.opacity ?? 0.70}
                                    onChange={(e) => setOverlayOpacity(e.target.value)}
                                    className="w-full accent-indigo-500 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Lighter Media (30%)</span>
                                    <span>High Contrast (95%)</span>
                                </div>
                            </div>

                            {/* BLUR SLIDER */}
                            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-white">Backdrop Blur Intensity</span>
                                    <span className="font-mono text-indigo-400 font-bold">{themeConfig.blur ?? 0}px</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="16"
                                    step="1"
                                    value={themeConfig.blur ?? 0}
                                    onChange={(e) => setBlur(e.target.value)}
                                    className="w-full accent-indigo-500 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Sharp Crisp (0px)</span>
                                    <span>Frosted Glass (16px)</span>
                                </div>
                            </div>

                            {/* RESET BUTTON */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => resetToDefault(targetEventId)}
                                    className="w-full py-3 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <FaUndo size={12} /> Reset to Default Obsidian Background
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* MODAL FOOTER */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center shrink-0 text-xs">
                    <span className="text-slate-400 text-[11px]">
                        Changes are saved instantly in your preferences.
                    </span>
                    <button
                        onClick={() => {
                            setIsCustomizerOpen(false);
                            setActiveEvent(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                        Done &amp; Enjoy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomizerModal;
