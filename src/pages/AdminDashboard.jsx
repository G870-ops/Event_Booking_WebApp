import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaTrash, FaCheckCircle, FaTimesCircle, FaPlus, FaCalendarAlt, FaTag, FaServer, FaUsers, FaChartLine } from 'react-icons/fa';

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
        const t = toast.loading('Initializing node...');
        try {
            await api.post('/invites', formData);
            setShowInviteForm(false);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
            fetchData();
            toast.success('Node published to network', { id: t });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating invite', { id: t });
        }
    };

    const handleDeleteInvite = async (id) => {
        if (window.confirm('Erase this event from the network?')) {
            const t = toast.loading('Erasing node...');
            try {
                await api.delete(`/invites/${id}`);
                fetchData();
                toast.success('Node erased', { id: t });
            } catch (error) {
                toast.error('Error erasing invite', { id: t });
            }
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        const t = toast.loading('Authenticating user...');
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
            toast.success('User authenticated successfully', { id: t });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error confirming booking', { id: t });
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm("Reject this access request?")) {
            const t = toast.loading('Rejecting...');
            try {
                await api.delete(`/bookings/${id}`);
                fetchData();
                toast.success('Request rejected', { id: t });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error cancelling booking', { id: t });
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen text-indigo-400 font-mono bg-[#030712]">
            <FaServer className="animate-pulse mr-2" /> Connecting to Admin Console...
        </div>
    );

    const totalRevenue = bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0);
    const paidClients = new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size;
    const pendingRequests = bookings.filter(b => b.status === 'pending').length;

    return (
        <div className="min-h-screen text-slate-300 pb-20 font-sans relative">
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(99, 102, 241, 0.3)' }
            }}/>
            
            {/* Futuristic Navbar */}
            <div className="glass-panel border-b border-white/10 px-8 py-5 flex flex-col md:flex-row justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                        <FaServer size={18} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white font-display">Command Center</h1>
                        <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase mt-0.5">System Status: Optimal</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                >
                    {showInviteForm ? 'Abort Creation' : <><FaPlus size={12} /> Initialize Event Node</>}
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass-card rounded-2xl p-6 border-t-2 border-t-indigo-500">
                        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-sm font-bold tracking-widest uppercase">
                            <FaChartLine /> Total Yield
                        </div>
                        <h3 className="text-4xl font-black text-white font-display">₹{totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="glass-card rounded-2xl p-6 border-t-2 border-t-purple-500">
                        <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-bold tracking-widest uppercase">
                            <FaUsers /> Authenticated Users
                        </div>
                        <h3 className="text-4xl font-black text-white font-display">{paidClients}</h3>
                    </div>
                    <div className="glass-card rounded-2xl p-6 border-t-2 border-t-emerald-500">
                        <div className="flex items-center gap-2 mb-2 text-emerald-400 text-sm font-bold tracking-widest uppercase">
                            <FaServer /> Pending Access
                        </div>
                        <h3 className="text-4xl font-black text-white font-display">{pendingRequests}</h3>
                    </div>
                </div>

                {/* Invite Creation Form */}
                {showInviteForm && (
                    <div className="glass-panel p-8 rounded-2xl mb-10 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                        <h2 className="text-2xl font-bold text-white mb-8 font-display">New Event Configuration</h2>
                        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Event Designation</label>
                                <input required type="text" className="futuristic-input w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Category</label>
                                <input required type="text" placeholder="e.g. Hackathon, Conference" className="futuristic-input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Temporal Coordinates (Date)</label>
                                <input required type="date" className="futuristic-input w-full" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Spatial Coordinates (Location)</label>
                                <input required type="text" className="futuristic-input w-full" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Max Capacity</label>
                                <input required type="number" min="1" className="futuristic-input w-full" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Access Fee (₹)</label>
                                <input required type="number" min="0" placeholder="0 for Free" className="futuristic-input w-full" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Aesthetic Image URL</label>
                                <input type="url" placeholder="https://" className="futuristic-input w-full" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-mono tracking-widest text-slate-400 uppercase mb-2">Data Log (Description)</label>
                                <textarea required rows="4" className="futuristic-input w-full" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                                    Execute Launch
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Data Tables */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Events Table */}
                    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[600px]">
                        <div className="px-6 py-5 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white font-display">Active Nodes</h2>
                            <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase font-bold px-2 py-1 rounded tracking-widest">
                                {invites.length} Online
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-grow p-0 no-scrollbar">
                            {invites.length === 0 ? <div className="p-10 text-center text-sm text-slate-500 font-mono">No nodes active.</div> : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Designation</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Bandwidth</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {invites.map(invite => (
                                            <tr key={invite._id} className="hover:bg-white/5 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white mb-1">{invite.title}</div>
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                                        <span className="flex items-center gap-1"><FaCalendarAlt className="text-indigo-500/70" /> {new Date(invite.date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1.5 max-w-[100px] overflow-hidden border border-white/5">
                                                        <div className={`h-full rounded-full ${invite.availableSeats === 0 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} style={{ width: `${((invite.totalSeats - invite.availableSeats) / invite.totalSeats) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">{invite.availableSeats} slots left</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDeleteInvite(invite._id)} className="text-slate-500 hover:text-red-400 transition hover:scale-110" title="Delete Event">
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
                    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[600px]">
                        <div className="px-6 py-5 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white font-display">Access Requests</h2>
                            <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded tracking-widest">
                                {pendingRequests} Pending
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-grow p-0 no-scrollbar">
                            {bookings.length === 0 ? <div className="p-10 text-center text-sm text-slate-500 font-mono">No requests pending.</div> : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Entity</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Target Node</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {bookings.map(booking => (
                                            <tr key={booking._id} className="hover:bg-white/5 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white text-sm">{booking.userId?.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{booking.userId?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-indigo-300 text-sm line-clamp-1 max-w-[150px]">{booking.inviteId?.title || 'Unknown'}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">{booking.amount === 0 ? 'FREE' : `₹${booking.amount}`}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                                        booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {booking.status === 'pending' && (
                                                        <div className="flex justify-end gap-3">
                                                            <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="text-emerald-500 hover:text-emerald-400 hover:scale-110 transition drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" title="Authorize">
                                                                <FaCheckCircle size={18} />
                                                            </button>
                                                            <button onClick={() => handleCancelBooking(booking._id)} className="text-red-500 hover:text-red-400 hover:scale-110 transition drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" title="Reject">
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
