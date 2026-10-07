import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaTrash, FaCheckCircle, FaTimesCircle, FaPlus, FaCalendarAlt,
    FaServer, FaUsers, FaChartLine, FaEdit, FaQrcode,
    FaBullhorn, FaFileDownload, FaShieldAlt, FaClock, FaSearch, FaTimes, FaFilter
} from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { generateTicketPDF } from '../utils/generateTicketPDF';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Data States
    const [invites, setInvites] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Navigation & Theme States
    const [activeTab, setActiveTab] = useState('analytics'); // analytics, events, bookings, audit
    const [hudTheme, setHudTheme] = useState('cyan'); // cyan, magenta, emerald
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    // Search, Filter & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Modals & Drawers
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingInvite, setEditingInvite] = useState(null);
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: ''
    });
    const [broadcastData, setBroadcastData] = useState({ inviteId: '', subject: '', message: '' });

    // Live Digital Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load Initial Data
    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [invitesRes, bookingsRes, auditRes] = await Promise.all([
                api.get('/invites'),
                api.get('/bookings/my'),
                api.get('/admin/audit-logs').catch(() => ({ data: [] }))
            ]);
            setInvites(invitesRes.data);
            setBookings(bookingsRes.data);
            setAuditLogs(auditRes.data);
        } catch (error) {
            toast.error('Telemetry Sync Error');
        } finally {
            setLoading(false);
        }
    };

    // QR Code Scanner Effect
    useEffect(() => {
        if (showQRScanner) {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render(async (decodedText) => {
                scanner.clear();
                const t = toast.loading('Verifying Ticket Credentials...');
                try {
                    const { data } = await api.post('/admin/bookings/verify-qr', { ticketId: decodedText });
                    toast.success(data.message, { id: t });
                    setShowQRScanner(false);
                    fetchData();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Verification Failed', { id: t });
                }
            }, () => { });
            return () => scanner.clear().catch(() => { });
        }
    }, [showQRScanner]);

    // Drawer Open Handler for Create/Edit
    const handleOpenDrawer = (invite = null) => {
        if (invite) {
            setEditingInvite(invite);
            setFormData({
                title: invite.title,
                description: invite.description,
                date: invite.date ? new Date(invite.date).toISOString().split('T')[0] : '',
                location: invite.location,
                category: invite.category,
                totalSeats: invite.totalSeats,
                ticketPrice: invite.ticketPrice,
                image: invite.imageUrl || invite.image || ''
            });
        } else {
            setEditingInvite(null);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
        }
        setDrawerOpen(true);
    };

    // Save/Update Event Node
    const handleSaveInvite = async (e) => {
        e.preventDefault();
        const t = toast.loading(editingInvite ? 'Updating Node Configuration...' : 'Publishing Node to Network...');
        try {
            if (editingInvite) {
                await api.put(`/invites/${editingInvite._id}`, formData);
                toast.success('Node Configuration Updated', { id: t });
            } else {
                await api.post('/invites', formData);
                toast.success('Node Published Successfully', { id: t });
            }
            setDrawerOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Execution Error', { id: t });
        }
    };

    // Delete Event Node
    const handleDeleteInvite = async (id) => {
        if (user.role !== 'superadmin') {
            return toast.error('RBAC Restriction: SuperAdmin privilege required.');
        }
        if (window.confirm('Erase this event node permanently from network?')) {
            const t = toast.loading('Erasing Node...');
            try {
                await api.delete(`/invites/${id}`);
                fetchData();
                toast.success('Node Purged', { id: t });
            } catch (error) {
                toast.error('Purge Failed', { id: t });
            }
        }
    };

    // Confirm Booking
    const handleConfirmBooking = async (id, paymentStatus) => {
        const t = toast.loading('Authenticating Access Credentials...');
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
            toast.success('Access Credentials Authenticated', { id: t });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication Error', { id: t });
        }
    };

    // Dispatch Broadcast Announcement
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        const t = toast.loading('Dispatching Network Broadcast...');
        try {
            await api.post('/admin/broadcast', broadcastData);
            toast.success('Broadcast Transmission Sent', { id: t });
            setShowBroadcast(false);
            setBroadcastData({ inviteId: '', subject: '', message: '' });
        } catch (err) {
            toast.error('Broadcast Transmission Failed', { id: t });
        }
    };

    // Export Data Engine (CSV)
    const exportToCSV = (type) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        if (type === 'bookings') {
            csvContent += "Booking ID,User Name,User Email,Event,Amount,Status\n";
            bookings.forEach(b => {
                csvContent += `"${b._id}","${b.userId?.name || ''}","${b.userId?.email || ''}","${b.inviteId?.title || ''}","${b.amount}","${b.status}"\n`;
            });
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${type}_telemetry_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${type} report as CSV`);
    };

    // Analytics Aggregations
    const totalRevenue = bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0);
    const paidClients = new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size;
    const pendingRequests = bookings.filter(b => b.status === 'pending').length;

    // Chart Data Generators
    const revenueChartData = bookings.map((b, idx) => ({
        index: `T-${idx + 1}`,
        Yield: b.amount || 0
    }));

    const categoryData = Object.entries(
        invites.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const NEON_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

    // Filter Logic
    const filteredBookings = bookings.filter(b => {
        const matchesSearch = (b.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.inviteId?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = categoryFilter === 'All' || b.inviteId?.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    // Theme Color Mappers
    const getThemeGlow = () => {
        if (hudTheme === 'magenta') return 'shadow-[0_0_20px_rgba(236,72,153,0.3)] border-pink-500/40';
        if (hudTheme === 'emerald') return 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-500/40';
        return 'shadow-[0_0_20px_rgba(99,102,241,0.3)] border-indigo-500/40';
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-indigo-400 font-mono bg-[#030712]">
            <FaServer className="animate-spin text-4xl mb-4" />
            <div className="tracking-widest uppercase text-sm">Initializing Command Telemetry...</div>
        </div>
    );

    return (
        <div className="min-h-screen text-slate-300 pb-20 font-sans bg-[#030712] relative overflow-x-hidden">
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(99, 102, 241, 0.3)' } }} />

            {/* Futuristic Header Telemetry Bar */}
            <div className={`glass-panel border-b border-white/10 px-6 py-4 sticky top-0 z-30 flex flex-col lg:flex-row justify-between items-center gap-4 backdrop-blur-xl ${getThemeGlow()}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                        <FaServer size={22} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white tracking-tight font-display">COMMAND CENTER</h1>
                            <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase">
                                Role: {user?.role || 'Admin'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Status: Optimal</span>
                            <span className="flex items-center gap-1"><FaClock className="text-indigo-400" /> {currentTime}</span>
                        </div>
                    </div>
                </div>

                {/* HUD Theme Switcher & Action Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setHudTheme('cyan')} className={`px-2.5 py-1 text-xs rounded-lg font-mono ${hudTheme === 'cyan' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Cyan</button>
                        <button onClick={() => setHudTheme('magenta')} className={`px-2.5 py-1 text-xs rounded-lg font-mono ${hudTheme === 'magenta' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>Pink</button>
                        <button onClick={() => setHudTheme('emerald')} className={`px-2.5 py-1 text-xs rounded-lg font-mono ${hudTheme === 'emerald' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Emerald</button>
                    </div>

                    <button onClick={() => setShowQRScanner(true)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3.5 rounded-xl border border-white/10 text-xs flex items-center gap-2 transition">
                        <FaQrcode className="text-indigo-400" /> Gate Scanner
                    </button>

                    <button onClick={() => setShowBroadcast(true)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3.5 rounded-xl border border-white/10 text-xs flex items-center gap-2 transition">
                        <FaBullhorn className="text-pink-400" /> Broadcast
                    </button>

                    <button onClick={() => handleOpenDrawer()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition">
                        <FaPlus size={10} /> Initialize Event Node
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'analytics', label: 'Telemetry & HUD', icon: FaChartLine },
                        { id: 'events', label: 'Event Nodes', icon: FaServer },
                        { id: 'bookings', label: 'Access Requests', icon: FaUsers },
                        { id: 'audit', label: 'System Audit Logs', icon: FaShieldAlt }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-6 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB 1: HUD ANALYTICS & INTERACTIVE CHARTS */}
                {activeTab === 'analytics' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Summary Stat Widgets */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 rounded-2xl border-t-2 border-t-indigo-500 bg-slate-900/40">
                                <div className="text-slate-400 text-xs font-mono tracking-widest uppercase mb-1">Gross Yield</div>
                                <div className="text-3xl font-black text-white font-display">₹{totalRevenue.toLocaleString()}</div>
                            </div>
                            <div className="glass-card p-6 rounded-2xl border-t-2 border-t-purple-500 bg-slate-900/40">
                                <div className="text-slate-400 text-xs font-mono tracking-widest uppercase mb-1">Authenticated Clients</div>
                                <div className="text-3xl font-black text-white font-display">{paidClients}</div>
                            </div>
                            <div className="glass-card p-6 rounded-2xl border-t-2 border-t-emerald-500 bg-slate-900/40">
                                <div className="text-slate-400 text-xs font-mono tracking-widest uppercase mb-1">Pending Gate Requests</div>
                                <div className="text-3xl font-black text-white font-display">{pendingRequests}</div>
                            </div>
                        </div>

                        {/* Interactive Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/50">
                                <h3 className="text-sm font-mono tracking-widest text-indigo-400 uppercase mb-6 flex items-center justify-between">
                                    <span>Revenue Velocity Trajectory</span>
                                    <span className="text-slate-500 text-xs">Real-Time Yield</span>
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueChartData}>
                                            <defs>
                                                <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="index" stroke="#64748b" fontSize={10} />
                                            <YAxis stroke="#64748b" fontSize={10} />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                                            <Area type="monotone" dataKey="Yield" stroke="#6366f1" fillOpacity={1} fill="url(#colorYield)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/50 flex flex-col justify-between">
                                <h3 className="text-sm font-mono tracking-widest text-pink-400 uppercase mb-4">Node Category Breakdown</h3>
                                <div className="h-52 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {categoryData.map((cat, i) => (
                                        <div key={cat.name} className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NEON_COLORS[i % NEON_COLORS.length] }}></span>
                                            <span className="truncate">{cat.name} ({cat.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: EVENT NODES LIST & CAPACITY TRACKER */}
                {activeTab === 'events' && (
                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                        <div className="p-5 bg-slate-900/60 border-b border-white/10 flex justify-between items-center">
                            <h2 className="font-bold text-white text-lg">Active Event Nodes</h2>
                            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">Total: {invites.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/80 font-mono text-[10px] text-slate-400 uppercase tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="p-4">Designation</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Capacity Status</th>
                                        <th className="p-4">Access Fee</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-sans">
                                    {invites.map(invite => (
                                        <tr key={invite._id} className="hover:bg-white/5 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{invite.title}</div>
                                                <div className="text-xs text-slate-500 font-mono">{new Date(invite.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-4"><span className="text-xs font-mono bg-slate-800 text-indigo-300 px-2 py-1 rounded">{invite.category}</span></td>
                                            <td className="p-4">
                                                <div className="w-32 bg-slate-800 rounded-full h-1.5 mb-1 overflow-hidden">
                                                    <div className={`h-full ${invite.availableSeats === 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${((invite.totalSeats - invite.availableSeats) / invite.totalSeats) * 100}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400">{invite.availableSeats} / {invite.totalSeats} seats open</span>
                                            </td>
                                            <td className="p-4 font-mono font-bold">{invite.ticketPrice === 0 ? <span className="text-emerald-400">FREE</span> : `₹${invite.ticketPrice}`}</td>
                                            <td className="p-4 text-right space-x-3">
                                                <button onClick={() => handleOpenDrawer(invite)} className="text-indigo-400 hover:text-indigo-300 transition" title="Modify Node"><FaEdit size={16} /></button>
                                                <button onClick={() => handleDeleteInvite(invite._id)} className="text-slate-500 hover:text-rose-400 transition" title="Erase Node"><FaTrash size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: ACCESS REQUESTS WITH SEARCH, MULTI-FILTER & CSV EXPORT */}
                {activeTab === 'bookings' && (
                    <div className="space-y-4">
                        {/* Search & Filter Toolbar */}
                        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40">
                            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                                <div className="relative w-full md:w-72">
                                    <FaSearch className="absolute left-3 top-3 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search entity, email, or event..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                                >
                                    <option value="All">All Categories</option>
                                    {[...new Set(invites.map(i => i.category))].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button onClick={() => exportToCSV('bookings')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-lg">
                                <FaFileDownload /> Export CSV Report
                            </button>
                        </div>

                        {/* Requests Table */}
                        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900/80 font-mono text-[10px] text-slate-400 uppercase tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="p-4">Entity</th>
                                            <th className="p-4">Target Node</th>
                                            <th className="p-4">Payment Channel</th>
                                            <th className="p-4">Status & Gate</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredBookings.map(b => (
                                            <tr key={b._id} className="hover:bg-white/5 transition">
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{b.userId?.name || 'Unknown User'}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{b.userId?.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-indigo-300">{b.inviteId?.title || 'Unknown Event'}</div>
                                                    <div className="text-xs font-mono text-slate-500">₹{b.amount}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-mono text-xs font-bold uppercase text-slate-300">
                                                            {b.paymentMethod || 'FREE'}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                                                            {b.paymentReference || 'N/A'}
                                                        </span>
                                                        <span className={`text-[9px] font-mono uppercase font-bold ${
                                                            b.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                                                        }`}>
                                                            {b.paymentStatus || 'UNPAID'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                                            b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        }`}>
                                                            {b.status}
                                                        </span>
                                                        {b.checkedIn ? (
                                                            <span className="text-[9px] font-mono text-purple-400 font-bold">
                                                                Redeemed
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-mono text-emerald-400">
                                                                Gate Pass Active
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {b.status === 'confirmed' && (
                                                            <button 
                                                                onClick={() => generateTicketPDF(b, b.userId?.name)}
                                                                className="text-indigo-400 hover:text-indigo-300 font-mono text-xs bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 transition flex items-center gap-1"
                                                                title="Download Pass PDF"
                                                            >
                                                                <FaFileDownload size={11} /> Pass
                                                            </button>
                                                        )}
                                                        {b.status === 'pending' && (
                                                            <button onClick={() => handleConfirmBooking(b._id, 'paid')} className="text-emerald-400 hover:text-emerald-300 font-mono text-xs bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition">
                                                                Authorize
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: SYSTEM AUDIT LOGS */}
                {activeTab === 'audit' && (
                    <div className="glass-panel rounded-2xl p-6 border border-white/10">
                        <h2 className="text-sm font-mono tracking-widest text-indigo-400 uppercase mb-4 flex items-center gap-2">
                            <FaShieldAlt /> Immutable System Action Trail
                        </h2>
                        <div className="space-y-3">
                            {auditLogs.length === 0 ? (
                                <div className="text-slate-500 text-xs font-mono text-center py-8">No security actions recorded in current session log.</div>
                            ) : (
                                auditLogs.map(log => (
                                    <div key={log._id} className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs font-mono">
                                        <div>
                                            <span className="text-indigo-400 font-bold">[{log.action}]</span> <span className="text-slate-300">{log.details}</span>
                                        </div>
                                        <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* GLASSMORPHIC SLIDE-OVER DRAWER (CREATE / EDIT NODE) */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-slate-900/95 border-l border-white/10 p-6 h-full overflow-y-auto shadow-2xl backdrop-blur-2xl z-10 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-lg font-bold text-white font-display">{editingInvite ? 'Modify Event Node' : 'Initialize New Event Node'}</h2>
                            <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSaveInvite} className="space-y-4 text-xs font-mono">
                            <div>
                                <label className="text-slate-400 block mb-1">Title Designation</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Category</label>
                                <input required type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1">Date</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-slate-400 block mb-1">Location</label>
                                    <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1">Max Capacity</label>
                                    <input required type="number" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-slate-400 block mb-1">Access Fee (₹)</label>
                                    <input required type="number" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Image Endpoint URL</label>
                                <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Description Log</label>
                                <textarea required rows="4" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg mt-4">
                                {editingInvite ? 'Commit Node Updates' : 'Execute Launch'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR CODE GATE SCANNER MODAL */}
            {showQRScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center relative">
                        <button onClick={() => setShowQRScanner(false)} className="absolute top-4 right-4 text-slate-400"><FaTimes /></button>
                        <h3 className="text-lg font-bold text-white mb-2">Gate Pass QR Scanner</h3>
                        <p className="text-xs text-slate-400 mb-4 font-mono">Scan attendee QR pass for instant access validation.</p>
                        <div id="reader" className="overflow-hidden rounded-xl bg-black border border-slate-800"></div>
                    </div>
                </div>
            )}

            {/* DIRECT BROADCAST MODAL */}
            {showBroadcast && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full relative">
                        <button onClick={() => setShowBroadcast(false)} className="absolute top-4 right-4 text-slate-400"><FaTimes /></button>
                        <h3 className="text-lg font-bold text-white mb-4">Direct Email Broadcast Engine</h3>
                        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs font-mono">
                            <div>
                                <label className="text-slate-400 block mb-1">Target Event Node</label>
                                <select required value={broadcastData.inviteId} onChange={e => setBroadcastData({ ...broadcastData, inviteId: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none">
                                    <option value="">Select Event Target...</option>
                                    {invites.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Subject Header</label>
                                <input required type="text" value={broadcastData.subject} onChange={e => setBroadcastData({ ...broadcastData, subject: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Message Body</label>
                                <textarea required rows="4" value={broadcastData.message} onChange={e => setBroadcastData({ ...broadcastData, message: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none" />
                            </div>
                            <button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded-xl transition shadow-lg">
                                Transmit Broadcast
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;