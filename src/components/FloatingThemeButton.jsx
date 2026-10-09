import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { FaPalette, FaVideo } from 'react-icons/fa';

const FloatingThemeButton = () => {
    const { setIsCustomizerOpen, themeConfig } = useContext(ThemeContext);

    return (
        <button
            onClick={() => setIsCustomizerOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-3 sm:px-4 sm:py-3 rounded-full sm:rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 group border border-white/10 cursor-pointer"
            title="Customize Background & Video Theme"
            aria-label="Theme Customizer"
        >
            <div className="relative">
                <FaPalette className="text-white text-base group-hover:rotate-12 transition-transform duration-300" />
                {themeConfig.type === 'video' && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-bold tracking-tight leading-tight">
                    Theme & BG
                </span>
                <span className="text-[9px] text-indigo-200 uppercase font-mono tracking-wider leading-none">
                    {themeConfig.type === 'video' ? '🎬 Live Video' : themeConfig.type === 'image' ? '🖼️ Wallpaper' : '🎨 Palette'}
                </span>
            </div>
        </button>
    );
};

export default FloatingThemeButton;
