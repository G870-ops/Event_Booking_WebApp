import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    FaCalendarAlt, 
    FaMapMarkerAlt, 
    FaTicketAlt, 
    FaArrowLeft, 
    FaTimes,
    FaQrcode,
    FaCreditCard,
    FaWallet,
    FaLock,
    FaCheckCircle,
    FaSpinner,
    FaTimesCircle
} from 'react-icons/fa';

const InviteDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Booking / Modal States
    const [showModal, setShowModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    
    // Futuristic Multi-Step Payment Checkout states
    const [bookingStep, setBookingStep] = useState('otp'); // 'otp', 'payment', 'success'
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card'); // 'card', 'upi', 'wallet'
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    // Card details state
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // Simulated Web3 Wallet terminal states
    const [terminalLogs, setTerminalLogs] = useState([]);
    
    useEffect(() => {
        const fetchInviteDetails = async () => {
            try {
                const { data } = await api.get(`/invites/${id}`);
                setInvite(data);
            } catch (error) {
                console.error("Error fetching invitation page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInviteDetails();
    }, [id]);

    const handleBookClick = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        setBookingLoading(true);
        setBookingError('');
        try {
            // Trigger OTP from the backend
            await api.post('/bookings/send-otp');
            setBookingStep('otp');
            setShowModal(true);
        } catch (error) {
            setBookingError(error.response?.data?.error || error.response?.data?.message || 'Failed to initiate booking process. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleVerifyBooking = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setBookingError('Please enter a valid 6-digit OTP code.');
            return;
        }

        setBookingLoading(true);
        setBookingError('');
        try {
            // Register booking structure in database
            await api.post('/bookings', {
                inviteId: invite._id,
                otp: otp
            });

            // Transition based on event pricing
            if (invite.ticketPrice === 0) {
                // Free events bypass checkout and show success pass directly
                setBookingStep('success');
                setTimeout(() => {
                    setShowModal(false);
                    navigate('/dashboard');
                }, 3000);
            } else {
                // Paid events redirect to futuristic checkout
                setBookingStep('payment');
            }
        } catch (error) {
            setBookingError(error.response?.data?.error || error.response?.data?.message || 'OTP verification failed. Please check the code.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleProcessPayment = () => {
        setPaymentProcessing(true);
        // Simulate quantum transaction clearing
        setTimeout(() => {
            setPaymentProcessing(false);
            setBookingStep('success');
            setTimeout(() => {
                setShowModal(false);
                navigate('/dashboard');
            }, 3000);
        }, 2200);
    };

    // Simulated blockchain execution log loop for MetaMask
    const triggerWeb3Handshake = () => {
        setTerminalLogs([]);
        const logs = [
            "[SYSTEM] Fetching RPC provider node...",
            "[SYSTEM] MetaMask wallet identified: 0x4f...9c2a",
            "[SYSTEM] Initiating Quantum Web3 Handshake...",
            "[SYSTEM] Allocating 0.00045 ETH gas fees...",
            "[SYSTEM] Awaiting user digital ledger authorization...",
            "[SYSTEM] Transaction code accepted by MetaMask node.",
            "[SYSTEM] Broadcasting bytecode into Ethereum ledger...",
            "[SYSTEM] Receipt confirmed. Gas allocated successfully."
        ];
        
        logs.forEach((log, index) => {
            setTimeout(() => {
                setTerminalLogs(prev => [...prev, log]);
            }, (index + 1) * 300);
        });
    };

    useEffect(() => {
        if (selectedPaymentMethod === 'wallet' && bookingStep === 'payment') {
            triggerWeb3Handshake();
        }
    }, [selectedPaymentMethod, bookingStep]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400 font-mono text-xs gap-3">
                <FaSpinner className="animate-spin text-lg" />
                <span>Loading Secure Passport Details...</span>
            </div>
        );
    }

    if (!invite) {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-8 text-center flex flex-col items-center justify-center">
                <p className="text-slate-400 mb-4">Invitation records could not be found.</p>
                <Link to="/" className="text-indigo-400 hover:underline flex items-center justify-center gap-2 font-bold">
                    <FaArrowLeft /> Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative overflow-hidden">
            {/* Decorative background glows */}
            <div className="absolute top-[10%] left-[-10%] ambient-glow opacity-30"></div>
            <div className="absolute bottom-[20%] right-[-10%] ambient-glow-cyan opacity-25"></div>

            <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md relative z-10">
                <div className="h-64 md:h-96 relative bg-slate-950">
                    <img 
                        src={invite.imageUrl || invite.image} 
                        alt={invite.title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-95"></div>
                    <div className="absolute bottom-6 left-6 md:left-10 right-6 flex flex-wrap justify-between items-end gap-4">
                        <div>
                            <span className="bg-indigo-600 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md mb-2 inline-block">
                                {invite.category}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight font-display">{invite.title}</h1>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-10">
                    <p className="text-slate-300 text-sm md:text-base mb-8 leading-relaxed font-light">{invite.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-slate-800/80 py-6 mb-8 text-sm text-slate-400 font-semibold">
                        <div className="flex items-center gap-3">
                            <FaCalendarAlt className="text-indigo-400 text-lg" /> 
                            <span>{invite.date ? new Date(invite.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaMapMarkerAlt className="text-indigo-400 text-lg" /> 
                            <span>{invite.location}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pass Valuation</span>
                            <span className="text-2xl font-black text-white font-mono mt-1">
                                {invite.ticketPrice === 0 ? <span className="text-emerald-400">FREE</span> : `₹${invite.ticketPrice}`}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1 font-bold">{invite.availableSeats} of {invite.totalSeats} seats remaining</span>
                        </div>
                        <button 
                            onClick={handleBookClick}
                            disabled={bookingLoading || invite.availableSeats <= 0}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/15"
                        >
                            {bookingLoading ? 'Processing...' : invite.availableSeats <= 0 ? 'Sold Out' : 'Book Access Pass'}
                        </button>
                    </div>

                    {bookingError && !showModal && (
                        <div className="mt-6 p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-xl text-center text-xs font-semibold">
                            {bookingError}
                        </div>
                    )}
                </div>
            </div>

            {/* Futuristic Multi-step Checkout Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
                        
                        {/* Close button - only visible if not in success/processing states */}
                        {!paymentProcessing && bookingStep !== 'success' && (
                            <button 
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-950/50 rounded-full border border-white/5 transition"
                            >
                                <FaTimes size={12} />
                            </button>
                        )}

                        {/* STEP 1: OTP VERIFICATION */}
                        {bookingStep === 'otp' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-14 h-14 bg-indigo-950/50 border border-indigo-800/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <FaTicketAlt size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 font-display">Secure OTP Verification</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                                        We have dispatched a verification passcode to <strong className="text-slate-300">{user?.email || user?.mobile}</strong>. Enter it below to unlock the secure gateway.
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyBooking} className="space-y-4">
                                    {bookingError && (
                                        <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-xl text-center text-xs font-semibold">
                                            {bookingError}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                                            6-Digit Access Code
                                        </label>
                                        <input 
                                            type="text"
                                            required
                                            maxLength="6"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-center text-xl font-mono tracking-widest font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition duration-200"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={bookingLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/10 flex justify-center items-center gap-1.5"
                                    >
                                        {bookingLoading ? (
                                            <FaSpinner className="animate-spin text-sm" />
                                        ) : 'Verify & Continue'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* STEP 2: FUTURISTIC PAYMENT DASHBOARD */}
                        {bookingStep === 'payment' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <span className="bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 inline-block">
                                        Secure Transaction
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-1 font-display">Select Payment Channel</h3>
                                    <p className="text-xs text-slate-400">Quantum Encrypted Checkout Pipeline</p>
                                </div>

                                {/* Payment Method Selector tabs */}
                                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800/80 rounded-xl">
                                    {[
                                        { id: 'card', label: 'Neural Card', icon: <FaCreditCard /> },
                                        { id: 'upi', label: 'UPI Scan', icon: <FaQrcode /> },
                                        { id: 'wallet', label: 'Web3 Wallet', icon: <FaWallet /> }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedPaymentMethod(method.id)}
                                            className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                                selectedPaymentMethod === method.id 
                                                    ? 'bg-indigo-600 text-white' 
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                            }`}
                                        >
                                            {method.icon}
                                            <span>{method.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* PAYMENT DETAILS AREA */}
                                <div className="bg-slate-950/50 border border-slate-800/60 p-5 rounded-2xl">
                                    {/* 1. UPI QR Code Method */}
                                    {selectedPaymentMethod === 'upi' && (
                                        <div className="flex flex-col items-center py-4 relative overflow-hidden">
                                            {/* Pulsing scanning beam line */}
                                            <div className="absolute left-[30%] right-[30%] h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] scanner-line"></div>
                                            
                                            <div className="p-3 bg-white rounded-xl mb-4 border border-indigo-500/20 relative shadow-lg">
                                                {/* Simulated QR Code */}
                                                <div className="w-36 h-36 bg-[url('https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=200')] bg-cover filter invert opacity-90"></div>
                                            </div>
                                            <p className="text-xs text-cyan-400 font-mono text-center">quantum_pay_address_v1.upi</p>
                                            <p className="text-[10px] text-slate-500 text-center mt-2 font-bold uppercase tracking-wider">
                                                Scan using your HUD/Mobile. Awaiting Node response...
                                            </p>
                                        </div>
                                    )}

                                    {/* 2. Web3 Wallet Terminal Method */}
                                    {selectedPaymentMethod === 'wallet' && (
                                        <div className="py-2">
                                            <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[10px] text-emerald-400 space-y-1.5 h-36 overflow-y-auto no-scrollbar select-none">
                                                {terminalLogs.length === 0 ? (
                                                    <span className="text-slate-600 italic">Connecting blockchain nodes...</span>
                                                ) : (
                                                    terminalLogs.map((log, i) => <p key={i}>{log}</p>)
                                                )}
                                            </div>
                                            <div className="mt-4 flex justify-center">
                                                <button 
                                                    onClick={triggerWeb3Handshake}
                                                    className="px-4 py-2 bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                                                >
                                                    <FaSpinner className="animate-spin" size={10} /> Reconnect Ledger
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. 3D Credit Card Method */}
                                    {selectedPaymentMethod === 'card' && (
                                        <div className="flex flex-col items-center">
                                            {/* 3D Holographic Flip Card */}
                                            <div className="w-full max-w-[280px] h-44 perspective-1000 mb-6">
                                                <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                                                    
                                                    {/* Card Front */}
                                                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl p-5 text-white font-mono bg-gradient-to-tr from-slate-950 via-indigo-950/80 to-purple-950 border border-indigo-500/20 shadow-2xl flex flex-col justify-between">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Invitor Pass</span>
                                                            <span className="text-[10px] italic font-bold">NEURAL NET</span>
                                                        </div>
                                                        <div className="text-base tracking-widest text-white mt-4 font-bold">
                                                            {cardNumber || '•••• •••• •••• ••••'}
                                                        </div>
                                                        <div className="flex justify-between items-end mt-2">
                                                            <div>
                                                                <span className="block text-[7px] uppercase text-slate-500 font-bold">Holder</span>
                                                                <span className="text-[10px] uppercase font-bold truncate max-w-[120px] block">{cardName || 'YOUR NAME'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-[7px] uppercase text-slate-500 font-bold">Expires</span>
                                                                <span className="text-[10px] font-bold">{cardExpiry || 'MM/YY'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Back */}
                                                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl p-5 text-white font-mono bg-gradient-to-bl from-purple-950/90 via-slate-950 to-indigo-950 border border-indigo-500/20 shadow-2xl flex flex-col justify-between">
                                                        <div className="w-full h-7 bg-slate-950 -mx-5 mt-2"></div>
                                                        <div className="flex justify-end items-center gap-2 mt-4 bg-slate-900/60 p-2 rounded border border-slate-800">
                                                            <span className="text-[7px] uppercase text-slate-500 font-bold">CVV</span>
                                                            <span className="text-xs font-bold text-indigo-400">{cardCvv || '•••'}</span>
                                                        </div>
                                                        <div className="text-[8px] text-slate-600 text-center font-bold">
                                                            NEURAL SECURE KEY ENCRYPTION INC.
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Inputs for Card Form */}
                                            <div className="w-full space-y-4">
                                                <input 
                                                    type="text" 
                                                    maxLength="19"
                                                    placeholder="CARD NUMBER"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-indigo-500 transition"
                                                    value={cardNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                                                        setCardNumber(val);
                                                    }}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="CARD HOLDER NAME"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-indigo-500 transition uppercase"
                                                    value={cardName}
                                                    onChange={(e) => setCardName(e.target.value)}
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input 
                                                        type="text" 
                                                        maxLength="5"
                                                        placeholder="MM/YY"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-indigo-500 transition"
                                                        value={cardExpiry}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/\D/g, '');
                                                            if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                                                            setCardExpiry(val);
                                                        }}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        maxLength="3"
                                                        placeholder="CVV"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-indigo-500 transition"
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

                                {/* Price Total & Transaction CTA */}
                                <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gross Sum</span>
                                        <span className="text-xl font-black text-white font-mono">₹{invite.ticketPrice}</span>
                                    </div>
                                    <button
                                        onClick={handleProcessPayment}
                                        disabled={paymentProcessing}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-indigo-600/15 text-xs flex items-center gap-2"
                                    >
                                        {paymentProcessing ? (
                                            <>
                                                <FaSpinner className="animate-spin" /> Processing Ledger...
                                            </>
                                        ) : (
                                            <>
                                                <FaLock size={10} /> Authorize Transaction
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: BOOKING CONFIRMED HOLOGRAM PASS */}
                        {bookingStep === 'success' && (
                            <div className="space-y-6 text-center py-4">
                                <div className="w-16 h-16 bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <FaCheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 font-display">Booking Authorized</h3>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                                    Your holographic ticket access key has been generated and injected into your dashboard.
                                </p>

                                {/* Holographic pass ticket container */}
                                <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 text-left relative overflow-hidden shadow-inner">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase">ACCESS TICKET</span>
                                        <span className="text-[9px] font-bold text-emerald-400 tracking-wider">CONFIRMED</span>
                                    </div>
                                    <h4 className="text-base font-bold text-white mb-1 leading-tight line-clamp-1">{invite.title}</h4>
                                    <div className="text-[10px] text-indigo-300 font-semibold mb-4 uppercase">{invite.category}</div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 font-semibold mb-4">
                                        <div>
                                            <span className="block text-slate-500 text-[8px] uppercase">Attendee</span>
                                            <span className="text-white block mt-0.5">{user?.name}</span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 text-[8px] uppercase">Date</span>
                                            <span className="text-white block mt-0.5">{new Date(invite.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Mock Barcode */}
                                    <div className="flex flex-col items-center border-t border-slate-800/80 pt-4 mt-2">
                                        <div className="w-full h-8 bg-slate-950 rounded flex justify-around items-center px-4 overflow-hidden border border-slate-800 opacity-60">
                                            {[...Array(24)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="bg-indigo-300 h-full"
                                                    style={{ width: `${Math.floor(Math.random() * 3) + 1}px`, opacity: Math.random() > 0.1 ? 1 : 0.2 }}
                                                ></div>
                                            ))}
                                        </div>
                                        <span className="text-[8px] text-slate-500 font-mono tracking-widest mt-1.5 uppercase">INV-{invite._id.substring(18)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default InviteDetail;