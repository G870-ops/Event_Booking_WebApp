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
    FaTimesCircle,
    FaCopy
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
    const [currentBookingId, setCurrentBookingId] = useState('');
    
    // Futuristic Multi-Step Payment Checkout states
    const [bookingStep, setBookingStep] = useState('otp'); // 'otp', 'payment', 'success'
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card'); // 'card', 'upi', 'wallet'
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    // Card details state
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState(user?.name || '');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // UPI details state
    const [userUpiId, setUserUpiId] = useState('');
    const [upiUtr, setUpiUtr] = useState('');
    const [copied, setCopied] = useState(false);

    // Simulated Web3 Wallet terminal states
    const [terminalLogs, setTerminalLogs] = useState([]);

    // Smart ticketing: live quote, tiers, currency, waitlist
    const [pricing, setPricing] = useState(null);
    const [currencies, setCurrencies] = useState([]);
    const [tierId, setTierId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [currency, setCurrency] = useState('');
    const [waitStatus, setWaitStatus] = useState(null);
    const [waitBusy, setWaitBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [bookingAmount, setBookingAmount] = useState(null);
    
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

    // Live pricing quote (surge + tiers + group discount + currency)
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        const params = new URLSearchParams();
        if (tierId) params.set('tierId', tierId);
        params.set('quantity', String(quantity));
        if (currency) params.set('currency', currency);
        api.get(`/ticketing/invites/${id}/pricing?${params.toString()}`)
            .then(({ data }) => { if (!cancelled) setPricing(data); })
            .catch(err => console.error('Pricing load failed', err));
        return () => { cancelled = true; };
    }, [id, tierId, quantity, currency]);

    // Supported currencies for the checkout selector
    useEffect(() => {
        api.get('/ticketing/currencies')
            .then(({ data }) => setCurrencies(data.currencies || []))
            .catch(() => setCurrencies([]));
    }, []);

    // My waitlist position for this event
    useEffect(() => {
        if (!user || !id) return;
        api.get(`/waitlist/event/${id}/status`)
            .then(({ data }) => setWaitStatus(data))
            .catch(() => setWaitStatus(null));
    }, [user, id]);

    const joinWaitlist = async () => {
        if (!user) { navigate('/login'); return; }
        setWaitBusy(true);
        setNotice('');
        try {
            const { data } = await api.post(`/waitlist/${id}`, { quantity });
            setWaitStatus({ onWaitlist: true, status: data.entry?.status || 'waiting', position: data.entry?.position, seatsAhead: 0 });
            setNotice(data.message || 'You are on the waitlist — we will notify you the moment a seat opens.');
        } catch (err) {
            setNotice(err.response?.data?.error || 'Could not join the waitlist');
        } finally {
            setWaitBusy(false);
        }
    };

    const leaveWaitlist = async () => {
        setWaitBusy(true);
        setNotice('');
        try {
            await api.delete(`/waitlist/${id}`);
            setWaitStatus({ onWaitlist: false });
            setNotice('You left the waitlist.');
        } catch (err) {
            setNotice(err.response?.data?.error || 'Could not leave the waitlist');
        } finally {
            setWaitBusy(false);
        }
    };

    const quote = pricing?.quote;
    const symbol = quote?.symbol || invite?.symbol || '₹';
    const allowedCurrencies = invite?.currency?.allowed || [];
    const showCurrencyPicker = currencies.length > 1 && allowedCurrencies.length > 1;

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
            const { data } = await api.post('/bookings', {
                inviteId: invite._id,
                otp: otp,
                tierId: tierId || '',
                quantity,
                currency: currency || undefined
            });

            const newBookingId = data.bookingId;
            setCurrentBookingId(newBookingId);

            const payable = Number(data.quote?.amount ?? quote?.total ?? invite.ticketPrice);
            setBookingAmount(payable);

            // Transition based on event pricing
            if (payable === 0) {
                // Free events automatically confirm
                if (newBookingId) {
                    await api.post(`/bookings/${newBookingId}/pay`, {
                        bookingId: newBookingId,
                        paymentMethod: 'free',
                        paymentReference: `FREE_${Date.now()}`
                    });
                }
                setBookingStep('success');
                setTimeout(() => {
                    setShowModal(false);
                    navigate('/dashboard');
                }, 3000);
            } else {
                // Paid events redirect to payment
                setBookingStep('payment');
            }
        } catch (error) {
            setBookingError(error.response?.data?.error || error.response?.data?.message || 'OTP verification failed. Please check the code.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleProcessPayment = async () => {
        setPaymentProcessing(true);
        setBookingError('');

        try {
            let paymentMethod = selectedPaymentMethod;
            let reference = `PAY_${Date.now()}`;
            if (selectedPaymentMethod === 'card') {
                paymentMethod = 'stripe';
                reference = `stripe_ch_${Math.random().toString(36).substring(2, 9)}`;
            } else if (selectedPaymentMethod === 'upi') {
                paymentMethod = 'upi_qr';
                reference = upiUtr ? `UTR_${upiUtr}` : `UPI_${Date.now()}`;
            }

            if (currentBookingId) {
                await api.post(`/bookings/${currentBookingId}/pay`, {
                    bookingId: currentBookingId,
                    paymentMethod,
                    paymentReference: reference,
                    upiId: userUpiId || 'invitor.official@okaxis'
                });
            }

            setPaymentProcessing(false);
            setBookingStep('success');
            setTimeout(() => {
                setShowModal(false);
                navigate('/dashboard');
            }, 3000);
        } catch (error) {
            setPaymentProcessing(false);
            setBookingError(error.response?.data?.error || error.response?.data?.message || 'Payment processing failed. Please try again.');
        }
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

                    {/* Ticket tier selector */}
                    {pricing?.tiers?.length > 0 && (
                        <div className="mb-6">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-3">Select your pass tier</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {pricing.tiers.map(t => {
                                    const soldOut = t.remaining <= 0 || !t.active;
                                    const selected = tierId === t._id;
                                    return (
                                        <button
                                            key={t._id}
                                            type="button"
                                            disabled={soldOut}
                                            onClick={() => { setTierId(selected ? '' : t._id); setQuantity(1); }}
                                            className={`text-left p-4 rounded-xl border transition ${selected
                                                ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40'
                                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'} ${soldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-bold text-white text-sm">{t.name}</span>
                                                <span className="font-mono font-black text-white text-sm">{symbol}{t.price}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 block leading-relaxed line-clamp-2">
                                                {t.description || (t.perks?.length ? t.perks.join(' • ') : 'Standard entry')}
                                            </span>
                                            <span className={`text-[10px] font-bold mt-2 block ${t.remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {soldOut ? 'SOLD OUT' : `${t.remaining} left${t.remaining <= 10 ? ' — closing soon' : ''}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => setTierId('')}
                                className={`mt-2 text-[10px] font-bold ${!tierId ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                ← General admission (base price)
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                        {/* Quantity + currency */}
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Quantity</span>
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-8 h-8 rounded-lg bg-slate-900 text-slate-300 hover:text-white font-bold transition"
                                    >−</button>
                                    <span className="w-8 text-center font-mono font-black text-white">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.min(Number(quote?.maxQty) || 10, quantity + 1))}
                                        className="w-8 h-8 rounded-lg bg-slate-900 text-slate-300 hover:text-white font-bold transition"
                                    >+</button>
                                </div>
                            </div>

                            {showCurrencyPicker && (
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Currency</span>
                                    <select
                                        value={currency || invite.currency?.base || 'INR'}
                                        onChange={e => setCurrency(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500"
                                    >
                                        {currencies
                                            .filter(c => allowedCurrencies.includes(c.code))
                                            .map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Live price */}
                        <div className="flex flex-col md:items-end">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                Pass Valuation{quote?.tierName ? ` • ${quote.tierName}` : ''}
                            </span>
                            <span className="text-2xl font-black text-white font-mono mt-1 flex items-center gap-2 flex-wrap">
                                {quote
                                    ? (quote.total === 0 ? <span className="text-emerald-400">FREE</span> : `${symbol}${quote.total}`)
                                    : (invite.ticketPrice === 0 ? <span className="text-emerald-400">FREE</span> : `₹${invite.ticketPrice}`)}
                                {quote?.surge && (
                                    <span
                                        title={`Dynamic pricing active — demand ratio ${quote.demandRatio}`}
                                        className="text-[10px] font-black uppercase text-orange-400 bg-orange-950/60 border border-orange-800 px-1.5 py-0.5 rounded"
                                    >
                                        surge ×{Number(quote.multiplier).toFixed(2)}
                                    </span>
                                )}
                                {quote?.savedVsBase && (
                                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                                        early-bird −{Math.round((1 - Number(quote.multiplier)) * 100)}%
                                    </span>
                                )}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1 font-bold text-right">
                                {invite.availableSeats} of {invite.totalSeats} seats remaining
                                {quote?.quantity > 1 ? ` • ${quote.quantity} tickets` : ''}
                            </span>
                            {quote?.groupDiscount?.applied && (
                                <span className="text-[10px] font-bold text-emerald-400 mt-1">
                                    Group discount applied: −{symbol}{quote.groupDiscount.amount} ({quote.groupDiscount.percent}%)
                                </span>
                            )}
                            {pricing?.refundPolicy && (
                                <span className="text-[10px] text-slate-600 font-semibold mt-1">
                                    Refunds: {pricing.refundPolicy.mode} policy
                                    {pricing.refundPolicy.mode === 'tiered'
                                        ? ` • ${pricing.refundPolicy.feePercent}% fee before ${pricing.refundPolicy.cutoffHours}h to start`
                                        : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CTA row */}
                    <div className="flex flex-wrap items-center justify-end gap-3 mt-6">
                        <Link
                            to={`/events/${invite._id}/hub`}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-800/60 bg-indigo-950/40 px-5 py-3.5 rounded-xl transition"
                            title="Live hub: stream, polls, floor map, networking"
                        >
                            Open Event Hub →
                        </Link>

                        {invite.availableSeats > 0 ? (
                            <button
                                onClick={handleBookClick}
                                disabled={bookingLoading || (tierId && quote?.tierRemaining === 0)}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/15"
                            >
                                {bookingLoading ? 'Processing...' : (tierId && quote?.tierRemaining === 0) ? 'Tier Sold Out' : 'Book Access Pass'}
                            </button>
                        ) : waitStatus?.onWaitlist ? (
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800 px-3 py-2 rounded-lg">
                                    On waitlist{waitStatus.position ? ` • position #${waitStatus.position}` : ''}
                                    {waitStatus.status === 'promoted' ? ' • seat held for you!' : ''}
                                </span>
                                <button
                                    onClick={leaveWaitlist}
                                    disabled={waitBusy}
                                    className="text-[11px] text-red-400 hover:text-red-300 font-bold disabled:opacity-50"
                                >
                                    {waitBusy ? 'Working…' : 'Leave waitlist'}
                                </button>
                            </div>
                        ) : pricing?.waitlistEnabled !== false ? (
                            <button
                                onClick={joinWaitlist}
                                disabled={waitBusy}
                                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-600/15"
                            >
                                {waitBusy ? 'Joining…' : 'Sold Out — Join Waitlist'}
                            </button>
                        ) : (
                            <span className="bg-slate-800 text-slate-400 font-bold px-8 py-3.5 rounded-xl text-sm">Sold Out</span>
                        )}
                    </div>

                    {notice && (
                        <div className="mt-6 p-4 bg-indigo-950/40 border border-indigo-800 text-indigo-300 rounded-xl text-center text-xs font-semibold">
                            {notice}
                        </div>
                    )}

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
                                        <div className="flex flex-col items-center py-4 relative overflow-hidden space-y-3">
                                            <div className="p-3 bg-white rounded-xl shadow-lg border border-indigo-500/20 relative">
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=invitor.official@okaxis&pn=INVITOR%20Events&am=${bookingAmount ?? quote?.total ?? invite.ticketPrice}&tr=${currentBookingId || 'BKG'}&cu=${quote?.currency || 'INR'}`)}`}
                                                    alt="Live UPI QR Code" 
                                                    className="w-36 h-36 object-contain"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400">
                                                <span>invitor.official@okaxis</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('invitor.official@okaxis');
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="text-indigo-400 hover:text-white p-1 rounded"
                                                    title="Copy UPI ID"
                                                >
                                                    <FaCopy size={12} />
                                                </button>
                                            </div>
                                            {copied && <span className="text-[10px] text-emerald-400 font-bold">UPI ID Copied!</span>}

                                            <div className="w-full space-y-2 mt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Your UPI ID / VPA (e.g. name@okaxis)"
                                                    value={userUpiId}
                                                    onChange={(e) => setUserUpiId(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="UTR / 12-digit UPI Reference (Optional)"
                                                    value={upiUtr}
                                                    onChange={(e) => setUpiUtr(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
                                                />
                                            </div>
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

                                    {/* 3. 3D Credit Card Method (Stripe) */}
                                    {selectedPaymentMethod === 'card' && (
                                        <div className="flex flex-col items-center">
                                            <div className="w-full flex justify-end mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCardNumber('4242 4242 4242 4242');
                                                        setCardName(user?.name || 'Jane Doe');
                                                        setCardExpiry('12/28');
                                                        setCardCvv('987');
                                                    }}
                                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                                                >
                                                    Auto-fill Stripe Test Card
                                                </button>
                                            </div>
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
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            Gross Sum{quote?.quantity > 1 ? ` • ${quote.quantity} × ${symbol}${quote.unitPrice}` : ''}
                                        </span>
                                        <span className="text-xl font-black text-white font-mono">
                                            {symbol}{bookingAmount ?? quote?.total ?? invite.ticketPrice}
                                        </span>
                                        {quote?.surge && (
                                            <span className="text-[9px] text-orange-400 font-bold uppercase">includes dynamic surge ×{Number(quote.multiplier).toFixed(2)}</span>
                                        )}
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

                                    <div className="flex items-center justify-between text-[11px] mb-4 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                                        <span className="text-slate-400 font-bold">{quote?.tierName || 'General'} × {quote?.quantity || quantity}</span>
                                        <span className="text-emerald-400 font-black font-mono">{symbol}{bookingAmount ?? quote?.total ?? invite.ticketPrice}</span>
                                    </div>
                                    
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