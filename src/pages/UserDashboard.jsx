import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaTicketAlt, FaTimesCircle, FaBolt, FaTimes, FaPrint, FaShieldAlt,
    FaCalendarPlus, FaExternalLinkAlt, FaUndo, FaHourglassHalf, FaGem, FaCheckCircle, FaSpinner
} from 'react-icons/fa';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';

const RefundModal = ({ booking, onClose, onDone }) => {
    const [quote, setQuote] = useState(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/refunds/quote/${booking._id}`);
                setQuote(data);
            } catch (err) {
                setError(err.response?.data?.error || 'Could not evaluate refund eligibility');
            }
        })();
    }, [booking._id]);

    const submit = async () => {
        setBusy(true);
        setError('');
        try {
            const { data } = await api.post(`/refunds/${booking._id}`, { reason });
            setResult(data);
            onDone();
        } catch (err) {
            setError(err.response?.data?.error || 'Refund request failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-extrabold text-gray-900">Refund — {booking.inviteId?.title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-1"><FaTimes size={14} /></button>
                </div>

                {result ? (
                    <div className="text-center py-4">
                        <FaCheckCircle className="text-green-500 mx-auto mb-3" size={36} />
                        <p className="font-bold text-gray-900">{result.message}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            ₹{result.refund?.amount} • Ref {result.refund?.reference}
                        </p>
                        <button onClick={onClose} className="mt-5 w-full bg-gray-900 text-white font-bold py-2.5 rounded-lg">Done</button>
                    </div>
                ) : !quote ? (
                    <div className="py-8 text-center text-sm text-gray-500">{error || 'Evaluating refund policy…'}</div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm space-y-2">
                            <p className="flex justify-between"><span className="text-gray-500">Paid amount</span><b>₹{quote.booking?.amount}</b></p>
                            <p className="flex justify-between"><span className="text-gray-500">Policy</span><b className="uppercase">{quote.policy?.mode}</b></p>
                            {quote.eligible ? (
                                <>
                                    <p className="flex justify-between"><span className="text-gray-500">Processing fee ({quote.feePercent}%)</span><b className="text-orange-600">-₹{quote.feeAmount}</b></p>
                                    <p className="flex justify-between border-t border-gray-200 pt-2"><span className="font-bold">You receive</span><b className="text-green-600 text-lg">₹{quote.amount}</b></p>
                                </>
                            ) : (
                                <p className="text-red-500 font-semibold">{quote.reason}</p>
                            )}
                        </div>

                        {quote.eligible && !quote.hasOpenRefund && (
                            <>
                                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                                    placeholder="Reason (optional)"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-700 resize-none" />
                                {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
                                <button onClick={submit} disabled={busy}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                                    {busy ? <FaSpinner className="animate-spin" /> : <FaShieldAlt />} Refund ₹{quote.amount}
                                </button>
                            </>
                        )}
                        {quote.hasOpenRefund && <p className="text-xs text-amber-600 font-semibold text-center">A refund is already in progress for this booking.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const { themeConfig } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
    const [viewingPass, setViewingPass] = useState(null);
    const [refundBooking, setRefundBooking] = useState(null);
    const [calendarLinks, setCalendarLinks] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const colors = [
        '#f3f4f6', // Premium Light gray
        '#ecfdf5', // Premium Soft emerald
        '#eff6ff', // Premium Soft blue
        '#fdf2f8', // Premium Soft pink
        '#faf5ff', // Premium Soft purple
        '#fff7ed', // Premium Soft orange
        '#f0fdfa', // Premium Soft teal
        '#fefaf0'  // Premium Soft warm amber
    ];

    const [bgColorIndex, setBgColorIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const currentBgColor = colors[bgColorIndex];

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBookings();
        fetchWaitlist();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWaitlist = async () => {
        try {
            const { data } = await api.get('/waitlist/my');
            setWaitlist(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching waitlist', error);
        }
    };

    const leaveWaitlist = async (eventId) => {
        if (!window.confirm('Leave this waitlist? You will lose your position.')) return;
        try {
            await api.delete(`/waitlist/${eventId}`);
            fetchWaitlist();
        } catch (error) {
            alert(error.response?.data?.error || 'Could not leave waitlist');
        }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchBookings();
                fetchWaitlist();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    const openPass = async (booking) => {
        setViewingPass(booking);
        setCalendarLinks(null);
        setVerifyResult(null);
        try {
            const { data } = await api.get(`/automation/calendar/invite/${booking.inviteId?._id}/links`);
            setCalendarLinks(data);
        } catch (err) {
            console.error('Calendar links failed', err);
        }
    };

    const verifyTicket = async () => {
        if (!viewingPass) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const { data } = await api.get(`/ticketing/tickets/${viewingPass._id}/verify`);
            setVerifyResult(data);
        } catch (err) {
            setVerifyResult({ valid: false, reason: err.response?.data?.error || 'Verification failed' });
        } finally {
            setVerifying(false);
        }
    };

    const downloadIcs = (url) => {
        const token = localStorage.getItem('token');
        fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(res => res.text())
            .then(text => {
                const blob = new Blob([text], { type: 'text/calendar' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = url.includes('booking') ? 'pass.ics' : 'event.ics';
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(() => window.open(url, '_blank'));
    };

    const statusBadge = (status) =>
        status === 'confirmed' ? 'bg-green-100 text-green-700'
            : status === 'cancelled' ? 'bg-red-100 text-red-700'
                : status === 'refunded' ? 'bg-purple-100 text-purple-700'
                    : 'bg-yellow-100 text-yellow-700';

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading dashboard...</div>;

    return (
        <div 
            className="min-h-screen transition-colors duration-1000" 
            style={{ backgroundColor: themeConfig?.type === 'default' ? currentBgColor : 'transparent' }}
        >
        <div 
            className="max-w-6xl mx-auto rounded-3xl p-6 sm:p-8 transition-colors duration-1000 py-8 px-4 sm:px-6"
        >
            {/* Header User Profile Banner */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                <div className="w-20 h-20 bg-gray-900 text-white rounded-full flex items-center justify-center text-3xl font-bold uppercase tracking-widest shrink-0 shadow-md">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Welcome, {user?.name}!</h1>
                    <p className="text-gray-500 text-sm mb-2">{user?.email || user?.mobile}</p>
                    <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified User Account
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <FaTicketAlt className="text-gray-700" /> My Event Passes & Bookings
                </h2>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-700 border border-gray-200 shadow-sm">
                    {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTicketAlt className="text-gray-300 text-3xl" />
                    </div>
                    <p className="text-xl text-gray-500 mb-6 mt-4 font-medium">You haven't booked any invites yet.</p>
                    <Link to="/" className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition shadow-md">
                        Browse Invites
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => {
                        const inactive = ['cancelled', 'refunded'].includes(booking.status);
                        return (
                        <div key={booking._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col justify-between">
                            <div className="p-6 border-b border-gray-50 flex-grow">
                                {booking.inviteId ? (
                                    <>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                                                {booking.inviteId.title}
                                            </h3>
                                            <div className="flex flex-col gap-1 items-end shrink-0 ml-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${statusBadge(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                                {!inactive && (
                                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                                                        booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500 mb-4 space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Date:</span>
                                                <span className="font-semibold text-gray-800">{new Date(booking.inviteId.date).toLocaleDateString()}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Location:</span>
                                                <span className="font-semibold text-gray-800">{booking.inviteId.location}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Amount:</span>
                                                <span className="font-bold text-gray-900">{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</span>
                                            </p>
                                            {booking.quantity > 1 && (
                                                <p className="flex justify-between">
                                                    <span className="text-gray-500 font-medium">Tickets:</span>
                                                    <span className="font-bold text-gray-900">{booking.quantity} × {booking.tierName || 'General'}</span>
                                                </p>
                                            )}
                                            {booking.checkedIn && (
                                                <p className="flex justify-between">
                                                    <span className="text-gray-500 font-medium">Checked in:</span>
                                                    <span className="font-bold text-green-600">{new Date(booking.checkedInAt).toLocaleString()}</span>
                                                </p>
                                            )}
                                            {booking.paymentMethod && booking.paymentMethod !== 'free' && (
                                                <p className="flex justify-between">
                                                    <span className="text-gray-500 font-medium">Channel:</span>
                                                    <span className="font-bold text-indigo-600 uppercase text-[10px]">{booking.paymentMethod}</span>
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-500 italic text-sm">Invite details unavailable</p>
                                )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 bg-gray-50 flex flex-wrap justify-between items-center gap-2 border-t border-gray-100">
                                {booking.inviteId && !inactive ? (
                                    <>
                                        {/* Pay Now Button if Unpaid */}
                                        {booking.paymentStatus !== 'paid' && booking.amount > 0 ? (
                                            <button
                                                onClick={() => setSelectedBookingForPayment(booking)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
                                            >
                                                <FaBolt /> Pay ₹{booking.amount} Now
                                            </button>
                                        ) : (
                                            /* View Pass Button if Confirmed/Paid */
                                            <button
                                                onClick={() => openPass(booking)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
                                            >
                                                <FaTicketAlt /> View Digital Pass
                                            </button>
                                        )}

                                        <div className="flex items-center gap-3">
                                            {booking.status === 'confirmed' && (
                                                <Link
                                                    to={`/events/${booking.inviteId._id}/hub`}
                                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs hover:underline flex items-center gap-1"
                                                    title="Live hub: stream, chat, floor map, networking"
                                                >
                                                    <FaExternalLinkAlt size={9} /> Hub
                                                </Link>
                                            )}
                                            <Link 
                                                to={`/invites/${booking.inviteId._id}`} 
                                                className="text-gray-700 hover:text-gray-900 font-semibold text-xs hover:underline"
                                            >
                                                Details
                                            </Link>
                                            {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && booking.amount > 0 && (
                                                <button
                                                    onClick={() => setRefundBooking(booking)}
                                                    className="text-orange-600 hover:text-orange-800 font-semibold text-xs transition flex items-center gap-1"
                                                    title="Request refund"
                                                >
                                                    <FaShieldAlt size={10} /> Refund
                                                </button>
                                            )}
                                            <button
                                                onClick={() => cancelBooking(booking._id)}
                                                className="text-red-500 hover:text-red-700 font-semibold text-xs transition flex items-center gap-1"
                                                title="Cancel Booking"
                                            >
                                                <FaTimesCircle /> Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full text-center text-xs text-gray-500 italic py-1">
                                        {booking.status === 'refunded' ? 'Refunded — amount returned to source' : 'Booking Cancelled'}
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* WAITLIST */}
            {waitlist.length > 0 && (
                <div className="mt-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <FaHourglassHalf className="text-amber-500" /> My Waitlists
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {waitlist.map(row => (
                            <div key={row._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{row.event?.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {row.event?.date ? new Date(row.event.date).toLocaleString() : ''} • {row.quantity} seat{row.quantity > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {row.status === 'waiting' && (
                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                            #{row.position} • {row.seatsAhead} ahead
                                        </span>
                                    )}
                                    {row.status === 'promoted' && (
                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                            Seat held{row.holdExpiresAt ? ` until ${new Date(row.holdExpiresAt).toLocaleTimeString()}` : ''}
                                        </span>
                                    )}
                                    <Link to={`/invites/${row.event?._id}`}
                                        className="text-indigo-600 hover:text-indigo-800 text-xs font-bold">Event</Link>
                                    {['waiting', 'promoted'].includes(row.status) && (
                                        <button onClick={() => leaveWaitlist(row.event?._id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1">
                                            <FaUndo size={9} /> Leave
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL (Stripe / UPI QR / UPI ID) */}
            {selectedBookingForPayment && (
                <PaymentCheckoutModal
                    isOpen={!!selectedBookingForPayment}
                    onClose={() => setSelectedBookingForPayment(null)}
                    bookingId={selectedBookingForPayment._id}
                    invite={selectedBookingForPayment.inviteId}
                    user={user}
                    amountOverride={selectedBookingForPayment.amount}
                    onPaymentSuccess={() => {
                        fetchBookings();
                        setSelectedBookingForPayment(null);
                    }}
                />
            )}

            {/* REFUND MODAL */}
            {refundBooking && (
                <RefundModal
                    booking={refundBooking}
                    onClose={() => setRefundBooking(null)}
                    onDone={fetchBookings}
                />
            )}

            {/* DIGITAL PASS MODAL */}
            {viewingPass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
                        <button
                            onClick={() => setViewingPass(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 transition z-10"
                        >
                            <FaTimes size={14} />
                        </button>

                        <div className="text-center mb-6">
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">
                                Verified Access Pass
                            </span>
                            <h3 className="text-xl font-bold text-white mt-2 font-display">{viewingPass.inviteId?.title}</h3>
                            <p className="text-xs text-slate-400">{viewingPass.inviteId?.location}</p>
                        </div>

                        {/* Ticket card */}
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase block">Attendee</span>
                                    <span className="font-bold text-white text-sm">{user?.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-500 uppercase block">Date</span>
                                    <span className="font-semibold text-slate-200">{new Date(viewingPass.inviteId?.date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase block">Pass Tier / Price</span>
                                    <span className="font-bold text-emerald-400">
                                        {viewingPass.tierName ? `${viewingPass.tierName} • ` : ''}
                                        {viewingPass.amount === 0 ? 'FREE ENTRY' : `₹${viewingPass.amount}`}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-500 uppercase block">Status</span>
                                    <span className="font-bold text-emerald-400 uppercase">{viewingPass.paymentStatus}</span>
                                </div>
                            </div>

                            {viewingPass.checkedIn && (
                                <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-3 py-2 text-[11px] font-bold text-emerald-300 text-center">
                                    ✓ Checked in {viewingPass.checkInMethod ? `via ${viewingPass.checkInMethod}` : ''} • {viewingPass.checkedInAt ? new Date(viewingPass.checkedInAt).toLocaleString() : ''}
                                </div>
                            )}

                            {/* Live Verification QR Code */}
                            <div className="pt-2 flex flex-col items-center">
                                <div className="p-2 bg-white rounded-xl shadow-md">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(viewingPass.qrToken || `INVITOR_GATEPASS_${viewingPass._id}`)}`} 
                                        alt="Ticket QR" 
                                        className="w-32 h-32 object-contain"
                                    />
                                </div>
                                <span className="font-mono text-[9px] text-slate-500 tracking-widest mt-2 uppercase break-all text-center">
                                    {viewingPass.qrToken || `GATEPASS-${viewingPass._id.substring(18)}`}
                                </span>
                                {viewingPass.rfidCode && (
                                    <span className="font-mono text-[9px] text-indigo-400 mt-1">RFID: {viewingPass.rfidCode}</span>
                                )}
                            </div>
                        </div>

                        {/* NFT pass + verification */}
                        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                <FaGem size={10} className="text-indigo-400" /> Soulbound ticket NFT
                            </p>
                            {viewingPass.nft?.minted ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Token</span>
                                        <span className="font-mono text-indigo-300 break-all text-right">{viewingPass.nft.tokenId}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Contract</span>
                                        <span className="font-mono text-slate-400 break-all text-right">{viewingPass.nft.contract || 'INVITOR-PASS'}</span>
                                    </div>
                                    <button onClick={verifyTicket} disabled={verifying}
                                        className="w-full mt-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                                        {verifying ? <FaSpinner className="animate-spin" /> : <FaShieldAlt />} Verify authenticity
                                    </button>
                                    {verifyResult && (
                                        <div className={`text-[11px] font-semibold rounded-xl px-3 py-2 border ${verifyResult.valid
                                            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                                            : 'bg-red-950/50 border-red-800 text-red-300'}`}>
                                            {verifyResult.valid
                                                ? `✓ Authentic • ${verifyResult.chainName || 'Invitor Chain'} • ${verifyResult.reason || 'verified'}`
                                                : `✗ ${verifyResult.reason || 'Not verifiable'}`}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-500">This pass will be minted when the booking is confirmed.</p>
                            )}
                        </div>

                        {/* Calendar sync */}
                        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                                <FaCalendarPlus size={10} className="text-amber-400" /> Add to calendar
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <a href={calendarLinks?.google || '#'} target="_blank" rel="noreferrer"
                                    className={`py-2 rounded-lg text-[10px] font-bold text-center border transition ${calendarLinks?.google ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-800 text-slate-600 pointer-events-none'}`}>
                                    Google
                                </a>
                                <a href={calendarLinks?.outlook || '#'} target="_blank" rel="noreferrer"
                                    className={`py-2 rounded-lg text-[10px] font-bold text-center border transition ${calendarLinks?.outlook ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-800 text-slate-600 pointer-events-none'}`}>
                                    Outlook
                                </a>
                                <button onClick={() => downloadIcs(`/automation/calendar/booking/${viewingPass._id}/ics`)}
                                    className="py-2 rounded-lg text-[10px] font-bold text-center border border-slate-700 text-slate-300 hover:bg-slate-800 transition">
                                    Apple / .ics
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                            {viewingPass.status === 'confirmed' && (
                                <Link to={`/events/${viewingPass.inviteId?._id}/hub`}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2">
                                    <FaExternalLinkAlt size={10} /> Event Hub
                                </Link>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
                            >
                                <FaPrint /> Print Pass
                            </button>
                            <button
                                onClick={() => setViewingPass(null)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default UserDashboard;
