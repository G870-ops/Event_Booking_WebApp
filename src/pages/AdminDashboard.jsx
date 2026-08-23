import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaTrash, FaCheckCircle, FaTimesCircle, FaPlus, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTag } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [invites, setInvites] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showInviteForm, setShowInviteForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [invitesRes, bookingsRes] = await Promise.all([
                api.get('/invites'),
                api.get('/bookings/my')
            ]);
            setInvites(invitesRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            toast.error('Error fetching dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async (e) => {
        e.preventDefault();
        const t = toast.loading('Publishing invite...');
        try {
            await api.post('/invites', formData);
            setShowInviteForm(false);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
            fetchData();
            toast.success('Invite published successfully', { id: t });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating invite', { id: t });
        }
    };

    const handleDeleteInvite = async (id) => {
        if (window.confirm('Are you sure you want to delete this invite?')) {
            const t = toast.loading('Deleting invite...');
            try {
                await api.delete(`/invites/${id}`);
                fetchData();
                toast.success('Invite deleted', { id: t });
            } catch (error) {
                toast.error('Error deleting invite', { id: t });
            }
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        const t = toast.loading('Updating booking status...');
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
            toast.success('Booking status updated', { id: t });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error confirming booking', { id: t });
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm("Cancel this user's booking request?")) {
            const t = toast.loading('Cancelling booking...');
            try {
                await api.delete(`/bookings/${id}`);
                fetchData();
                toast.success('Booking cancelled', { id: t });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error cancelling booking', { id: t });
            }
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Loading workspace...</div>;

    const totalRevenue = bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0);
    const paidClients = new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size;
    const pendingRequests = bookings.filter(b => b.status === 'pending').length;

    return (
        <div className="bg-[#fafafa] min-h-screen text-slate-900 pb-20">
            <Toaster position="top-right" />
            
            {/* Enterprise Top Navigation/Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage events, track revenue, and oversee bookings.</p>
                </div>
                <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition flex items-center gap-2 text-sm"
                >
                    {showInviteForm ? 'Cancel Creation' : <><FaPlus size={12} /> Create Event</>}
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-semibold text-slate-900">₹{totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-1">Paid Attendees</p>
                        <h3 className="text-3xl font-semibold text-slate-900">{paidClients}</h3>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-1">Pending Requests</p>
                        <h3 className="text-3xl font-semibold text-slate-900">{pendingRequests}</h3>
                    </div>
                </div>

                {/* Invite Creation Form */}
                {showInviteForm && (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 mb-8 shadow-sm">
                        <h2 className="text-xl font-semibold mb-6">Create New Event</h2>
                        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                                <input required type="text" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <input required type="text" placeholder="e.g. Conference, Webinar" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input required type="date" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input required type="text" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Capacity</label>
                                <input required type="number" min="1" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Price (₹)</label>
                                <input required type="number" min="0" placeholder="0 for free" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
                                <input type="url" placeholder="https://" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea required rows="4" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button type="submit" className="bg-slate-900 text-white font-medium py-2 px-6 rounded-md hover:bg-slate-800 transition text-sm">Publish Event</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Data Tables */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Events Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800">Managed Events</h2>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{invites.length} Active</span>
                        </div>
                        <div className="overflow-y-auto flex-grow p-0">
                            {invites.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No events found.</div> : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-white sticky top-0 border-b border-slate-200 z-10">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Event Details</th>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Capacity</th>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invites.map(invite => (
                                            <tr key={invite._id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 mb-1">{invite.title}</div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1"><FaCalendarAlt /> {new Date(invite.date).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><FaTag /> {invite.category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1 max-w-[100px]">
                                                        <div className={`h-1.5 rounded-full ${invite.availableSeats === 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${((invite.totalSeats - invite.availableSeats) / invite.totalSeats) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium">{invite.availableSeats} left</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDeleteInvite(invite._id)} className="text-slate-400 hover:text-red-600 transition" title="Delete Event">
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Bookings Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800">Booking Requests</h2>
                            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{pendingRequests} Pending</span>
                        </div>
                        <div className="overflow-y-auto flex-grow p-0">
                            {bookings.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No bookings yet.</div> : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-white sticky top-0 border-b border-slate-200 z-10">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Event</th>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {bookings.map(booking => (
                                            <tr key={booking._id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{booking.userId?.name}</div>
                                                    <div className="text-xs text-slate-500">{booking.userId?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-700 line-clamp-1 max-w-[150px]">{booking.inviteId?.title || 'Deleted'}</div>
                                                    <div className="text-xs font-semibold text-slate-500">{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {booking.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="text-green-600 hover:text-green-700" title="Approve">
                                                                <FaCheckCircle size={18} />
                                                            </button>
                                                            <button onClick={() => handleCancelBooking(booking._id)} className="text-red-500 hover:text-red-600" title="Reject">
                                                                <FaTimesCircle size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
