import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    FaTicketAlt, 
    FaTimesCircle, 
    FaShieldAlt, 
    FaCheckCircle, 
    FaFileDownload, 
    FaCreditCard, 
    FaQrcode, 
    FaClock, 
    FaSearch 
} from 'react-icons/fa';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';
import { generateTicketPDF } from '../utils/generateTicketPDF';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter and search
    const [activeFilter, setActiveFilter] = useState('all'); // all, confirmed, pending
    const [searchQuery, setSearchQuery] = useState('');

    // Payment Checkout Modal for Pending Bookings
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

    const colors = [
        '#f8fafc', '#f1f5f9', '#f8fafc', '#fdf2f8',
        '#faf5ff', '#fff7ed', '#f0fdfa', '#fefaf0'
    ];

    const [bgColorIndex, setBgColorIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    const currentBgColor = colors[bgColorIndex];

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
            toast.error('Failed to sync bookings');
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                toast.success('Booking cancelled successfully');
                fetchBookings();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    // Filter logic
    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.inviteId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b._id.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (activeFilter === 'confirmed') return b.status === 'confirmed';
        if (activeFilter === 'pending') return b.status === 'pending' || b.paymentStatus !== 'paid';
        return true;
    });

    if (loading) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 font-mono text-sm gap-2">
            <span className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
            <span>Syncing your digital tickets...</span>
        </div>
    );

    return (
        <div
            className="max-w-6xl mx-auto rounded-3xl p-4 sm:p-8 transition-colors duration-1000 min-h-screen"
            style={{ backgroundColor: currentBgColor }}
        >
            {/* User Profile Banner */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col items-center sm:items-start">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 font-display">Welcome, {user?.name}!</h1>
                        <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 
                            {user?.email} • Account Role: <span className="uppercase text-indigo-600 font-bold">{user?.role || 'User'}</span>
                        </p>
                    </div>
                </div>

                {/* Staff / Admin switcher */}
                {['superadmin', 'admin', 'event_manager', 'gate_checker', 'finance'].includes(user?.role) && (
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition shrink-0"
                    >
                        <FaShieldAlt /> Open Admin Telemetry
                    </Link>
                )}
            </div>

            {/* Bookings Header & Search / Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 sm:gap-3 font-display">
                        <FaTicketAlt className="text-indigo-600" /> My Access Passes & Tickets
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Manage booked passes, gate tokens, and payment receipts</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search box */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Search passes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 transition w-44 sm:w-56"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'confirmed', label: 'Confirmed' },
                            { id: 'pending', label: 'Pending Payment' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${
                                    activeFilter === f.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pass List Grid */}
            {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FaTicketAlt className="text-3xl" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 mb-2">No matching passes found</p>
                    <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                        {bookings.length === 0 ? "You haven't booked any event passes yet. Browse our verified events to get started." : "No bookings match your current search and filter criteria."}
                    </p>
                    <Link to="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-indigo-600/20 text-xs">
                        Browse Upcoming Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map((booking) => {
                        const isConfirmed = booking.status === 'confirmed';
                        const isPaid = booking.paymentStatus === 'paid';
                        const isPendingPayment = !isPaid && booking.status !== 'cancelled';
                        const invite = booking.inviteId || booking.eventId;

                        return (
                            <div key={booking._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-slate-200/80 flex flex-col">
                                <div className="p-5 border-b border-slate-100 flex-grow space-y-4">
                                    {invite ? (
                                        <>
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {invite.category || 'EVENT'}
                                                    </span>
                                                    <h3 className="text-base font-black text-slate-900 leading-snug mt-1">
                                                        {invite.title}
                                                    </h3>
                                                </div>

                                                <div className="flex flex-col gap-1 items-end shrink-0">
                                                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${
                                                        isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {booking.status}
                                                    </span>

                                                    {booking.status !== 'cancelled' && (
                                                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${
                                                            isPaid ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                                                        }`}>
                                                            {isPaid ? 'PAID' : 'PAYMENT PENDING'}
                                                        </span>
                                                    )}

                                                    {/* Gate Redemption Status */}
                                                    {isConfirmed && (
                                                        booking.checkedIn ? (
                                                            <span className="px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1">
                                                                <FaCheckCircle size={8} /> Redeemed
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Gate Pass Active
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details metadata */}
                                            <div className="text-xs text-slate-500 space-y-1.5 bg-slate-50 p-3 rounded-xl">
                                                <p className="flex justify-between">
                                                    <span className="text-slate-400">Date:</span> 
                                                    <strong className="text-slate-800">{new Date(invite.date).toLocaleDateString()}</strong>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-slate-400">Venue:</span> 
                                                    <strong className="text-slate-800 truncate max-w-[150px]">{invite.location}</strong>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-slate-400">Pass Valuation:</span> 
                                                    <strong className="text-slate-900 font-mono">
                                                        {booking.amount === 0 ? 'FREE' : `₹${booking.amount}`}
                                                    </strong>
                                                </p>
                                                {booking.paymentMethod && (
                                                    <p className="flex justify-between">
                                                        <span className="text-slate-400">Channel:</span> 
                                                        <strong className="text-indigo-600 uppercase font-mono text-[11px]">
                                                            {booking.paymentMethod} {booking.paymentReference ? `(${booking.paymentReference.slice(-6)})` : ''}
                                                        </strong>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Confirmed Gate Pass Token & QR */}
                                            {isConfirmed ? (
                                                <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between border border-slate-800 shadow-inner">
                                                    <div>
                                                        <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">Gate Pass Token</p>
                                                        <p className="text-[11px] font-mono font-bold select-all text-slate-200">{booking._id}</p>
                                                        <p className="text-[9px] text-slate-400 mt-1">Scan at entrance scanner</p>
                                                    </div>
                                                    <div className="bg-white p-1 rounded-lg shrink-0">
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${booking._id}`}
                                                            alt="Pass QR"
                                                            className="w-[50px] h-[50px]"
                                                        />
                                                    </div>
                                                </div>
                                            ) : isPendingPayment ? (
                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-2">
                                                    <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                                                        <FaClock /> Payment Incomplete
                                                    </p>
                                                    <p className="text-[11px] text-amber-700">
                                                        Complete payment via Stripe or UPI to confirm your seat and generate your gate pass.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBookingForPayment(booking);
                                                            setPayModalOpen(true);
                                                        }}
                                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-2"
                                                    >
                                                        <FaCreditCard /> Pay ₹{booking.amount} Now
                                                    </button>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <p className="text-rose-500 italic text-xs">Event details unavailable (might have been removed)</p>
                                    )}
                                </div>

                                {/* Footer actions */}
                                <div className="p-3 bg-slate-50 flex justify-between items-center gap-2 text-xs font-bold border-t border-slate-100">
                                    {invite && booking.status !== 'cancelled' ? (
                                        <>
                                            {isConfirmed && (
                                                <button
                                                    onClick={() => generateTicketPDF(booking, user?.name)}
                                                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition py-1"
                                                >
                                                    <FaFileDownload /> Pass (PDF)
                                                </button>
                                            )}
                                            <Link to={`/invites/${invite._id}`} className="text-slate-700 hover:text-slate-900 underline">
                                                Event Info
                                            </Link>
                                            <button
                                                onClick={() => cancelBooking(booking._id)}
                                                className="text-rose-600 hover:text-rose-700 transition flex items-center gap-1"
                                            >
                                                <FaTimesCircle /> Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-slate-400 italic text-[11px]">Pass Cancelled</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Payment Checkout Modal Triggered from Dashboard */}
            {selectedBookingForPayment && (
                <PaymentCheckoutModal
                    isOpen={payModalOpen}
                    onClose={() => {
                        setPayModalOpen(false);
                        setSelectedBookingForPayment(null);
                        fetchBookings();
                    }}
                    bookingId={selectedBookingForPayment._id}
                    invite={selectedBookingForPayment.inviteId || selectedBookingForPayment.eventId}
                    user={user}
                    onPaymentSuccess={() => {
                        fetchBookings();
                    }}
                />
            )}
        </div>
    );
};

export default UserDashboard;