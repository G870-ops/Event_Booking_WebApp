import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

// Presets by Event Category
export const EVENT_THEME_PRESETS = {
    Tech: {
        id: 'event-tech',
        name: 'Tech & Cyberpunk Matrix',
        category: 'Tech',
        type: 'video',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31911-large.mp4',
        fallbackImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1600',
        accent: 'cyan',
        description: 'Matrix code stream & high-tech cyan digital vibe',
        opacity: 0.72,
        blur: 0
    },
    Music: {
        id: 'event-music',
        name: 'Neon Concert & Festival Stage',
        category: 'Music',
        type: 'video',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-41717-large.mp4',
        fallbackImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1600',
        accent: 'purple',
        description: 'Vibrant stage lasers & purple electric pulse',
        opacity: 0.70,
        blur: 0
    },
    Art: {
        id: 'event-art',
        name: 'Aesthetic Gallery & Fluid Dream',
        category: 'Art',
        type: 'video',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-43394-large.mp4',
        fallbackImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1600',
        accent: 'rose',
        description: 'Fluid iridescent ink & artistic gallery aesthetic',
        opacity: 0.68,
        blur: 1
    },
    Sports: {
        id: 'event-sports',
        name: 'High Energy Stadium Arena',
        category: 'Sports',
        type: 'image',
        source: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1600',
        accent: 'emerald',
        description: 'Floodlight arena atmosphere with emerald energy',
        opacity: 0.75,
        blur: 0
    },
    Conference: {
        id: 'event-conference',
        name: 'Obsidian Executive Skyline',
        category: 'Conference',
        type: 'image',
        source: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600',
        accent: 'indigo',
        description: 'Modern twilight skyscraper architecture & executive sapphire glow',
        opacity: 0.78,
        blur: 0
    },
    Party: {
        id: 'event-party',
        name: 'Midnight Club Strobe',
        category: 'Party',
        type: 'video',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-silhouette-of-a-crowd-at-a-concert-40156-large.mp4',
        fallbackImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600',
        accent: 'amber',
        description: 'Nightclub silhouette crowd & warm amber euphoria',
        opacity: 0.68,
        blur: 0
    }
};

// Curated Video Presets
export const VIDEO_PRESETS = [
    {
        id: 'vid-matrix',
        name: 'Cyber Digital Matrix',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31911-large.mp4',
        category: 'Tech',
        tag: 'Sci-Fi'
    },
    {
        id: 'vid-concert',
        name: 'EDM Concert Lights',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-41717-large.mp4',
        category: 'Music',
        tag: 'Festival'
    },
    {
        id: 'vid-ink',
        name: 'Ethereal Ink Nebula',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-43394-large.mp4',
        category: 'Art',
        tag: 'Fluid'
    },
    {
        id: 'vid-crowd',
        name: 'Vibrant Night Crowd',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-silhouette-of-a-crowd-at-a-concert-40156-large.mp4',
        category: 'Party',
        tag: 'Euphoria'
    },
    {
        id: 'vid-tunnel',
        name: 'Hyperdrive Tunnel',
        source: 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-lights-in-motion-32771-large.mp4',
        category: 'Tech',
        tag: 'Motion'
    }
];

// Curated Image Presets
export const IMAGE_PRESETS = [
    {
        id: 'img-cybercity',
        name: 'Neo Tokyo Cyberpunk',
        source: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1600',
        category: 'Tech'
    },
    {
        id: 'img-galaxy',
        name: 'Deep Cosmos Nebula',
        source: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=1600',
        category: 'Art'
    },
    {
        id: 'img-stage',
        name: 'Laser Stadium Stage',
        source: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1600',
        category: 'Music'
    },
    {
        id: 'img-architecture',
        name: 'Minimal Dark Glass',
        source: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600',
        category: 'Conference'
    },
    {
        id: 'img-arena',
        name: 'Underground Arena',
        source: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1600',
        category: 'Party'
    }
];

// Curated Gradient Presets
export const GRADIENT_PRESETS = [
    {
        id: 'grad-default',
        name: 'Obsidian Midnight (Default)',
        gradient: 'radial-gradient(ellipse at top, #141b2d 0%, #0b0f19 60%, #050810 100%)',
        accent: 'indigo'
    },
    {
        id: 'grad-cyber',
        name: 'Neon Cyber Blue',
        gradient: 'radial-gradient(ellipse at top right, #093452 0%, #07192f 50%, #030a14 100%)',
        accent: 'cyan'
    },
    {
        id: 'grad-synthwave',
        name: 'Synthwave Sunset',
        gradient: 'radial-gradient(circle at 50% 0%, #3b0764 0%, #1e0538 50%, #0a0114 100%)',
        accent: 'purple'
    },
    {
        id: 'grad-emerald',
        name: 'Matrix Emerald Glow',
        gradient: 'radial-gradient(ellipse at top, #064e3b 0%, #022c22 50%, #011410 100%)',
        accent: 'emerald'
    },
    {
        id: 'grad-crimson',
        name: 'Velvet Crimson',
        gradient: 'radial-gradient(circle at 30% 0%, #4c0519 0%, #29030d 50%, #0f0105 100%)',
        accent: 'rose'
    }
];

const STORAGE_KEY = 'invitor_theme_customizer_v1';

export const ThemeProvider = ({ children }) => {
    // Initial state loaded from localStorage if available
    const [themeConfig, setThemeConfig] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to parse saved theme settings:', e);
        }
        return {
            type: 'default', // 'default' | 'video' | 'image' | 'gradient'
            source: '',
            name: 'Default Obsidian',
            accent: 'indigo',
            opacity: 0.70,
            blur: 0,
            eventCategory: null
        };
    });

    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    // Save to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(themeConfig));
        } catch (e) {
            console.error('Failed to save theme settings:', e);
        }
    }, [themeConfig]);

    // Apply accent class or custom css variable on root
    useEffect(() => {
        const root = document.documentElement;
        const accentColors = {
            indigo: '#6366f1',
            cyan: '#06b6d4',
            purple: '#a855f7',
            emerald: '#10b981',
            amber: '#f59e0b',
            rose: '#f43f5e'
        };
        root.style.setProperty('--theme-accent', accentColors[themeConfig.accent] || '#6366f1');
    }, [themeConfig.accent]);

    // Helper functions
    const setVideoBackground = (url, name = 'Custom Video', accent = themeConfig.accent) => {
        setThemeConfig(prev => ({
            ...prev,
            type: 'video',
            source: url,
            name: name,
            accent: accent || prev.accent
        }));
    };

    const setImageBackground = (url, name = 'Custom Image', accent = themeConfig.accent) => {
        setThemeConfig(prev => ({
            ...prev,
            type: 'image',
            source: url,
            name: name,
            accent: accent || prev.accent
        }));
    };

    const setGradientBackground = (gradientCss, name = 'Custom Gradient', accent = 'indigo') => {
        setThemeConfig(prev => ({
            ...prev,
            type: 'gradient',
            source: gradientCss,
            name: name,
            accent: accent
        }));
    };

    const applyEventCategoryPreset = (category) => {
        const preset = EVENT_THEME_PRESETS[category] || EVENT_THEME_PRESETS.Tech;
        setThemeConfig(prev => ({
            ...prev,
            type: preset.type,
            source: preset.source,
            name: preset.name,
            accent: preset.accent,
            opacity: preset.opacity !== undefined ? preset.opacity : prev.opacity,
            blur: preset.blur !== undefined ? preset.blur : prev.blur,
            eventCategory: category
        }));
    };

    const setOverlayOpacity = (opacityVal) => {
        setThemeConfig(prev => ({ ...prev, opacity: Number(opacityVal) }));
    };

    const setBlur = (blurVal) => {
        setThemeConfig(prev => ({ ...prev, blur: Number(blurVal) }));
    };

    const setAccentTheme = (accentName) => {
        setThemeConfig(prev => ({ ...prev, accent: accentName }));
    };

    const resetToDefault = () => {
        setThemeConfig({
            type: 'default',
            source: '',
            name: 'Default Obsidian',
            accent: 'indigo',
            opacity: 0.70,
            blur: 0,
            eventCategory: null
        });
    };

    return (
        <ThemeContext.Provider value={{
            themeConfig,
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
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
