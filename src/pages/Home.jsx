import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaTicketAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Existing States
    const [invites, setInvites] = useState([]);
    const [filteredInvites, setFilteredInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [quickViewInvite, setQuickViewInvite] = useState(null);
    const [bookingStep, setBookingStep] = useState('view');
    const [otp, setOtp] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    // Background Customization States
    const [bgColor, setBgColor] = useState('#0a0a0c');
    const [bgImage, setBgImage] = useState('');
    const [showPanel, setShowPanel] = useState(false);

    // Expanded Color Presets array covering all event types & themes
    const colorPresets = [
        // Tech & Cyber Events
        { name: 'Cyber Dark (Tech/Hackathons)', hex: '#0a0a0c' },
        { name: 'Electric Purple (AI/Future)', hex: '#581c87' },
        { name: 'Neon Cyan (Developer/DevOps)', hex: '#0e7490' },

        // Music, Festivals & Nightlife
        { name: 'Neon Magenta (Music/DJ)', hex: '#be185d' },
        { name: 'Club Violet (Concerts/Parties)', hex: '#6d28d9' },
        { name: 'Sunset Amber (Festivals)', hex: '#b45309' },

        // Business & Corporate Seminars
        { name: 'Slate Gray (Corporate)', hex: '#0f172a' },
        { name: 'Executive Navy (Summit/Conf)', hex: '#1e3a8a' },
        { name: 'Steel Blue (Enterprise)', hex: '#334155' },

        // Luxury, Weddings & Galas
        { name: 'Emerald Gala (Formal/Meetups)', hex: '#064e3b' },
        { name: 'Imperial Gold (Awards/VIP)', hex: '#713f12' },
        { name: 'Royal Crimson (Red Carpet)', hex: '#881337' },

        // Nature, Outdoor & Sports
        { name: 'Forest Eco (Marathons/Outdoor)', hex: '#14532d' },
        { name: 'Fresh Mint (Wellness/Yoga)', hex: '#047857' },

        // Light & Clean Themes
        { name: 'Clean Light (Day Workshops)', hex: '#f8fafc' },
        { name: 'Soft Gray (Casual)', hex: '#e2e8f0' },
    ];

    // Expanded & Categorized Background Presets with Thumbnails
    const imagePresets = [
        { name: 'None (Solid)', category: 'Default', url: '', thumb: '' },

        // Tech & Coding
        { name: 'Cyber Grid', category: 'Tech / Hackathon', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80' },
        { name: 'Abstract Neon AI', category: 'Tech / AI', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80' },

        // Music & Nightlife
        { name: 'EDM Stage Lights', category: 'Music / Concert', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&q=80' },
        { name: 'Club DJ Vibes', category: 'Party / DJ Night', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=200&q=80' },

        // Gaming & Esports
        { name: 'Esports Arena', category: 'Gaming', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80' },

        // Business & Corporate
        { name: 'Executive Summit', category: 'Corporate', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=200&q=80' },

        // Luxury, Galas & Formal
        { name: 'Red Carpet Gala', category: 'Luxury / Awards', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=200&q=80' },

        // Outdoor & Festivals
        { name: 'Sunset Carnival', category: 'Festival / Culture', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=200&q=80' },

        // Sports & Fitness
        { name: 'Stadium Floodlights', category: 'Sports', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=200&q=80' }
    ];

    useEffect(() => {
        fetchInvites();
    }, []);

    useEffect(() => {
        let result = [...invites];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(i => i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
        }
        if (selectedCategory !== 'All') {
            result = result.filter(i => i.category === selectedCategory);
        }
        setFilteredInvites(result);
    }, [search, selectedCategory, invites]);

    const fetchInvites = async () => {
        try {
            const { data } = await api.get('/invites');
            setInvites(data);
        } catch (error) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickBookClick = async () => {
        if (!user) return navigate('/login');
        setBookingLoading(true);
        try {
            await api.post('/bookings/send-otp');
            setBookingStep('otp');
            toast.success('OTP sent to your registered email');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleVerifyBooking = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');
        setBookingLoading(true);
        try {
            await api.post('/bookings', { inviteId: quickViewInvite._id, otp });
            if (quickViewInvite.ticketPrice === 0) {
                setBookingStep('success');
                setTimeout(() => { setQuickViewInvite(null); navigate('/dashboard'); }, 2000);
            } else {
                setBookingStep('payment');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const categories = ['All', ...new Set(invites.map(i => i.category).filter(Boolean))];

    return (
        <div
            className="min-h-screen text-slate-300 pb-20 font-display transition-colors duration-300 relative"
            style={{
                backgroundColor: bgColor,
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                }
            }} />

            {/* Floating Customizer Toggle Button - Bottom Right */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-full shadow-2xl font-medium text-sm flex items-center gap-2 border border-indigo-400/30 transition-all hover:scale-105"
            >
                🎨 Customize Theme
            </button>

            {/* Customizer Drawer / Panel - Fixed Above Bottom Button */}
            {showPanel && (
                <div className="fixed bottom-20 right-6 z-50 w-80 bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700 shadow-2xl text-slate-100 max-h-[75vh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
                        Appearance Settings
                        <button onClick={() => setShowPanel(false)} className="text-sm text-slate-400 hover:text-white">✕</button>
                    </h3>

                    {/* Color Presets */}
                    <div className="mb-5">
                        <label className="text-xs font-semibold text-slate-400 block mb-2">
                            Theme Colors by Event Type
                        </label>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                            {colorPresets.map((preset) => (
                                <button
                                    key={preset.hex}
                                    onClick={() => {
                                        setBgColor(preset.hex);
                                        setBgImage('');
                                    }}
                                    className={`w-9 h-9 rounded-full border border-slate-600/80 shadow-md transition-all hover:scale-110 hover:border-white focus:outline-none ${bgColor === preset.hex ? 'ring-2 ring-indigo-500 scale-110 border-white' : ''
                                        }`}
                                    style={{ backgroundColor: preset.hex }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Custom Color Picker */}
                    <div className="mb-4">
                        <label className="text-xs font-semibold text-slate-400 block mb-2">Custom Color Picker</label>
                        <div className="flex items-center gap-3 bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                            />
                            <span className="text-xs font-mono text-slate-300 uppercase">{bgColor}</span>
                        </div>
                    </div>

                    {/* Enhanced Background Image Selector */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-slate-400">Background Image Theme</label>
                            {bgImage && (
                                <button
                                    onClick={() => setBgImage('')}
                                    className="text-[10px] text-rose-400 hover:underline"
                                >
                                    Clear Image
                                </button>
                            )}
                        </div>

                        {/* Scrollable Visual Thumbnail Selector */}
                        <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1 mb-3">
                            {imagePresets.map((img) => (
                                <button
                                    key={img.name}
                                    onClick={() => setBgImage(img.url)}
                                    className={`relative group h-20 rounded-xl overflow-hidden border text-left transition-all ${bgImage === img.url
                                            ? 'ring-2 ring-indigo-500 border-white scale-[0.98]'
                                            : 'border-slate-700/80 hover:border-slate-500'
                                        }`}
                                >
                                    {img.url ? (
                                        <img
                                            src={img.thumb || img.url}
                                            alt={img.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
                                            Solid Color
                                        </div>
                                    )}

                                    {/* Gradient Overlay & Labels */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-2 flex flex-col justify-end">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 line-clamp-1">
                                            {img.category}
                                        </span>
                                        <span className="text-xs font-semibold text-white truncate">
                                            {img.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Custom URL Input */}
                        <input
                            type="text"
                            placeholder="Or paste custom Image URL..."
                            value={bgImage}
                            onChange={(e) => setBgImage(e.target.value)}
                            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Futuristic Hero Section */}
            <div className="relative overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                        alt="Cyberpunk Aesthetic"
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/40 via-[#030712]/80 to-[#030712]"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6">
                        Next-Gen Experiences
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
                        Discover the <span className="text-gradient">future</span> of events.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-sans">
                        Secure your spot at the most exclusive tech conferences, hackathons, and global meetups.
                    </p>

                    {/* Futuristic Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                        <div className="relative flex items-center">
                            <FaSearch className="absolute left-5 text-indigo-400" />
                            <input
                                type="text"
                                placeholder="Search coordinates or event titles..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans shadow-2xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
                {/* Glowing Category Filters */}
                <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                                : 'bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white hover:border-white/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass-card h-80 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredInvites.length === 0 ? (
                    <div className="text-center py-24 text-slate-500 glass-panel rounded-2xl">
                        No active nodes found matching your query.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvites.map(invite => {
                            const isSoldOut = invite.availableSeats <= 0;
                            return (
                                <div key={invite._id} className="glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                    <div className="h-48 relative overflow-hidden bg-slate-900 border-b border-white/5">
                                        <img src={invite.imageUrl || invite.image} alt={invite.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg">
                                            {invite.ticketPrice === 0 ? <span className="text-emerald-400">FREE</span> : `₹${invite.ticketPrice}`}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-grow flex flex-col relative z-10">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{invite.category}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-1 group-hover:text-indigo-300 transition-colors">{invite.title}</h3>
                                        <div className="space-y-2 mb-6 text-sm text-slate-400 font-sans">
                                            <div className="flex items-center gap-2.5"><FaCalendarAlt className="text-indigo-500" /> {new Date(invite.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-2.5"><FaMapMarkerAlt className="text-indigo-500" /> <span className="truncate">{invite.location}</span></div>
                                        </div>

                                        <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{invite.availableSeats} / {invite.totalSeats} spots</span>
                                            <button
                                                onClick={() => {
                                                    setBookingStep('view');
                                                    setOtp('');
                                                    setQuickViewInvite(invite);
                                                }}
                                                disabled={isSoldOut}
                                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${isSoldOut
                                                    ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]'
                                                    }`}
                                            >
                                                {isSoldOut ? 'Locked' : 'Access'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick View Modal */}
            {quickViewInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-lg transition-opacity" onClick={() => setQuickViewInvite(null)}></div>

                    <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        {bookingStep === 'view' && (
                            <>
                                <div className="relative h-56">
                                    <img src={quickViewInvite.imageUrl || quickViewInvite.image} alt={quickViewInvite.title} className="w-full h-full object-cover opacity-70" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                    <div className="absolute bottom-4 left-6 right-6">
                                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 line-clamp-1">{quickViewInvite.title}</h2>
                                        <span className="text-indigo-400 text-sm font-mono">{quickViewInvite.category}</span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-slate-400 text-sm mb-6 leading-relaxed font-sans">{quickViewInvite.description}</p>

                                    <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-white/5">
                                        <div className="flex justify-between items-center mb-3 text-sm">
                                            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">Date</span>
                                            <span className="font-medium text-white">{new Date(quickViewInvite.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">Access Fee</span>
                                            <span className="font-bold text-lg text-white">
                                                {quickViewInvite.ticketPrice === 0 ? <span className="text-emerald-400">FREE</span> : `₹${quickViewInvite.ticketPrice}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setQuickViewInvite(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition">Abort</button>
                                        <button onClick={handleQuickBookClick} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition">Acquire Ticket</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {bookingStep === 'otp' && (
                            <div className="p-8 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">Security Verification</h3>
                                <p className="text-sm text-slate-400 mb-8 font-sans">Enter the 6-digit cryptographic key sent to your inbox.</p>
                                <form onSubmit={handleVerifyBooking}>
                                    <input
                                        type="text" maxLength="6" placeholder="000000"
                                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white mb-6 shadow-inner"
                                    />
                                    <button type="submit" disabled={bookingLoading} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                                        {bookingLoading ? <FaSpinner className="animate-spin" /> : 'Authorize Protocol'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {bookingStep === 'payment' && (
                            <div className="p-8 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">Secure Checkout</h3>
                                <p className="text-sm text-slate-400 mb-8 font-mono">Total Transaction: <strong className="text-indigo-400 text-lg">₹{quickViewInvite.ticketPrice}</strong></p>
                                <button
                                    onClick={() => {
                                        setBookingLoading(true);
                                        setTimeout(() => {
                                            setBookingStep('success');
                                            setTimeout(() => { setQuickViewInvite(null); navigate('/dashboard'); }, 2000);
                                        }, 1500);
                                    }}
                                    disabled={bookingLoading}
                                    className="w-full py-3.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition flex justify-center items-center gap-2"
                                >
                                    {bookingLoading ? <FaSpinner className="animate-spin text-slate-900" /> : 'Process Payment'}
                                </button>
                            </div>
                        )}

                        {bookingStep === 'success' && (
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaCheckCircle className="text-emerald-400 text-5xl" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">Access Granted</h3>
                                <p className="text-slate-400 text-sm font-mono">Routing to your dashboard...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;