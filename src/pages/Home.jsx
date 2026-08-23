import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaTicketAlt, FaChevronDown, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Data states
    const [invites, setInvites] = useState([]);
    const [filteredInvites, setFilteredInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Quick Booking states
    const [quickViewInvite, setQuickViewInvite] = useState(null);
    const [bookingStep, setBookingStep] = useState('view'); // 'view', 'otp', 'payment', 'success'
    const [otp, setOtp] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

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
        <div className="bg-[#fafafa] min-h-screen text-slate-900 pb-20">
            <Toaster position="top-center" />

            {/* Enterprise Header/Hero */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                        Discover world-class events.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10">
                        Secure your spot at the most exclusive tech conferences, workshops, and meetups in your area.
                    </p>
                    
                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by event title or location..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {/* Category Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                selectedCategory === cat 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
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
                            <div key={i} className="bg-white border border-slate-200 rounded-xl h-80 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredInvites.length === 0 ? (
                    <div className="text-center py-24 text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                        No events match your current criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvites.map(invite => {
                            const isSoldOut = invite.availableSeats <= 0;
                            return (
                                <div key={invite._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col group">
                                    <div className="h-48 relative overflow-hidden bg-slate-100">
                                        <img src={invite.imageUrl || invite.image} alt={invite.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-bold text-slate-900 shadow-sm">
                                            {invite.ticketPrice === 0 ? 'FREE' : `₹${invite.ticketPrice}`}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-grow flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">{invite.category}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{invite.title}</h3>
                                        <div className="space-y-1.5 mb-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-2"><FaCalendarAlt className="text-slate-400" /> {new Date(invite.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-slate-400" /> <span className="truncate">{invite.location}</span></div>
                                        </div>
                                        
                                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">{invite.availableSeats} / {invite.totalSeats} left</span>
                                            <button 
                                                onClick={() => {
                                                    setBookingStep('view');
                                                    setOtp('');
                                                    setQuickViewInvite(invite);
                                                }}
                                                disabled={isSoldOut}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                    isSoldOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
                                                }`}
                                            >
                                                {isSoldOut ? 'Sold Out' : 'Details'}
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
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        
                        {bookingStep === 'view' && (
                            <>
                                <img src={quickViewInvite.imageUrl || quickViewInvite.image} alt={quickViewInvite.title} className="w-full h-56 object-cover" />
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{quickViewInvite.title}</h2>
                                    <p className="text-slate-600 text-sm mb-6">{quickViewInvite.description}</p>
                                    
                                    <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
                                        <div className="flex justify-between items-center mb-2 text-sm">
                                            <span className="text-slate-500">Date</span>
                                            <span className="font-medium text-slate-900">{new Date(quickViewInvite.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Price</span>
                                            <span className="font-bold text-slate-900">{quickViewInvite.ticketPrice === 0 ? 'FREE' : `₹${quickViewInvite.ticketPrice}`}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button onClick={() => setQuickViewInvite(null)} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition">Cancel</button>
                                        <button onClick={handleQuickBookClick} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Book Ticket</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {bookingStep === 'otp' && (
                            <div className="p-8 text-center">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Verify Booking</h3>
                                <p className="text-sm text-slate-500 mb-6">Enter the 6-digit code sent to your email.</p>
                                <form onSubmit={handleVerifyBooking}>
                                    <input 
                                        type="text" maxLength="6" placeholder="000000"
                                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-2xl font-mono tracking-widest py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6"
                                    />
                                    <button type="submit" disabled={bookingLoading} className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex justify-center">
                                        {bookingLoading ? <FaSpinner className="animate-spin" /> : 'Confirm'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {bookingStep === 'payment' && (
                            <div className="p-8 text-center">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Complete Checkout</h3>
                                <p className="text-sm text-slate-500 mb-6">Total Amount: <strong>₹{quickViewInvite.ticketPrice}</strong></p>
                                <button 
                                    onClick={() => {
                                        setBookingLoading(true);
                                        setTimeout(() => {
                                            setBookingStep('success');
                                            setTimeout(() => { setQuickViewInvite(null); navigate('/dashboard'); }, 2000);
                                        }, 1500);
                                    }} 
                                    disabled={bookingLoading}
                                    className="w-full py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex justify-center"
                                >
                                    {bookingLoading ? <FaSpinner className="animate-spin" /> : 'Pay Now'}
                                </button>
                            </div>
                        )}

                        {bookingStep === 'success' && (
                            <div className="p-10 text-center">
                                <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">Booking Confirmed!</h3>
                                <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
