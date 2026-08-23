import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    FaCalendarAlt, 
    FaMapMarkerAlt, 
    FaSearch, 
    FaRegClock, 
    FaTicketAlt, 
    FaShieldAlt, 
    FaChevronRight, 
    FaChevronLeft, 
    FaTimes, 
    FaPlus, 
    FaLaptopCode, 
    FaMusic, 
    FaTools, 
    FaPalette, 
    FaRunning, 
    FaStar, 
    FaAngleDown, 
    FaCheckCircle, 
    FaUserCircle, 
    FaInfoCircle, 
    FaKeyboard, 
    FaFilter, 
    FaFire, 
    FaArrowRight, 
    FaUndo,
    FaBriefcase,
    FaRobot,
    FaLock,
    FaSpinner,
    FaQrcode,
    FaCreditCard,
    FaWallet
} from 'react-icons/fa';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // API data & loading
    const [invites, setInvites] = useState([]);
    const [filteredInvites, setFilteredInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter, Search, and Sort states
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedPriceRange, setSelectedPriceRange] = useState('All');
    const [sortBy, setSortBy] = useState('date_asc');

    // UI state interactions
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [quickViewInvite, setQuickViewInvite] = useState(null);
    const [faqActiveId, setFaqActiveId] = useState(null);
    const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

    // Instant/Direct Booking states inside Quick-View Modal
    const [bookingStep, setBookingStep] = useState('view'); // 'view', 'otp', 'payment', 'success'
    const [otp, setOtp] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card'); // 'card', 'upi', 'wallet'
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    // Card inputs for 3D flip card
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState([]);

    // AI Matchmaker states
    const [showAIChat, setShowAIChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { sender: 'ai', text: 'Hello human! I am Invitor AI-9000, your quantum event matchmaker. Pick a parameter below to let me scan local event matrices.' }
    ]);
    const [aiTyping, setAiTyping] = useState(false);

    // Newsletter states
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);
    const [newsletterLoading, setNewsletterLoading] = useState(false);

    // Refs
    const searchContainerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Auto-rotation timer for testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonialIndex(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Hotkey: Press '/' to focus the search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Initial load
    useEffect(() => {
        fetchInvites();
    }, []);

    // client side filtering, searching, sorting and suggestion generator
    useEffect(() => {
        let result = [...invites];

        // Search Filter
        if (search.trim() !== '') {
            const query = search.toLowerCase();
            result = result.filter(inv => 
                inv.title.toLowerCase().includes(query) || 
                (inv.description && inv.description.toLowerCase().includes(query)) ||
                (inv.location && inv.location.toLowerCase().includes(query)) ||
                (inv.category && inv.category.toLowerCase().includes(query))
            );
        }

        // Category Filter
        if (selectedCategory !== 'All') {
            result = result.filter(inv => inv.category === selectedCategory);
        }

        // Price Filter
        if (selectedPriceRange !== 'All') {
            if (selectedPriceRange === 'Free') {
                result = result.filter(inv => inv.ticketPrice === 0);
            } else if (selectedPriceRange === 'Under500') {
                result = result.filter(inv => inv.ticketPrice < 500);
            } else if (selectedPriceRange === '500to2000') {
                result = result.filter(inv => inv.ticketPrice >= 500 && inv.ticketPrice <= 2000);
            } else if (selectedPriceRange === 'Over2000') {
                result = result.filter(inv => inv.ticketPrice > 2000);
            }
        }

        // Sorting
        if (sortBy === 'date_asc') {
            result.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortBy === 'date_desc') {
            result.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortBy === 'price_asc') {
            result.sort((a, b) => a.ticketPrice - b.ticketPrice);
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => b.ticketPrice - a.ticketPrice);
        } else if (sortBy === 'seats_desc') {
            result.sort((a, b) => (b.availableSeats / b.totalSeats) - (a.availableSeats / a.totalSeats));
        }

        setFilteredInvites(result);

        // Generate suggestions
        if (search.trim() !== '') {
            const query = search.toLowerCase();
            const suggestionsList = invites
                .filter(inv => inv.title.toLowerCase().includes(query))
                .map(inv => inv.title)
                .slice(0, 5);
            setSearchSuggestions(suggestionsList);
        } else {
            setSearchSuggestions([]);
        }
    }, [search, selectedCategory, selectedPriceRange, sortBy, invites]);

    const fetchInvites = async () => {
        setLoading(true);
        try {
            // Fetch everything, filtering is handled client-side for absolute responsiveness
            const { data } = await api.get('/invites');
            setInvites(data);
        } catch (error) {
            console.error('Error fetching invites:', error);
        } finally {
            setLoading(false);
        }
    };

    // Quick Book inside Quick View modal flow
    const handleQuickBookClick = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setBookingLoading(true);
        setBookingError('');
        try {
            await api.post('/bookings/send-otp');
            setBookingStep('otp');
        } catch (error) {
            setBookingError(error.response?.data?.error || error.response?.data?.message || 'Failed to trigger OTP verification.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleQuickVerifyBooking = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setBookingError('Please enter a valid 6-digit OTP code.');
            return;
        }

        setBookingLoading(true);
        setBookingError('');
        try {
            await api.post('/bookings', {
                inviteId: quickViewInvite._id,
                otp: otp
            });

            if (quickViewInvite.ticketPrice === 0) {
                setBookingStep('success');
                setTimeout(() => {
                    setQuickViewInvite(null);
                    navigate('/dashboard');
                }, 3000);
            } else {
                setBookingStep('payment');
            }
        } catch (error) {
            setBookingError(error.response?.data?.error || error.response?.data?.message || 'OTP verification failed.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleQuickProcessPayment = () => {
        setPaymentProcessing(true);
        setTimeout(() => {
            setPaymentProcessing(false);
            setBookingStep('success');
            setTimeout(() => {
                setQuickViewInvite(null);
                navigate('/dashboard');
            }, 3000);
        }, 2200);
    };

    // Web3 simulation logging in Home Quick-View
    const triggerHomeWeb3Handshake = () => {
        setTerminalLogs([]);
        const logs = [
            "[SYSTEM] Connection sequence initialized...",
            "[SYSTEM] Authenticating to MetaMask node...",
            "[SYSTEM] Wallet linked: 0x4f...9c2a",
            "[SYSTEM] Authorizing gas amount: 0.00045 ETH",
            "[SYSTEM] Confirming signature on hardware ledger...",
            "[SYSTEM] Bytecode successfully broadcasted."
        ];
        logs.forEach((log, index) => {
            setTimeout(() => {
                setTerminalLogs(prev => [...prev, log]);
            }, (index + 1) * 300);
        });
    };

    useEffect(() => {
        if (selectedPaymentMethod === 'wallet' && bookingStep === 'payment' && quickViewInvite) {
            triggerHomeWeb3Handshake();
        }
    }, [selectedPaymentMethod, bookingStep]);

    // AI Chatbot queries handler
    const handleAIChatPrompt = (promptType, customText = '') => {
        let userText = customText;
        if (promptType === 'tech') userText = "Find tech conferences";
        if (promptType === 'music') userText = "Find music events";
        if (promptType === 'free') userText = "Show free passes";
        if (promptType === 'popular') userText = "Show popular coordinate hubs";

        setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setAiTyping(true);

        setTimeout(() => {
            setAiTyping(false);
            let matching = [];
            let text = '';

            if (promptType === 'tech') {
                matching = invites.filter(i => (i.category || '').toLowerCase().includes('tech'));
                text = matching.length > 0 
                    ? `I've mapped ${matching.length} technology matrices coordinates for you:`
                    : "No active technology coordinates found in this system cycle.";
            } else if (promptType === 'music') {
                matching = invites.filter(i => (i.category || '').toLowerCase().includes('music'));
                text = matching.length > 0
                    ? `I've found ${matching.length} music coordinates vibrating right now:`
                    : "No active music coordinate clusters identified.";
            } else if (promptType === 'free') {
                matching = invites.filter(i => i.ticketPrice === 0);
                text = matching.length > 0
                    ? `I've extracted ${matching.length} free pass systems:`
                    : "All passes in current memory cycles have set costs.";
            } else if (promptType === 'popular') {
                matching = invites.filter(i => i.availableSeats / i.totalSeats <= 0.6);
                text = matching.length > 0
                    ? `I've targeted ${matching.length} high-density seats bookings:`
                    : "Coordinates have stable attendee densities currently.";
            } else {
                // search custom text matching
                const query = userText.toLowerCase();
                matching = invites.filter(i => 
                    i.title.toLowerCase().includes(query) || 
                    i.category.toLowerCase().includes(query)
                );
                text = matching.length > 0 
                    ? `Matching nodes found for "${userText}":` 
                    : `No matrices matched the keyword "${userText}".`;
            }

            setChatMessages(prev => [...prev, { sender: 'ai', text, results: matching.slice(0, 3) }]);
        }, 1200);
    };

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (!newsletterEmail) return;
        setNewsletterLoading(true);
        setTimeout(() => {
            setNewsletterSuccess(true);
            setNewsletterLoading(false);
            setNewsletterEmail('');
        }, 1200);
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory('All');
        setSelectedPriceRange('All');
        setSortBy('date_asc');
    };

    // Calculate categories dynamically based on actual database entries
    const categories = ['All', ...new Set(invites.map(inv => inv.category).filter(Boolean))];

    // Helper functions for aesthetics mapping
    const getCategoryIcon = (category) => {
        const name = category.toLowerCase();
        if (name.includes('music') || name.includes('concert') || name.includes('band') || name.includes('fest')) {
            return <FaMusic />;
        }
        if (name.includes('tech') || name.includes('code') || name.includes('conference') || name.includes('dev') || name.includes('web')) {
            return <FaLaptopCode />;
        }
        if (name.includes('workshop') || name.includes('learn') || name.includes('class') || name.includes('hackathon') || name.includes('tools')) {
            return <FaTools />;
        }
        if (name.includes('art') || name.includes('paint') || name.includes('culture') || name.includes('exhibition') || name.includes('photo')) {
            return <FaPalette />;
        }
        if (name.includes('sport') || name.includes('fit') || name.includes('run') || name.includes('game') || name.includes('match')) {
            return <FaRunning />;
        }
        if (name.includes('business') || name.includes('summit') || name.includes('finance') || name.includes('lead')) {
            return <FaBriefcase />;
        }
        return <FaTicketAlt />;
    };

    const getCategoryColors = (category) => {
        const name = category.toLowerCase();
        if (name.includes('music')) {
            return {
                border: 'border-pink-500/20 hover:border-pink-500/40',
                bg: 'bg-pink-500/10 text-pink-400',
                glow: 'shadow-pink-500/5 hover:shadow-pink-500/10',
                badge: 'bg-pink-900/30 border border-pink-700/30 text-pink-400'
            };
        }
        if (name.includes('tech')) {
            return {
                border: 'border-cyan-500/20 hover:border-cyan-500/40',
                bg: 'bg-cyan-500/10 text-cyan-400',
                glow: 'shadow-cyan-500/5 hover:shadow-cyan-500/10',
                badge: 'bg-cyan-900/30 border border-cyan-700/30 text-cyan-400'
            };
        }
        if (name.includes('workshop')) {
            return {
                border: 'border-amber-500/20 hover:border-amber-500/40',
                bg: 'bg-amber-500/10 text-amber-400',
                glow: 'shadow-amber-500/5 hover:shadow-amber-500/10',
                badge: 'bg-amber-900/30 border border-amber-700/30 text-amber-400'
            };
        }
        if (name.includes('art')) {
            return {
                border: 'border-emerald-500/20 hover:border-emerald-500/40',
                bg: 'bg-emerald-500/10 text-emerald-400',
                glow: 'shadow-emerald-500/5 hover:shadow-emerald-500/10',
                badge: 'bg-emerald-900/30 border border-emerald-700/30 text-emerald-400'
            };
        }
        if (name.includes('sport')) {
            return {
                border: 'border-yellow-500/20 hover:border-yellow-500/40',
                bg: 'bg-yellow-500/10 text-yellow-400',
                glow: 'shadow-yellow-500/5 hover:shadow-yellow-500/10',
                badge: 'bg-yellow-900/30 border border-yellow-700/30 text-yellow-400'
            };
        }
        if (name.includes('business')) {
            return {
                border: 'border-violet-500/20 hover:border-violet-500/40',
                bg: 'bg-violet-500/10 text-violet-400',
                glow: 'shadow-violet-500/5 hover:shadow-violet-500/10',
                badge: 'bg-violet-900/30 border border-violet-700/30 text-violet-400'
            };
        }
        // Default
        return {
            border: 'border-indigo-500/20 hover:border-indigo-500/40',
            bg: 'bg-indigo-500/10 text-indigo-400',
            glow: 'shadow-indigo-500/5 hover:shadow-indigo-500/10',
            badge: 'bg-indigo-900/30 border border-indigo-700/30 text-indigo-400'
        };
    };

    // Quick Stats computations
    const totalEvents = invites.length;
    const freeEvents = invites.filter(i => i.ticketPrice === 0).length;
    const averagePrice = totalEvents ? Math.round(invites.reduce((acc, i) => acc + i.ticketPrice, 0) / totalEvents) : 0;

    return (
        <div className="flex flex-col min-h-screen text-slate-100 relative selection:bg-indigo-500 selection:text-white pb-16">
            
            {/* Background elements */}
            <div className="absolute top-[20%] left-0 ambient-glow opacity-30"></div>
            <div className="absolute top-[60%] right-0 ambient-glow-cyan opacity-25"></div>

            {/* Hero Section */}
            <div className="relative bg-slate-950/70 backdrop-blur-sm text-white rounded-3xl overflow-hidden mb-12 border border-slate-800 shadow-2xl p-10 md:p-20">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950 to-slate-950/95"></div>
                
                {/* Floating ambient spots */}
                <div className="absolute -top-12 -left-12 ambient-glow opacity-50"></div>
                <div className="absolute -bottom-16 -right-16 ambient-glow-cyan opacity-40"></div>

                <div className="relative text-center flex flex-col items-center z-10 max-w-4xl mx-auto">
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                        <FaFire className="text-orange-400 animate-pulse" /> Welcome to Invitor
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight font-display drop-shadow-xl text-white">
                        Find Your Next <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                            Unforgettable
                        </span> Experience
                    </h1>
                    <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover the best tech conferences, late-night music festivals, and hands-on workshops happening directly in your area. Secure your spot today.
                    </p>

                    {/* Advanced Search Bar with Suggestions */}
                    <div ref={searchContainerRef} className="w-full max-w-2xl mx-auto relative z-20">
                        <div className="relative flex items-center shadow-3xl bg-slate-900/90 rounded-full border border-slate-800 focus-within:border-indigo-500/50 transition-all duration-300 p-1 group">
                            <FaSearch className="absolute left-6 text-slate-500 text-xl group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search events by title, category, or location..."
                                className="w-full pl-16 pr-24 py-4 rounded-full text-base text-white bg-transparent outline-none focus:outline-none transition-all placeholder-slate-500 font-medium"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            
                            {/* Clear Search & Key Indicator */}
                            <div className="absolute right-4 flex items-center gap-3">
                                {search && (
                                    <button 
                                        onClick={() => setSearch('')}
                                        className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                )}
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 border border-slate-800 bg-slate-950 px-2 py-1 rounded">
                                    <FaKeyboard /> /
                                </span>
                            </div>
                        </div>

                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-left backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                                    <span>Suggestions</span>
                                    <span className="text-[10px] font-normal text-slate-600">ESC to close</span>
                                </div>
                                <div className="divide-y divide-slate-800/50">
                                    {searchSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSearch(suggestion);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full text-left px-5 py-3.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition flex items-center gap-3 font-medium"
                                        >
                                            <FaTicketAlt className="text-indigo-400 shrink-0" size={12} />
                                            <span className="truncate">{suggestion}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Glassmorphism Statistics Grid */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mt-12 pt-8 border-t border-slate-800/80 text-center">
                        <div className="p-2">
                            <div className="text-2xl md:text-3xl font-black font-display text-white">{totalEvents}</div>
                            <div className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Events Listed</div>
                        </div>
                        <div className="p-2 border-x border-slate-800/60">
                            <div className="text-2xl md:text-3xl font-black font-display text-emerald-400">{freeEvents}</div>
                            <div className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Free Passes</div>
                        </div>
                        <div className="p-2">
                            <div className="text-2xl md:text-3xl font-black font-display text-indigo-400">₹{averagePrice}</div>
                            <div className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Avg Price</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Section Header & Interactive Filter Bar */}
            <div className="mb-12">
                
                {/* Horizontal Category Carousel */}
                <div className="flex flex-col gap-2 mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">Browse Categories</h3>
                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            const colors = getCategoryColors(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2.5 whitespace-nowrap transition-all duration-300 border ${
                                        isSelected 
                                            ? `${colors.bg} ${colors.border.replace('20', '50').replace('hover:', '')} text-white ring-2 ring-indigo-500/20 scale-105 shadow-lg` 
                                            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                                    }`}
                                >
                                    <span className={isSelected ? 'text-white' : 'text-slate-500'}>
                                        {getCategoryIcon(cat)}
                                    </span>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Secondary Filters: Price, Sort and Reset */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    
                    {/* Price Range Badges */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-2 shrink-0">
                            <FaFilter /> Price:
                        </span>
                        {[
                            { label: 'All Price', value: 'All' },
                            { label: 'Free Pass', value: 'Free' },
                            { label: 'Under ₹500', value: 'Under500' },
                            { label: '₹500 - ₹2000', value: '500to2000' },
                            { label: '₹2000+', value: 'Over2000' }
                        ].map(priceItem => (
                            <button
                                key={priceItem.value}
                                onClick={() => setSelectedPriceRange(priceItem.value)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    selectedPriceRange === priceItem.value
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                            >
                                {priceItem.label}
                            </button>
                        ))}
                    </div>

                    {/* Sorting Select and Clear Filters Button */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between sm:justify-end">
                        <div className="relative flex items-center bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-1.5 group shrink-0">
                            <span className="text-xs font-semibold text-slate-400 mr-2">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-bold text-white pr-6 outline-none focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="date_asc" className="bg-slate-900 text-white">Upcoming Date</option>
                                <option value="date_desc" className="bg-slate-900 text-white">Latest Added</option>
                                <option value="price_asc" className="bg-slate-900 text-white">Price: Low to High</option>
                                <option value="price_desc" className="bg-slate-900 text-white">Price: High to Low</option>
                                <option value="seats_desc" className="bg-slate-900 text-white">Seats Availability</option>
                            </select>
                            <FaAngleDown className="absolute right-3 text-slate-400 pointer-events-none group-hover:text-white transition-colors" size={10} />
                        </div>

                        {(search || selectedCategory !== 'All' || selectedPriceRange !== 'All' || sortBy !== 'date_asc') && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-400 hover:text-white transition group shrink-0"
                            >
                                <FaUndo className="group-hover:rotate-[-45deg] transition-all" size={10} />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center px-1 mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Active Events</span>
                    <span>{filteredInvites.length} Matches Found</span>
                </div>
            </div>

            {/* Events Grid / Loaders */}
            {loading ? (
                /* Skeleton Loader Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden h-[410px] animate-pulse flex flex-col p-4">
                            <div className="h-44 bg-slate-800 rounded-xl mb-4 w-full"></div>
                            <div className="h-4 bg-slate-800 rounded w-1/4 mb-3"></div>
                            <div className="h-6 bg-slate-800 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-slate-800 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-slate-800 rounded w-2/3 mb-6"></div>
                            <div className="mt-auto h-10 bg-slate-800 rounded-xl w-full"></div>
                        </div>
                    ))}
                </div>
            ) : filteredInvites.length === 0 ? (
                /* Empty State Block */
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800/60 rounded-3xl max-w-2xl mx-auto p-8 shadow-inner">
                    <div className="w-16 h-16 bg-slate-800/60 text-slate-500 border border-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                        <FaSearch size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No event matches found</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                        We couldn't find any results matching your search terms or filters. Try adjusting your query or resetting filters.
                    </p>
                    <button
                        onClick={resetFilters}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/25"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                /* Glowing Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredInvites.map(invite => {
                        const styleConfig = getCategoryColors(invite.category || 'Invite');
                        const isSoldOut = invite.availableSeats <= 0;
                        const fillRatio = invite.availableSeats / invite.totalSeats;
                        
                        // Seat indicator calculations
                        let seatColor = 'bg-emerald-500';
                        let seatStatusText = 'Seats available';
                        if (fillRatio <= 0.15) {
                            seatColor = 'bg-rose-500 animate-pulse';
                            seatStatusText = `Selling fast! Only ${invite.availableSeats} left`;
                        } else if (fillRatio <= 0.5) {
                            seatColor = 'bg-amber-500';
                            seatStatusText = 'Less than half remaining';
                        }

                        return (
                            <div 
                                key={invite._id} 
                                className={`glass-panel glass-card-hover rounded-2xl overflow-hidden flex flex-col group border shadow-md relative ${styleConfig.border} ${styleConfig.glow}`}
                            >
                                {/* Thumbnail Header */}
                                <div className="h-48 bg-slate-950 overflow-hidden relative">
                                    <img 
                                        src={invite.imageUrl || invite.image} 
                                        alt={invite.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-95 group-hover:brightness-100" 
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                                    
                                    {/* Glassmorphic Category & Price Tags */}
                                    <div className="absolute top-4 left-4 bg-slate-950/70 border border-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-slate-300 uppercase shadow-sm">
                                        {invite.category || 'Invite'}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-slate-950/70 border border-white/5 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black shadow-sm font-mono">
                                        {invite.ticketPrice === 0 ? (
                                            <span className="text-emerald-400">FREE PASS</span>
                                        ) : (
                                            <span className="text-white">₹{invite.ticketPrice}</span>
                                        )}
                                    </div>

                                    {/* Sold Out Overlay */}
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10">
                                            <span className="border-2 border-rose-500 text-rose-500 font-black tracking-widest text-sm uppercase px-4 py-2 rounded-lg rotate-[-12deg] shadow-lg">
                                                Sold Out
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Details */}
                                <div className="p-6 flex-grow flex flex-col">
                                    
                                    {/* Title */}
                                    <h2 className="text-lg font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-1">
                                        {invite.title}
                                    </h2>

                                    {/* Date & Location list */}
                                    <div className="flex flex-col gap-2.5 mb-5 text-slate-400 text-xs font-medium border-b border-slate-800/40 pb-4">
                                        <div className="flex items-center gap-2.5">
                                            <FaCalendarAlt className="text-indigo-400" size={12} />
                                            <span>
                                                {new Date(invite.date).toLocaleDateString(undefined, { 
                                                    weekday: 'short', 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <FaMapMarkerAlt className="text-indigo-400 shrink-0" size={12} />
                                            <span className="truncate">{invite.location}</span>
                                        </div>
                                    </div>

                                    {/* Seat Availability Visual Tracker */}
                                    <div className="mt-auto pt-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${seatColor}`}></span>
                                                {seatStatusText}
                                            </span>
                                            <span className="font-mono">{invite.availableSeats}/{invite.totalSeats}</span>
                                        </div>
                                        <div className="w-full bg-slate-800/60 rounded-full h-1.5 mb-5 overflow-hidden">
                                            <div 
                                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                                    fillRatio <= 0.15 
                                                        ? 'bg-rose-500' 
                                                        : fillRatio <= 0.5 
                                                            ? 'bg-amber-500' 
                                                            : 'bg-indigo-500'
                                                }`} 
                                                style={{ width: `${(invite.availableSeats / invite.totalSeats) * 100}%` }}
                                            ></div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex gap-2">
                                            {/* Details Button */}
                                            <Link 
                                                to={`/invites/${invite._id}`} 
                                                className="flex-grow inline-flex items-center justify-center gap-1 bg-slate-800/80 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-300 shadow hover:shadow-indigo-600/10 border border-slate-700/50 hover:border-indigo-500"
                                            >
                                                Details <FaArrowRight className="text-[10px] opacity-70 group-hover:translate-x-1 transition-transform" />
                                            </Link>

                                            {/* Quick Info Button */}
                                            <button
                                                onClick={() => {
                                                    setBookingStep('view');
                                                    setOtp('');
                                                    setBookingError('');
                                                    setCardNumber('');
                                                    setCardName('');
                                                    setCardExpiry('');
                                                    setCardCvv('');
                                                    setQuickViewInvite(invite);
                                                }}
                                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2.5 rounded-xl border border-slate-700/50 transition"
                                                title="Quick View Details"
                                            >
                                                <FaInfoCircle size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Host Your Event CTA Section */}
            <div className="relative mt-20 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 md:p-12 mb-16 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 max-w-xl text-left">
                    <span className="bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 inline-block">
                        Organizers & Hosts
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight font-display">
                        Have an experience in mind? Create your own events.
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-0 font-light">
                        Unlock powerful tools to list, secure, and manage passes. With built-in 2FA OTP codes, checkout simulations, and active seats dashboards. Let's make something historic.
                    </p>
                </div>
                <div className="relative z-10 shrink-0">
                    <Link 
                        to="/admin" 
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl transition shadow-xl shadow-indigo-600/20 hover:scale-[1.02]"
                    >
                        Host an Event <FaPlus size={11} />
                    </Link>
                </div>
            </div>

            {/* Testimonials Review Section */}
            <div className="mb-20 text-center max-w-4xl mx-auto px-4">
                <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Testimonials</span>
                <h2 className="text-3xl font-extrabold text-white mt-2 mb-10 font-display">Why attendees love Invitor</h2>
                
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-10 relative shadow-lg min-h-[220px] flex flex-col justify-between">
                    <div className="text-indigo-500 text-5xl font-serif absolute top-4 left-6 pointer-events-none opacity-20">“</div>
                    
                    {/* Active Testimonial Card */}
                    <div className="relative z-10 flex-grow mb-6">
                        <p className="text-slate-300 italic text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                            {testimonials[activeTestimonialIndex].quote}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-800/60 pt-6 gap-4">
                        <div className="flex items-center gap-3">
                            <img 
                                src={testimonials[activeTestimonialIndex].avatar} 
                                alt={testimonials[activeTestimonialIndex].name} 
                                className="w-11 h-11 rounded-full object-cover border border-indigo-500/30"
                            />
                            <div className="text-left">
                                <h4 className="text-sm font-bold text-white leading-tight">{testimonials[activeTestimonialIndex].name}</h4>
                                <span className="text-[11px] text-slate-500 font-semibold">{testimonials[activeTestimonialIndex].role}</span>
                            </div>
                        </div>

                        {/* Stars Rating */}
                        <div className="flex gap-1 text-amber-400">
                            {[...Array(testimonials[activeTestimonialIndex].rating)].map((_, i) => (
                                <FaStar key={i} size={13} />
                            ))}
                        </div>

                        {/* Slider Nav Dot Buttons */}
                        <div className="flex gap-2">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTestimonialIndex(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        activeTestimonialIndex === index 
                                            ? 'bg-indigo-500 w-6' 
                                            : 'bg-slate-800 hover:bg-slate-700'
                                    }`}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Accordions Section */}
            <div className="mb-20 max-w-3xl mx-auto px-4">
                <div className="text-center mb-10">
                    <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">FAQ</span>
                    <h2 className="text-3xl font-extrabold text-white mt-2 font-display">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = faqActiveId === index;
                        return (
                            <div 
                                key={index} 
                                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300"
                            >
                                <button
                                    onClick={() => setFaqActiveId(isOpen ? null : index)}
                                    className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 text-white font-semibold focus:outline-none"
                                >
                                    <span className="text-sm sm:text-base leading-snug">{faq.question}</span>
                                    <FaAngleDown 
                                        className={`text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} 
                                        size={16} 
                                    />
                                </button>
                                
                                <div 
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                        isOpen ? 'max-h-40 border-t border-slate-800/40' : 'max-h-0'
                                    }`}
                                >
                                    <div className="px-6 py-5 text-sm text-slate-400 leading-relaxed bg-slate-950/20">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Newsletter Subscription Widget */}
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl mb-12">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none"></div>
                <div className="relative z-10 text-center max-w-xl mx-auto flex flex-col items-center">
                    <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
                        Weekly Digest
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 font-display">Stay Ahead of the Trend</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                        Receive exclusive access codes and direct invitations for local and global gatherings.
                    </p>

                    {newsletterSuccess ? (
                        <div className="w-full max-w-md bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-4 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
                            <FaCheckCircle /> Thank you! You've successfully subscribed to our weekly newsletter digest.
                        </div>
                    ) : (
                        <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                            <input 
                                type="email" 
                                required
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                placeholder="Enter your email address..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-600 font-medium"
                            />
                            <button 
                                type="submit" 
                                disabled={newsletterLoading}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition shrink-0 shadow-lg shadow-indigo-600/10"
                            >
                                {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer Section */}
            <footer className="pt-16 pb-8 border-t border-slate-800/80 text-center relative z-10 mt-auto">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-left mb-12">
                    
                    {/* Brand Meta Column */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/15">
                                <FaTicketAlt className="text-white text-lg" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight font-display">Invitor</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-xs font-light">
                            The simplest, most dynamic way to manage, discover, and host world-class events in your local city. Let's make memories together.
                        </p>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 font-display">Quick Navigation</h4>
                        <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
                            <li><Link to="/" className="hover:text-indigo-400 transition">Browse Active Invites</Link></li>
                            <li><Link to="/dashboard" className="hover:text-indigo-400 transition">Attendee Dashboard</Link></li>
                            <li><Link to="/admin" className="hover:text-indigo-400 transition">Host Admin Console</Link></li>
                            <li><Link to="/login" className="hover:text-indigo-400 transition">Access Profile Signin</Link></li>
                        </ul>
                    </div>

                    {/* Services Infrastructure Info */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 font-display">Platform Security</h4>
                        <div className="space-y-3.5">
                            <div className="flex items-start gap-2.5 text-slate-400">
                                <FaShieldAlt className="text-indigo-400 shrink-0 mt-0.5" size={14} />
                                <div className="text-[11px]">
                                    <strong className="text-slate-300 block font-bold mb-0.5">Dual-factor OTP Checks</strong>
                                    Instant pass security locks using disposable email keychains.
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 text-slate-400">
                                <FaRegClock className="text-indigo-400 shrink-0 mt-0.5" size={14} />
                                <div className="text-[11px]">
                                    <strong className="text-slate-300 block font-bold mb-0.5">Real-time seat reservations</strong>
                                    Instant counters block double bookings.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 border-t border-slate-800/40 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <div>
                        &copy; {new Date().getFullYear()} Invitor Platform. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#privacy" className="hover:text-indigo-400 transition">Privacy Policy</a>
                        <a href="#terms" className="hover:text-indigo-400 transition">Terms of Service</a>
                        <a href="#security" className="hover:text-indigo-400 transition">Security Protocol</a>
                    </div>
                </div>
            </footer>

            {/* Futuristic AI Matchmaker Chat Widget */}
            <div className="fixed bottom-6 right-6 z-40">
                {/* Bubble Toggle Button */}
                <button
                    onClick={() => setShowAIChat(!showAIChat)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center border border-indigo-400/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group"
                    title="Ask AI Matchmaker"
                >
                    {showAIChat ? <FaTimes size={18} /> : <FaRobot size={22} className="group-hover:rotate-[15deg] transition-all" />}
                </button>

                {/* AI Panel Sidebar */}
                {showAIChat && (
                    <div className="glass-panel border border-slate-800 rounded-3xl p-5 shadow-2xl w-80 sm:w-96 fixed bottom-24 right-6 z-50 flex flex-col max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                        {/* Title Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <FaRobot className="text-indigo-400 text-lg" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Invitor AI-9000</span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Node
                            </span>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 mb-4 pr-1 text-xs leading-relaxed">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 rounded-2xl max-w-[85%] ${
                                        msg.sender === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                            : 'bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                        
                                        {/* Embedded minified recommend cards */}
                                        {msg.results && msg.results.length > 0 && (
                                            <div className="mt-3 space-y-2 border-t border-slate-850 pt-2.5">
                                                {msg.results.map(rec => (
                                                    <Link 
                                                        key={rec._id} 
                                                        to={`/invites/${rec._id}`}
                                                        onClick={() => setShowAIChat(false)}
                                                        className="block bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition"
                                                    >
                                                        <h5 className="font-bold text-white line-clamp-1">{rec.title}</h5>
                                                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold mt-1">
                                                            <span>{rec.category}</span>
                                                            <span className="font-mono text-indigo-400">
                                                                {rec.ticketPrice === 0 ? 'FREE' : `₹${rec.ticketPrice}`}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {aiTyping && (
                                <div className="flex items-start">
                                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-slate-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-float-1"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-float-2"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-float-3"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Suggestion Prompts */}
                        <div className="border-t border-slate-800 pt-3 space-y-2 shrink-0">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Quick Coordinates</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <button 
                                    onClick={() => handleAIChatPrompt('tech')}
                                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition font-medium text-left truncate"
                                >
                                    💻 Tech coordinates
                                </button>
                                <button 
                                    onClick={() => handleAIChatPrompt('music')}
                                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition font-medium text-left truncate"
                                >
                                    🎵 Music frequencies
                                </button>
                                <button 
                                    onClick={() => handleAIChatPrompt('free')}
                                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition font-medium text-left truncate"
                                >
                                    🎟️ Free pass loops
                                </button>
                                <button 
                                    onClick={() => handleAIChatPrompt('popular')}
                                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition font-medium text-left truncate"
                                >
                                    🔥 High-density nodes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick-View Event Modal dialog */}
            {quickViewInvite && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300"
                    onClick={() => {
                        if (!paymentProcessing && bookingStep !== 'success') {
                            setQuickViewInvite(null);
                        }
                    }}
                >
                    <div 
                        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        {!paymentProcessing && bookingStep !== 'success' && (
                            <button 
                                onClick={() => setQuickViewInvite(null)}
                                className="absolute top-4 right-4 z-10 p-2 bg-slate-950/80 border border-white/5 backdrop-blur-md rounded-full text-slate-400 hover:text-white transition shadow"
                            >
                                <FaTimes size={12} />
                            </button>
                        )}

                        {/* STAGE A: VIEW DETAILS */}
                        {bookingStep === 'view' && (
                            <>
                                <div className="h-56 relative bg-slate-950">
                                    <img 
                                        src={quickViewInvite.imageUrl || quickViewInvite.image} 
                                        alt={quickViewInvite.title} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                    
                                    {/* Modal Header Title */}
                                    <div className="absolute bottom-4 left-6 right-6">
                                        <span className="bg-indigo-600 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md mb-2 inline-block">
                                            {quickViewInvite.category}
                                        </span>
                                        <h3 className="text-xl md:text-2xl font-black text-white leading-tight font-display line-clamp-1">{quickViewInvite.title}</h3>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{quickViewInvite.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 border-y border-slate-800/80 py-4 text-[11px] font-semibold text-slate-400">
                                        <div className="flex items-center gap-2.5">
                                            <FaCalendarAlt className="text-indigo-400" size={12} />
                                            <span>
                                                {new Date(quickViewInvite.date).toLocaleDateString(undefined, { 
                                                    weekday: 'short', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <FaMapMarkerAlt className="text-indigo-400" size={12} />
                                            <span className="truncate">{quickViewInvite.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ticket Cost</span>
                                            <span className="text-xl font-black text-white font-mono mt-0.5 font-display">
                                                {quickViewInvite.ticketPrice === 0 ? (
                                                    <span className="text-emerald-400">FREE</span>
                                                ) : (
                                                    <span>₹{quickViewInvite.ticketPrice}</span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setQuickViewInvite(null)}
                                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-700"
                                            >
                                                Close
                                            </button>
                                            <button 
                                                onClick={handleQuickBookClick}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
                                            >
                                                Instant Book <FaArrowRight size={8} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* STAGE B: OTP VERIFICATION */}
                        {bookingStep === 'otp' && (
                            <div className="p-6 space-y-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-800/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <FaTicketAlt size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 font-display">Secure Quick verification</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Enter the verification passcode sent to <strong className="text-slate-300">{user?.email || user?.mobile}</strong>.
                                    </p>
                                </div>

                                <form onSubmit={handleQuickVerifyBooking} className="space-y-4">
                                    {bookingError && (
                                        <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-xl text-center text-[10px] font-bold">
                                            {bookingError}
                                        </div>
                                    )}

                                    <div>
                                        <input 
                                            type="text"
                                            required
                                            maxLength="6"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest font-bold focus:border-indigo-500 outline-none text-white transition"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={bookingLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs flex justify-center items-center gap-1.5"
                                    >
                                        {bookingLoading ? <FaSpinner className="animate-spin" /> : 'Authorize Pass'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* STAGE C: PAYMENT PORTAL */}
                        {bookingStep === 'payment' && (
                            <div className="p-6 space-y-5">
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white mb-1 font-display">Instant Checkout</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Select secure channel</p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-850 rounded-xl">
                                    {['card', 'upi', 'wallet'].map(ch => (
                                        <button
                                            key={ch}
                                            onClick={() => setSelectedPaymentMethod(ch)}
                                            className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition ${
                                                selectedPaymentMethod === ch ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {ch === 'card' ? <FaCreditCard /> : ch === 'upi' ? <FaQrcode /> : <FaWallet />}
                                            <span className="capitalize">{ch}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                                    {selectedPaymentMethod === 'upi' && (
                                        <div className="flex flex-col items-center py-2 relative overflow-hidden">
                                            <div className="absolute left-[20%] right-[20%] h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] scanner-line"></div>
                                            <div className="p-2 bg-white rounded-lg mb-2">
                                                <div className="w-24 h-24 bg-[url('https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=200')] bg-cover filter invert opacity-90"></div>
                                            </div>
                                            <p className="text-[10px] text-cyan-400 font-mono">quantum_instant.upi</p>
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'wallet' && (
                                        <div className="w-full bg-slate-950 rounded border border-slate-800/80 p-3 font-mono text-[9px] text-emerald-400 space-y-1 h-28 overflow-y-auto no-scrollbar">
                                            {terminalLogs.length === 0 ? "Loading blockchain connection..." : terminalLogs.map((log, i) => <p key={i}>{log}</p>)}
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'card' && (
                                        <div className="flex flex-col items-center">
                                            {/* card graphics */}
                                            <div className="w-full max-w-[220px] h-32 perspective-1000 mb-4">
                                                <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                                                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl p-4 text-white font-mono bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 border border-indigo-500/10 shadow-2xl flex flex-col justify-between">
                                                        <div className="flex justify-between items-start text-[8px] text-indigo-400 font-bold uppercase">
                                                            <span>Invitor</span>
                                                            <span>NEURAL</span>
                                                        </div>
                                                        <div className="text-xs tracking-widest font-bold text-center">{cardNumber || '•••• •••• •••• ••••'}</div>
                                                        <div className="flex justify-between items-end text-[8px] text-slate-500">
                                                            <span className="truncate max-w-[80px] font-bold text-white uppercase">{cardName || 'NAME'}</span>
                                                            <span className="font-bold text-white">{cardExpiry || 'MM/YY'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl p-4 text-white font-mono bg-gradient-to-bl from-purple-950 via-slate-950 to-indigo-950 border border-indigo-500/10 shadow-2xl flex flex-col justify-between">
                                                        <div className="w-full h-6 bg-slate-950 -mx-4 mt-1"></div>
                                                        <div className="flex justify-end items-center gap-1.5 bg-slate-900/60 p-1.5 rounded border border-slate-800 text-[8px]">
                                                            <span>CVV</span>
                                                            <span className="font-bold text-indigo-400">{cardCvv || '•••'}</span>
                                                        </div>
                                                        <div className="text-[6px] text-slate-700 text-center font-bold">SECURE NETWORK</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-2">
                                                <input 
                                                    maxLength="19"
                                                    placeholder="CARD NUMBER"
                                                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-indigo-500 transition"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '')}
                                                />
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input 
                                                        placeholder="NAME"
                                                        className="col-span-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-indigo-500 transition uppercase"
                                                        value={cardName}
                                                        onChange={(e) => setCardName(e.target.value)}
                                                    />
                                                    <input 
                                                        placeholder="MM/YY"
                                                        className="col-span-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-indigo-500 transition"
                                                        value={cardExpiry}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/\D/g, '');
                                                            if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                                                            setCardExpiry(val);
                                                        }}
                                                    />
                                                    <input 
                                                        placeholder="CVV"
                                                        maxLength="3"
                                                        className="col-span-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-indigo-500 transition"
                                                        value={cardCvv}
                                                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                                        onFocus={() => setIsCardFlipped(true)}
                                                        onBlur={() => setIsCardFlipped(false)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Gross Total: ₹{quickViewInvite.ticketPrice}</span>
                                    <button
                                        onClick={handleQuickProcessPayment}
                                        disabled={paymentProcessing}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-[10px] flex items-center gap-1.5 transition"
                                    >
                                        {paymentProcessing ? <FaSpinner className="animate-spin" /> : <FaLock />} Authorize Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STAGE D: SUCCESS PASS */}
                        {bookingStep === 'success' && (
                            <div className="p-6 text-center space-y-5">
                                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                                    <FaCheckCircle size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1 font-display">Pass Booked</h3>
                                <p className="text-[10px] text-slate-500">Holographic coordinate registered to your dashboard.</p>

                                <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-indigo-500/20 rounded-xl p-4 text-left relative overflow-hidden">
                                    <div className="flex justify-between items-center text-[8px] font-bold text-indigo-400 mb-2">
                                        <span>QUICK TICKET</span>
                                        <span className="text-emerald-400">AUTHORIZED</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{quickViewInvite.title}</h4>
                                    <span className="text-[9px] text-slate-400 block mb-3 font-semibold uppercase">{quickViewInvite.category}</span>
                                    
                                    <div className="w-full h-6 bg-slate-950 rounded flex justify-around items-center px-3 overflow-hidden border border-slate-850">
                                        {[...Array(20)].map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="bg-indigo-400 h-full"
                                                style={{ width: `${Math.floor(Math.random() * 2) + 1}px`, opacity: Math.random() > 0.1 ? 1 : 0.2 }}
                                            ></div>
                                        ))}
                                    </div>
                                    <span className="text-[7px] text-slate-600 block text-center font-mono tracking-widest mt-1.5 uppercase font-bold">INV-{quickViewInvite._id.substring(18)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

// Mock Testimonial database
const testimonials = [
    {
        name: "Sarah Jenkins",
        role: "Lead Tech Organizer",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        quote: "Invitor transformed how we handle registration. The built-in 2FA OTP verification eliminated spam registrations completely!",
        rating: 5
    },
    {
        name: "Marcus Vance",
        role: "Festival Coordinator",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        quote: "We sold out Neon Nights in record time. The instant booking flow and seat counter animations kept our attendees highly engaged.",
        rating: 5
    },
    {
        name: "Elena Rostova",
        role: "Art Curator & Blogger",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
        quote: "As an attendee, booking passes is a dream. The visual seat bar tells me exactly how fast I need to act. Absolutely love the aesthetic!",
        rating: 5
    }
];

// Mock FAQ database
const faqs = [
    {
        question: "How do I secure my ticket passes on Invitor?",
        answer: "To book a seat, click 'View Details' or 'Book Access Pass' on any event. You'll be asked to provide your verification. We will send a secure 6-digit OTP to your registered email to instantly verify and finalize your booking."
    },
    {
        question: "Are there any hidden service charges for paid events?",
        answer: "No, Invitor values transparency. The price displayed on the card is the final price you pay. There are no hidden transaction or registration fees."
    },
    {
        question: "Can I cancel a booking after it is confirmed?",
        answer: "Yes. Simply head to your personal User Dashboard where you can view all active passes and click 'Cancel' to instantly release your seat back to the community pool."
    },
    {
        question: "How can I host my own event on this platform?",
        answer: "If you have an admin or organizer account, you can access the admin dashboard to create, update, or cancel events, and monitor real-time booking statistics."
    }
];

export default Home;
