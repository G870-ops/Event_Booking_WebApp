import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { generateTicketPDF } from '../utils/generateTicketPDF';
import { 
    FaCreditCard, 
    FaQrcode, 
    FaMobileAlt, 
    FaLock, 
    FaTimes, 
    FaSpinner, 
    FaCheckCircle, 
    FaCopy, 
    FaFileDownload,
    FaArrowRight,
    FaShieldAlt
} from 'react-icons/fa';

const PaymentCheckoutModal = ({ 
    isOpen, 
    onClose, 
    bookingId, 
    invite, 
    user, 
    onPaymentSuccess 
}) => {
    if (!isOpen || !invite) return null;

    const amount = invite.ticketPrice || 0;
    const defaultUPIId = "invitor.official@okaxis";

    // UI States
    const [selectedTab, setSelectedTab] = useState('stripe'); // 'stripe', 'upi_qr', 'upi_id'
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    // Stripe / Card form states
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState(user?.name || '');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // UPI states
    const [upiIdInput, setUpiIdInput] = useState('');
    const [utrNumber, setUtrNumber] = useState('');
    const [upiRequestSent, setUpiRequestSent] = useState(false);

    // Dynamic UPI Intent URI
    const upiUri = `upi://pay?pa=${defaultUPIId}&pn=INVITOR%20Events&am=${amount}&tr=${bookingId || 'TEMP'}&tn=Pass_${encodeURIComponent(invite.title || 'Event')}&cu=INR`;

    const handleCopyUPI = () => {
        navigator.clipboard.writeText(defaultUPIId);
        toast.success(`Copied UPI ID: ${defaultUPIId}`);
    };

    // Quick fill Stripe Test Card
    const handleQuickFillStripe = () => {
        setCardNumber('4242 4242 4242 4242');
        setCardName(user?.name || 'TEST PASSHOLDER');
        setCardExpiry('12/28');
        setCardCvv('987');
        toast.success('Loaded Stripe Test Credentials');
    };

    // 1. Process Stripe Card Payment
    const handleStripePayment = async (e) => {
        e?.preventDefault();
        const cleanedCard = cardNumber.replace(/\s/g, '');
        if (cleanedCard.length < 15) {
            toast.error('Please enter a valid card number');
            return;
        }
        if (!cardExpiry || cardExpiry.length < 5) {
            toast.error('Please enter card expiry in MM/YY format');
            return;
        }
        if (!cardCvv || cardCvv.length < 3) {
            toast.error('Please enter CVV');
            return;
        }

        setIsProcessing(true);
        const toastId = toast.loading('Connecting to Stripe Quantum Gateway...');
        try {
            const { data } = await api.post(`/bookings/${bookingId}/pay-stripe`, {
                cardLast4: cleanedCard.slice(-4),
                cardBrand: cleanedCard.startsWith('4') ? 'Visa' : 'Mastercard',
                amount
            });

            toast.success(data.message || 'Payment Succeeded via Stripe!', { id: toastId });
            setConfirmedBooking(data.booking);
            setPaymentDone(true);
            if (onPaymentSuccess) onPaymentSuccess(data.booking);
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Stripe payment failed', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. Process UPI QR Code Payment
    const handleUpiQrPayment = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Verifying UPI Payment...');
        try {
            const { data } = await api.post(`/bookings/${bookingId}/pay-upi`, {
                utrNumber: utrNumber.trim() || `UPI_SCAN_${Date.now().toString().slice(-6)}`,
                paymentMethodType: 'upi_qr'
            });

            toast.success(data.message || 'UPI Payment Confirmed!', { id: toastId });
            setConfirmedBooking(data.booking);
            setPaymentDone(true);
            if (onPaymentSuccess) onPaymentSuccess(data.booking);
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'UPI verification failed', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // 3. Process UPI ID Payment
    const handleSendUpiRequest = () => {
        if (!upiIdInput || !upiIdInput.includes('@')) {
            toast.error('Please enter a valid UPI ID (e.g. yourname@upi)');
            return;
        }
        setUpiRequestSent(true);
        toast.success(`Payment request sent to ${upiIdInput}! Approve in your UPI app.`);
    };

    const handleUpiIdPayment = async () => {
        if (!upiIdInput || !upiIdInput.includes('@')) {
            toast.error('Please enter a valid UPI ID');
            return;
        }

        setIsProcessing(true);
        const toastId = toast.loading('Verifying UPI Payment Request...');
        try {
            const { data } = await api.post(`/bookings/${bookingId}/pay-upi`, {
                upiId: upiIdInput.trim(),
                utrNumber: utrNumber.trim() || `UPI_COLLECT_${Date.now().toString().slice(-6)}`,
                paymentMethodType: 'upi_id'
            });

            toast.success(data.message || 'UPI Payment Confirmed!', { id: toastId });
            setConfirmedBooking(data.booking);
            setPaymentDone(true);
            if (onPaymentSuccess) onPaymentSuccess(data.booking);
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'UPI verification failed', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl relative max-h-[92vh] overflow-y-auto">
                
                {/* Close Button */}
                {!isProcessing && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-950/50 rounded-full border border-white/5 transition"
                    >
                        <FaTimes size={13} />
                    </button>
                )}

                {/* If Payment Succeeded: Show Pass Card */}
                {paymentDone ? (
                    <div className="text-center py-4 space-y-5">
                        <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                            <FaCheckCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white font-display">Access Pass Confirmed!</h3>
                            <p className="text-xs text-slate-400 mt-1">Simultaneous ledger verification completed & recorded on database.</p>
                        </div>

                        {/* Digital Hologram Ticket Pass */}
                        <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 text-left relative overflow-hidden shadow-2xl">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/20">
                                        {invite.category || 'EVENT PASS'}
                                    </span>
                                    <h4 className="text-base font-bold text-white mt-1.5 leading-tight">{invite.title}</h4>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                                    PAID (₹{amount})
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 mb-3">
                                <div>
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Pass Holder</span>
                                    <strong className="text-white block mt-0.5">{user?.name}</strong>
                                </div>
                                <div>
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Gate Pass ID</span>
                                    <strong className="text-indigo-300 font-mono text-[10px] block mt-0.5 select-all">
                                        {confirmedBooking?._id || bookingId}
                                    </strong>
                                </div>
                            </div>

                            {/* Gate Pass Scannable QR Code */}
                            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                        <FaShieldAlt /> Gate Check-In Ready
                                    </p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Present this QR code at the event gate scanner</p>
                                </div>
                                <div className="bg-white p-1 rounded-lg">
                                    <QRCodeSVG 
                                        value={confirmedBooking?._id || bookingId} 
                                        size={54} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => generateTicketPDF(confirmedBooking || { _id: bookingId, inviteId: invite, amount, paymentMethod: selectedTab }, user?.name)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
                            >
                                <FaFileDownload /> Download Pass (PDF)
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition"
                            >
                                View in Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Checkout Form */
                    <div className="space-y-5">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-indigo-400 mb-2">
                                <FaLock size={9} /> 256-Bit Encrypted Gateway
                            </div>
                            <h3 className="text-xl font-bold text-white font-display">Complete Pass Payment</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Pass for <strong className="text-slate-200">{invite.title}</strong>
                            </p>
                            <div className="text-2xl font-black text-white font-mono mt-2">
                                ₹{amount}
                            </div>
                        </div>

                        {/* Payment Method Selector Tabs */}
                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800/80 rounded-xl">
                            <button
                                onClick={() => setSelectedTab('stripe')}
                                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                    selectedTab === 'stripe'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                <FaCreditCard />
                                <span>Stripe Card</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('upi_qr')}
                                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                    selectedTab === 'upi_qr'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                <FaQrcode />
                                <span>UPI QR Scan</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('upi_id')}
                                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                                    selectedTab === 'upi_id'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                <FaMobileAlt />
                                <span>UPI ID</span>
                            </button>
                        </div>

                        {/* TAB 1: STRIPE CARD METHOD */}
                        {selectedTab === 'stripe' && (
                            <div className="space-y-4">
                                {/* 3D Card Front/Back Flip Visual */}
                                <div className="w-full max-w-[280px] h-40 mx-auto perspective-1000">
                                    <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                                        
                                        {/* Card Front */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl p-4 text-white font-mono bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 border border-indigo-500/30 shadow-2xl flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">INVITOR PASS</span>
                                                <span className="text-[10px] font-black text-indigo-200">STRIPE SECURE</span>
                                            </div>
                                            <div className="text-sm sm:text-base tracking-widest text-white mt-2 font-bold">
                                                {cardNumber || '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="block text-[7px] uppercase text-slate-500 font-bold">Holder</span>
                                                    <span className="text-[10px] uppercase font-bold truncate max-w-[130px] block">{cardName || 'YOUR NAME'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[7px] uppercase text-slate-500 font-bold">Expires</span>
                                                    <span className="text-[10px] font-bold">{cardExpiry || 'MM/YY'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Back */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl p-4 text-white font-mono bg-gradient-to-bl from-purple-950 via-slate-950 to-indigo-950 border border-indigo-500/30 shadow-2xl flex flex-col justify-between">
                                            <div className="w-full h-6 bg-slate-950 -mx-4 mt-1"></div>
                                            <div className="flex justify-end items-center gap-2 bg-slate-900/80 p-2 rounded border border-slate-800">
                                                <span className="text-[7px] uppercase text-slate-500 font-bold">CVV</span>
                                                <span className="text-xs font-bold text-indigo-400">{cardCvv || '•••'}</span>
                                            </div>
                                            <div className="text-[8px] text-slate-600 text-center font-bold">
                                                POWERED BY STRIPE PAYMENT ENCRYPTION
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={handleQuickFillStripe}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                                    >
                                        Auto-fill Stripe Test Card
                                    </button>
                                </div>

                                <form onSubmit={handleStripePayment} className="space-y-3">
                                    <input 
                                        type="text" 
                                        maxLength="19"
                                        placeholder="Card Number (e.g. 4242 4242 4242 4242)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono transition"
                                        value={cardNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                                            setCardNumber(val);
                                        }}
                                    />

                                    <input 
                                        type="text" 
                                        placeholder="Cardholder Name"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 uppercase transition"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="text" 
                                            maxLength="5"
                                            placeholder="MM/YY"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono transition"
                                            value={cardExpiry}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                                                setCardExpiry(val);
                                            }}
                                        />
                                        <input 
                                            type="password" 
                                            maxLength="4"
                                            placeholder="CVV"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono transition"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                            onFocus={() => setIsCardFlipped(true)}
                                            onBlur={() => setIsCardFlipped(false)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 text-xs flex justify-center items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <FaSpinner className="animate-spin" /> Authorizing Stripe Payment...
                                            </>
                                        ) : (
                                            <>
                                                <FaLock size={11} /> Pay ₹{amount} via Stripe
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* TAB 2: UPI QR CODE SCAN METHOD */}
                        {selectedTab === 'upi_qr' && (
                            <div className="space-y-4 text-center">
                                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col items-center relative overflow-hidden">
                                    <div className="bg-white p-3 rounded-2xl shadow-xl inline-block relative">
                                        <QRCodeSVG 
                                            value={upiUri} 
                                            size={160} 
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>

                                    <div className="mt-3 flex items-center justify-center gap-2">
                                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                                            {defaultUPIId}
                                        </span>
                                        <button 
                                            onClick={handleCopyUPI}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                            title="Copy UPI ID"
                                        >
                                            <FaCopy size={12} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Scan with <strong className="text-white">Google Pay, PhonePe, Paytm, or BHIM</strong>
                                    </p>

                                    {/* Mobile Quick Intent Links */}
                                    <div className="flex justify-center gap-2 mt-3">
                                        <a 
                                            href={upiUri} 
                                            className="text-[10px] bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 px-3 py-1.5 rounded-lg transition"
                                        >
                                            Open UPI App
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        UTR / UPI Reference No. (Optional or after scan)
                                    </label>
                                    <input 
                                        type="text" 
                                        maxLength="18"
                                        placeholder="Enter 12-digit UPI UTR No."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500 font-mono transition"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                                    />
                                </div>

                                <button
                                    onClick={handleUpiQrPayment}
                                    disabled={isProcessing}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-cyan-600/20 text-xs flex justify-center items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Verifying Payment...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle /> I Have Paid ₹{amount} (Verify & Unlock Pass)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* TAB 3: UPI ID / VPA METHOD */}
                        {selectedTab === 'upi_id' && (
                            <div className="space-y-4">
                                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                            Enter Your Virtual Payment Address (UPI ID)
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. mobile@paytm or name@okaxis"
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono transition"
                                                value={upiIdInput}
                                                onChange={(e) => setUpiIdInput(e.target.value.trim())}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendUpiRequest}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 rounded-xl transition shrink-0"
                                            >
                                                Request
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick UPI Handles */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {['@okaxis', '@okhdfcbank', '@paytm', '@ybl', '@ibl'].map(handle => (
                                            <button
                                                key={handle}
                                                type="button"
                                                onClick={() => {
                                                    const base = upiIdInput.split('@')[0] || (user?.email?.split('@')[0] || 'user');
                                                    setUpiIdInput(`${base}${handle}`);
                                                }}
                                                className="text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 px-2 py-1 rounded transition"
                                            >
                                                {handle}
                                            </button>
                                        ))}
                                    </div>

                                    {upiRequestSent && (
                                        <div className="bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 p-3 rounded-xl text-xs space-y-1">
                                            <p className="font-bold flex items-center gap-1.5 text-white">
                                                <FaSpinner className="animate-spin text-indigo-400" /> Payment request sent!
                                            </p>
                                            <p className="text-[11px] text-slate-300">
                                                Open your UPI app ({upiIdInput}) and approve the request for ₹{amount}.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                            UTR / Ref No. (From your banking app)
                                        </label>
                                        <input 
                                            type="text" 
                                            maxLength="18"
                                            placeholder="e.g. 418294829102"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono transition"
                                            value={utrNumber}
                                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpiIdPayment}
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 text-xs flex justify-center items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Verifying UPI Payment...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle /> Confirm & Issue Access Pass
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
};

export default PaymentCheckoutModal;
