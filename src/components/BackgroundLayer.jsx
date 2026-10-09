import React, { useContext, useState, useMemo } from 'react';
import { ThemeContext, EVENT_THEME_PRESETS } from '../context/ThemeContext';

export const getEmbedInfo = (url) => {
    if (!url) return { isEmbed: false, embedUrl: '' };
    
    // YouTube detection
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
        const id = ytMatch[1];
        return {
            isEmbed: true,
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&playsinline=1`
        };
    }

    // Vimeo detection
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
        return {
            isEmbed: true,
            type: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1&background=1`
        };
    }

    return { isEmbed: false, embedUrl: url };
};

const BackgroundLayer = () => {
    const { themeConfig } = useContext(ThemeContext);
    const [videoFailed, setVideoFailed] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    const embedInfo = useMemo(() => {
        if (themeConfig.type === 'video') {
            return getEmbedInfo(themeConfig.source);
        }
        return { isEmbed: false, embedUrl: '' };
    }, [themeConfig.type, themeConfig.source]);

    // Accent ambient glows
    const accentColorMap = {
        indigo: 'rgba(99, 102, 241, 0.18)',
        cyan: 'rgba(6, 182, 212, 0.18)',
        purple: 'rgba(168, 85, 247, 0.18)',
        emerald: 'rgba(16, 185, 129, 0.18)',
        amber: 'rgba(245, 158, 11, 0.18)',
        rose: 'rgba(244, 63, 94, 0.18)'
    };
    const currentAccentGlow = accentColorMap[themeConfig.accent] || accentColorMap.indigo;

    return (
        <div 
            className="fixed inset-0 -z-20 pointer-events-none overflow-hidden select-none"
            aria-hidden="true"
        >
            {/* 1. MEDIA LAYER (Video, Image, Gradient, or Default) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {/* VIDEO BACKGROUND */}
                {themeConfig.type === 'video' && !videoFailed && (
                    embedInfo.isEmbed ? (
                        <div className="relative w-full h-full pointer-events-none scale-125 overflow-hidden">
                            <iframe
                                src={embedInfo.embedUrl}
                                title="Custom Background Video"
                                className="w-full h-full pointer-events-none border-0"
                                allow="autoplay; encrypted-media"
                                tabIndex="-1"
                            />
                        </div>
                    ) : (
                        <video
                            key={themeConfig.source}
                            autoPlay
                            loop
                            muted
                            playsInline
                            onError={() => setVideoFailed(true)}
                            className="w-full h-full object-cover transition-opacity duration-1000"
                        >
                            <source src={themeConfig.source} type="video/mp4" />
                            <source src={themeConfig.source} type="video/webm" />
                        </video>
                    )
                )}

                {/* VIDEO FALLBACK IF FAILED */}
                {themeConfig.type === 'video' && videoFailed && (
                    <div 
                        className="w-full h-full bg-cover bg-center transition-opacity duration-700"
                        style={{
                            backgroundImage: `url(${
                                EVENT_THEME_PRESETS[themeConfig.eventCategory]?.fallbackImage || 
                                'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1600'
                            })`
                        }}
                    />
                )}

                {/* IMAGE BACKGROUND */}
                {themeConfig.type === 'image' && !imageFailed && (
                    <div 
                        className="w-full h-full bg-cover bg-center transition-all duration-1000 scale-105"
                        style={{ backgroundImage: `url(${themeConfig.source})` }}
                        onError={() => setImageFailed(true)}
                    />
                )}

                {/* IMAGE FALLBACK IF FAILED */}
                {themeConfig.type === 'image' && imageFailed && (
                    <div 
                        className="w-full h-full"
                        style={{
                            background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0f19 70%, #030712 100%)'
                        }}
                    />
                )}

                {/* GRADIENT BACKGROUND */}
                {themeConfig.type === 'gradient' && (
                    <div 
                        className="w-full h-full transition-all duration-1000"
                        style={{ background: themeConfig.source }}
                    />
                )}

                {/* DEFAULT FALLBACK OBSIDIAN */}
                {themeConfig.type === 'default' && (
                    <div 
                        className="w-full h-full"
                        style={{
                            background: 'radial-gradient(ellipse at 50% 0%, #151c33 0%, #0b0f19 55%, #05070e 100%)'
                        }}
                    />
                )}
            </div>

            {/* 2. DYNAMIC DARK DIMMER OVERLAY WITH BACKDROP BLUR */}
            <div 
                className="absolute inset-0 w-full h-full transition-all duration-500"
                style={{
                    backgroundColor: `rgba(11, 15, 25, ${themeConfig.opacity !== undefined ? themeConfig.opacity : 0.70})`,
                    backdropFilter: themeConfig.blur ? `blur(${themeConfig.blur}px)` : 'none',
                    WebkitBackdropFilter: themeConfig.blur ? `blur(${themeConfig.blur}px)` : 'none'
                }}
            />

            {/* 3. AMBIENT SCI-FI GLOW ACCENT ORBS */}
            <div 
                className="absolute -top-40 -left-40 w-96 h-96 rounded-full transition-all duration-1000 pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${currentAccentGlow} 0%, rgba(0,0,0,0) 70%)`,
                    filter: 'blur(50px)'
                }}
            />
            <div 
                className="absolute top-1/3 -right-40 w-96 h-96 rounded-full transition-all duration-1000 pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${currentAccentGlow} 0%, rgba(0,0,0,0) 70%)`,
                    filter: 'blur(60px)'
                }}
            />
        </div>
    );
};

export default BackgroundLayer;
