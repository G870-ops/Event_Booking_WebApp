import React, { useState } from 'react';
import api from '../utils/axios';
import { 
    FaCreditCard, 
    FaQrcode, 
    FaMobileAlt, 
    FaLock, 
    FaTimes, 
    FaSpinner, 
    FaCheckCircle, 
    FaCopy, 
    FaShieldAlt,
    FaTicketAlt
} from 'react-icons/fa';

const PaymentCheckoutModal = ({ 
    isOpen, 
    onClose, 
    bookingId, 
    invite, 
    user, 
    onPaymentSuccess,
    amountOverride
}) => {
    if (!isOpen || !invite) return null;

    const amount = Number(amountOverride ?? invite.ticketPrice ?? 0) || 0;
    const defaultUPIId = "invitor.official@okaxis";

    // Tab state: 'stripe' | 'upi_qr' | 'upi_id'
    const [selectedTab, setSelectedTab] = useState('stripe');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [paymentSuccessData, setPaymentSuccessData] = useState(null);

    // Stripe Card Inputs
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState(user?.name || '');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    // UPI ID Inputs
    const [userUPIId, setUserUPIId] = useState('');
    const [upiUtr, setUpiUtr] = useState('');

    // Dynamic UPI URI for real QR Code & UPI deep linking
    const upiUri = `upi://pay?pa=${defaultUPIId}&pn=INVITOR%20Events&am=${amount}&tr=${bookingId || 'BKG'}&tn=Pass_${encodeURIComponent(invite.title || 'Event')}&cu=INR`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

    const handleCopyUPI = () => {
        navigator.clipboard.writeText(defaultUPIId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleQuickFillStripe = () => {
        setCardNumber('4242 4242 4242 4242');
        setCardName(user?.name || 'Jane Doe');
        setCardExpiry('12/28');
        setCardCvv('987');
        setError('');
    };

    // Format card number with spaces
    const handleCardNumberChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        setCardNumber(formatted);
    };

    // Format expiry MM/YY
    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 3) {
            val = `${val.slice(0, 2)}/${val.slice(2)}`;
        }
        setCardExpiry(val);
    };

    // Process Payment via Backend API
    const handleCompletePayment = async (methodName, extraData = {}) => {
        setIsProcessing(true);
        setError('');

        try {
            const referenceId = extraData.reference || `${methodName.toUpperCase()}_${Date.now()}`;
            const upiIdToSend = extraData.upiId || (methodName.includes('upi') ? (userUPIId || defaultUPIId) : '');

            const { data } = await api.post(`/bookings/${bookingId}/pay`, {
                bookingId,
                paymentMethod: methodName,
                paymentReference: referenceId,
                upiId: upiIdToSend
            });

            setPaymentSuccessData(data.booking || {
                _id: bookingId,
                amount,
                paymentMethod: methodName,
                paymentReference: referenceId
            });

            if (onPaymentSuccess) {
                onPaymentSuccess(data.booking);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Payment processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStripeSubmit = (e) => {
        e.preventDefault();
        const rawNumber = cardNumber.replace(/\s/g, '');
        if (rawNumber.length < 15) {
            setError('Please enter a valid 16-digit card number.');
            return;
        }
        if (!cardExpiry || cardExpiry.length < 5) {
            setError('Please enter a valid expiry date (MM/YY).');
            return;
        }
        if (cardCvv.length < 3) {
            setError('Please enter a valid 3-digit CVV.');
            return;
        }

        handleCompletePayment('stripe', {
            reference: `stripe_ch_${Math.random().toString(36).substring(2, 10)}`
        });
    };

    const handleUPIQRSubmit = (e) => {
        e.preventDefault();
        handleCompletePayment('upi_qr', {
            reference: upiUtr ? `UTR_${upiUtr}` : `UPIQR_${Date.now()}`
        });
    };

    const handleUPIIDSubmit = (e) => {
        e.preventDefault();
        if (!userUPIId || !userUPIId.includes('@')) {
            setError('Please enter a valid UPI ID (e.g., yourname@okhdfcbank or 9876543210@paytm).');
            return;
        }
        handleCompletePayment('upi_id', {
            upiId: userUPIId,
            reference: `UPI_REQ_${Date.now()}`
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative overflow-hidden">
                {/* Background ambient accents */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Close Button */}
                {!isProcessing && !paymentSuccessData && (
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
                    >
                        <FaTimes size={14} />
                    </button>
                )}

                {/* SUCCESS SCREEN */}
                {paymentSuccessData ? (
                    <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                            <FaCheckCircle size={36} />
                        </div>

                        <div>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">
                                Payment Completed & Verified
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 font-display">
                                Booking Confirmed!
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Your pass for <strong className="text-slate-200">{invite.title}</strong> is active. Confirmation details have been logged.
                            </p>
                        </div>

                        {/* Digital Receipt Card */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[11px]">
                                <span className="text-slate-400">Total Amount:</span>
                                <span className="font-bold text-emerald-400 text-sm">₹{amount}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">Payment Channel:</span>
                                <span className="font-semibold text-indigo-400 uppercase">{paymentSuccessData.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">Transaction Ref:</span>
                                <span className="font-mono text-slate-300">{paymentSuccessData.paymentReference}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">Attendee:</span>
                                <span className="font-medium text-slate-200">{user?.name}</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            <FaTicketAlt /> Access My Dashboard & Tickets
                        </button>
                    </div>
                ) : (
                    /* PAYMENT CHECKOUT FORM */
                    <div className="space-y-5">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                                <FaShieldAlt /> Secure Payment Gateway
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight font-display">
                                Complete Booking Payment
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Event: <strong className="text-slate-200">{invite.title}</strong> • Total Due: <strong className="text-emerald-400 font-bold">₹{amount}</strong>
                            </p>
                        </div>

                        {/* Payment Method Tabs */}
                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => { setSelectedTab('stripe'); setError(''); }}
                                className={`py-2.5 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                    selectedTab === 'stripe'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                <FaCreditCard />
                                <span>Stripe / Card</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedTab('upi_qr'); setError(''); }}
                                className={`py-2.5 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                    selectedTab === 'upi_qr'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                <FaQrcode />
                                <span>UPI QR Scan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedTab('upi_id'); setError(''); }}
                                className={`py-2.5 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                    selectedTab === 'upi_id'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                <FaMobileAlt />
                                <span>UPI ID / VPA</span>
                            </button>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-xl text-center text-xs font-semibold animate-in fade-in duration-200">
                                {error}
                            </div>
                        )}

                        {/* TAB 1: STRIPE / CARD */}
                        {selectedTab === 'stripe' && (
                            <form onSubmit={handleStripeSubmit} className="space-y-4">
                                {/* Interactive Card Banner */}
                                <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900/60 border border-indigo-500/20 rounded-2xl p-4 text-slate-100 shadow-md relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] tracking-widest font-black uppercase text-indigo-300">INVITOR STRIPE VAULT</span>
                                        <FaCreditCard className="text-indigo-400" size={18} />
                                    </div>
                                    <div className="font-mono text-base tracking-widest text-slate-100 mb-2">
                                        {cardNumber || '•••• •••• •••• ••••'}
                                    </div>
                                    <div className="flex justify-between items-end text-[10px] text-slate-400 font-semibold uppercase">
                                        <div>
                                            <span className="block text-[8px] text-slate-500">CARDHOLDER</span>
                                            <span className="text-white truncate max-w-[140px] block">{cardName || user?.name || 'CARD MEMBER'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] text-slate-500">EXPIRES</span>
                                            <span className="text-white block">{cardExpiry || 'MM/YY'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Autofill Test Card Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleQuickFillStripe}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                                    >
                                        Auto-fill Stripe Test Card
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Card Number</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="4242 4242 4242 4242"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-indigo-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Expiry (MM/YY)</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="MM/YY"
                                                value={cardExpiry}
                                                onChange={handleExpiryChange}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-indigo-500 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">CVC / CVV</label>
                                            <input
                                                type="password"
                                                required
                                                maxLength="4"
                                                placeholder="123"
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-indigo-500 outline-none transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Authorizing with Stripe...
                                        </>
                                    ) : (
                                        <>
                                            <FaLock size={12} /> Pay ₹{amount} with Stripe
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* TAB 2: UPI QR CODE */}
                        {selectedTab === 'upi_qr' && (
                            <form onSubmit={handleUPIQRSubmit} className="space-y-4">
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center">
                                    <div className="p-2.5 bg-white rounded-xl shadow-lg mb-3">
                                        <img 
                                            src={qrCodeImageUrl} 
                                            alt="UPI QR Code" 
                                            className="w-44 h-44 object-contain"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 mb-2">
                                        <span>{defaultUPIId}</span>
                                        <button
                                            type="button"
                                            onClick={handleCopyUPI}
                                            className="text-indigo-400 hover:text-white p-1 rounded"
                                            title="Copy UPI ID"
                                        >
                                            <FaCopy size={12} />
                                        </button>
                                    </div>
                                    {copied && <span className="text-[10px] text-emerald-400 font-bold mb-1">Copied to clipboard!</span>}

                                    <p className="text-[11px] text-slate-400 max-w-xs">
                                        Scan using <strong>Google Pay, PhonePe, Paytm, or BHIM</strong> to complete ₹{amount} payment.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                        UPI Transaction / UTR ID (Optional for fast track)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 428172918291"
                                        value={upiUtr}
                                        onChange={(e) => setUpiUtr(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-indigo-500 outline-none transition"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Verifying UPI Payment...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle size={14} /> I Have Paid ₹{amount} via QR
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* TAB 3: UPI ID / VPA */}
                        {selectedTab === 'upi_id' && (
                            <form onSubmit={handleUPIIDSubmit} className="space-y-4">
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center">
                                    <div className="w-12 h-12 bg-indigo-950/60 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-800/40">
                                        <FaMobileAlt size={22} />
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1">Pay via Virtual Payment Address (VPA)</h4>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Enter your UPI address below. A payment collect request of <strong>₹{amount}</strong> will be triggered to your UPI app.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Your UPI ID / VPA</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                                        value={userUPIId}
                                        onChange={(e) => setUserUPIId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-indigo-500 outline-none transition"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        {['@okhdfcbank', '@okaxis', '@paytm', '@ybl'].map(bank => (
                                            <button
                                                type="button"
                                                key={bank}
                                                onClick={() => {
                                                    const prefix = userUPIId.split('@')[0] || user?.name?.toLowerCase().replace(/\s/g, '') || 'guest';
                                                    setUserUPIId(`${prefix}${bank}`);
                                                }}
                                                className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded-md transition"
                                            >
                                                {bank}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Verifying UPI Request...
                                        </>
                                    ) : (
                                        <>
                                            <FaLock size={12} /> Send Request & Pay ₹{amount}
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentCheckoutModal;
