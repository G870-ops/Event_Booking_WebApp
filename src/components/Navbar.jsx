import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { FaTicketAlt, FaBars, FaTimes, FaUserCircle, FaCog, FaPalette } from 'react-icons/fa';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { setIsCustomizerOpen, themeConfig } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 shadow-xl shadow-black/20'
                    : 'bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/30'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 group"
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50 group-hover:bg-indigo-500 transition-all duration-200">
                            <FaTicketAlt className="text-white text-sm" />
                        </div>
                        <span className="text-white text-xl font-black tracking-tight font-display">
                            INVITOR
                        </span>
                        <span className="hidden sm:block text-[9px] text-indigo-400 font-bold tracking-widest uppercase bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded-md">
                            BETA
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                isActive('/') 
                                    ? 'text-white bg-slate-800/80' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            Events
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                                        isActive('/dashboard') || isActive('/admin')
                                            ? 'text-white bg-slate-800/80' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                                >
                                    {user.role === 'admin' ? <FaCog className="text-xs" /> : <FaUserCircle className="text-xs" />}
                                    {user.role === 'admin' ? 'Admin' : 'My Passes'}
                                </Link>

                                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-800">
                                    <NotificationBell />
                                    <div className="text-right hidden lg:block">
                                        <p className="text-[10px] text-slate-500 font-medium">Signed in as</p>
                                        <p className="text-xs text-slate-300 font-semibold truncate max-w-[120px]">{user.name}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-slate-800 hover:bg-red-950/60 hover:border-red-800/50 border border-slate-700 text-slate-300 hover:text-red-400 text-xs font-bold rounded-lg transition-all duration-200"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold rounded-lg hover:bg-slate-800/50 transition-all duration-200"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                        {/* Theme & Background Quick Customizer */}
                        <button
                            onClick={() => setIsCustomizerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 hover:border-indigo-600 transition shadow-sm ml-1 cursor-pointer"
                            title="Change UI Theme & Video Background"
                        >
                            <FaPalette className="text-indigo-400" />
                            <span className="hidden lg:inline">Theme & BG</span>
                        </button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        aria-label="Toggle navigation menu"
                    >
                        {menuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pb-4 pt-2 space-y-1 animate-in slide-in-from-top-2 duration-150">
                    <Link
                        to="/"
                        className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                            isActive('/') ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        Events
                    </Link>

                    <button
                        onClick={() => {
                            setIsCustomizerOpen(true);
                            setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 hover:bg-indigo-900/50 transition text-left cursor-pointer"
                    >
                        <FaPalette className="text-indigo-400" />
                        <span>UI Theme & Video Background</span>
                    </button>

                    {user ? (
                        <>
                            <Link
                                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                                    isActive('/dashboard') || isActive('/admin') ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                {user.role === 'admin' ? 'Admin Dashboard' : 'My Passes'}
                            </Link>
                            <div className="border-t border-slate-800 pt-2 mt-2 flex items-center justify-between gap-2">
                                <p className="text-xs text-slate-500 px-3 font-medium">Logged in as <span className="text-slate-300 font-semibold">{user.name}</span></p>
                                <NotificationBell />
                            </div>
                            <div className="border-t border-slate-800 pt-2 mt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-3 py-2.5 bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 text-sm font-bold rounded-lg transition text-left"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2 border-t border-slate-800 pt-2 mt-2">
                            <Link
                                to="/login"
                                className="block px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-semibold rounded-lg transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="block px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg text-center transition"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;