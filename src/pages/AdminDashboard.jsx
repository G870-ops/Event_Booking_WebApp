import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const defaultSmart = () => ({
    tiers: [],
    dynamicPricing: { enabled: false, minMultiplier: 0.8, maxMultiplier: 2, demandWeight: 0.6, timeWeight: 0.4, cutoffHours: 48 },
    groupDiscount: { enabled: false, threshold: 4, percent: 10 },
    currency: { base: 'INR', allowed: ['INR'] },
    venue: { mapType: 'none', mapImageUrl: '', zones: [] },
    virtual: { provider: 'custom', streamUrl: '', recordingUrl: '', breakoutRooms: [] },
    policies: { waitlistEnabled: true, waitlistMax: 50, holdMinutes: 15, maxPerOrder: 10, refundPolicy: { mode: 'tiered', cutoffHours: 24, feePercent: 10 } }
});

const smartFromInvite = (invite) => ({
    tiers: (invite.tiers || []).map(t => ({
        ...t,
        perks: Array.isArray(t.perks) ? t.perks.join(', ') : (t.perks || '')
    })),
    dynamicPricing: { ...defaultSmart().dynamicPricing, ...(invite.dynamicPricing || {}) },
    groupDiscount: { ...defaultSmart().groupDiscount, ...(invite.groupDiscount || {}) },
    currency: { base: 'INR', allowed: ['INR'], ...(invite.currency || {}) },
    venue: { mapType: 'none', mapImageUrl: '', ...(invite.venue || {}),
        zones: Array.isArray(invite.venue?.zones) ? invite.venue.zones.join(', ') : '' },
    virtual: { provider: 'custom', streamUrl: '', recordingUrl: '', ...(invite.virtual || {}),
        breakoutRooms: Array.isArray(invite.virtual?.breakoutRooms) ? invite.virtual.breakoutRooms.join(', ') : '' },
    policies: {
        ...defaultSmart().policies, ...(invite.policies || {}),
        refundPolicy: { ...defaultSmart().policies.refundPolicy, ...(invite.policies?.refundPolicy || {}) }
    }
});

const cleanTiers = (tiers) => (Array.isArray(tiers) ? tiers : []).filter(t => t && t.name).map(t => ({
    name: String(t.name).trim(),
    description: String(t.description || ''),
    price: Math.max(0, Number(t.price) || 0),
    quantity: Math.max(0, Number(t.quantity) || 0),
    perks: typeof t.perks === 'string' ? t.perks.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(t.perks) ? t.perks : []),
    minQty: Math.max(1, Number(t.minQty) || 1),
    maxQty: Math.max(1, Number(t.maxQty) || 10),
    active: t.active !== false
}));

const buildSmartPayload = (smart) => ({
    tiers: cleanTiers(smart.tiers),
    dynamicPricing: { ...smart.dynamicPricing, minMultiplier: Number(smart.dynamicPricing.minMultiplier) || 0.8, maxMultiplier: Number(smart.dynamicPricing.maxMultiplier) || 2 },
    groupDiscount: { ...smart.groupDiscount, threshold: Number(smart.groupDiscount.threshold) || 4, percent: Number(smart.groupDiscount.percent) || 0 },
    currency: { base: String(smart.currency.base || 'INR').toUpperCase(), allowed: [String(smart.currency.base || 'INR').toUpperCase()] },
    venue: {
        mapType: smart.venue.mapType || 'none',
        mapImageUrl: smart.venue.mapImageUrl || '',
        zones: String(smart.venue.zones || '').split(',').map(s => s.trim()).filter(Boolean)
    },
    virtual: {
        provider: smart.virtual.provider || 'custom',
        streamUrl: smart.virtual.streamUrl || '',
        recordingUrl: smart.virtual.recordingUrl || '',
        breakoutRooms: String(smart.virtual.breakoutRooms || '').split(',').map(s => s.trim()).filter(Boolean)
    },
    policies: {
        waitlistEnabled: !!smart.policies.waitlistEnabled,
        waitlistMax: Number(smart.policies.waitlistMax) || 50,
        holdMinutes: Number(smart.policies.holdMinutes) || 15,
        maxPerOrder: Number(smart.policies.maxPerOrder) || 10,
        refundPolicy: {
            mode: ['full', 'tiered', 'none'].includes(smart.policies.refundPolicy.mode) ? smart.policies.refundPolicy.mode : 'tiered',
            cutoffHours: Number(smart.policies.refundPolicy.cutoffHours) || 24,
            feePercent: Number(smart.policies.refundPolicy.feePercent) || 0
        }
    }
});

const inputCls = 'text-gray-900 border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition w-full';
const labelCls = 'block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5';

const SmartConfigFields = ({ smart, setSmart }) => {
    const up = (group, patch) => setSmart({ ...smart, [group]: { ...smart[group], ...patch } });

    const upTier = (idx, patch) => {
        const tiers = smart.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t));
        setSmart({ ...smart, tiers });
    };

    return (
        <div className="space-y-8 border-t border-gray-200 pt-6 mt-2 md:col-span-2">
            {/* Ticket tiers */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className={labelCls}>Ticket tiers (leave empty to use base price)</p>
                    <button type="button"
                        onClick={() => setSmart({ ...smart, tiers: smart.tiers.concat([{ name: '', description: '', price: '', quantity: '', perks: '', maxQty: 4 }]) })}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add tier</button>
                </div>
                {smart.tiers.length === 0 && <p className="text-xs text-gray-400">No tiers yet — every buyer pays the base ticket price.</p>}
                <div className="space-y-3">
                    {smart.tiers.map((t, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                            <div className="col-span-2 md:col-span-1">
                                <label className={labelCls}>Name</label>
                                <input className={inputCls} placeholder="Early Bird" value={t.name || ''} onChange={e => upTier(i, { name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Price</label>
                                <input className={inputCls} type="number" min="0" value={t.price ?? ''} onChange={e => upTier(i, { price: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Seats</label>
                                <input className={inputCls} type="number" min="0" value={t.quantity ?? ''} onChange={e => upTier(i, { quantity: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Max/order</label>
                                <input className={inputCls} type="number" min="1" value={t.maxQty ?? 4} onChange={e => upTier(i, { maxQty: e.target.value })} />
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className={labelCls}>Perks</label>
                                    <input className={inputCls} placeholder="Backstage, Tee" value={t.perks || ''} onChange={e => upTier(i, { perks: e.target.value })} />
                                </div>
                                <button type="button"
                                    onClick={() => setSmart({ ...smart, tiers: smart.tiers.filter((_, idx) => idx !== i) })}
                                    className="px-3 py-3 rounded-lg bg-red-50 text-red-600 border border-red-200 font-bold text-xs">✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dynamic pricing + group discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <input type="checkbox" checked={!!smart.dynamicPricing.enabled} onChange={e => up('dynamicPricing', { enabled: e.target.checked })} />
                        Dynamic pricing (demand surge)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Min ×</label>
                            <input className={inputCls} type="number" step="0.1" value={smart.dynamicPricing.minMultiplier} onChange={e => up('dynamicPricing', { minMultiplier: e.target.value })} /></div>
                        <div><label className={labelCls}>Max ×</label>
                            <input className={inputCls} type="number" step="0.1" value={smart.dynamicPricing.maxMultiplier} onChange={e => up('dynamicPricing', { maxMultiplier: e.target.value })} /></div>
                        <div><label className={labelCls}>Demand weight</label>
                            <input className={inputCls} type="number" step="0.1" value={smart.dynamicPricing.demandWeight} onChange={e => up('dynamicPricing', { demandWeight: e.target.value })} /></div>
                        <div><label className={labelCls}>Time weight</label>
                            <input className={inputCls} type="number" step="0.1" value={smart.dynamicPricing.timeWeight} onChange={e => up('dynamicPricing', { timeWeight: e.target.value })} /></div>
                        <div className="col-span-2"><label className={labelCls}>Surge cutoff (hours before event)</label>
                            <input className={inputCls} type="number" value={smart.dynamicPricing.cutoffHours} onChange={e => up('dynamicPricing', { cutoffHours: e.target.value })} /></div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <input type="checkbox" checked={!!smart.groupDiscount.enabled} onChange={e => up('groupDiscount', { enabled: e.target.checked })} />
                        Group discount
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Seats threshold</label>
                            <input className={inputCls} type="number" min="2" value={smart.groupDiscount.threshold} onChange={e => up('groupDiscount', { threshold: e.target.value })} /></div>
                        <div><label className={labelCls}>Discount %</label>
                            <input className={inputCls} type="number" min="0" max="90" value={smart.groupDiscount.percent} onChange={e => up('groupDiscount', { percent: e.target.value })} /></div>
                        <div><label className={labelCls}>Base currency</label>
                            <select className={inputCls} value={smart.currency.base} onChange={e => setSmart({ ...smart, currency: { ...smart.currency, base: e.target.value } })}>
                                {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select></div>
                        <div><label className={labelCls}>Max tickets/order</label>
                            <input className={inputCls} type="number" min="1" value={smart.policies.maxPerOrder} onChange={e => up('policies', { maxPerOrder: e.target.value })} /></div>
                    </div>
                </div>
            </div>

            {/* Waitlist + refund policy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className={labelCls}>Waitlist &amp; holds</p>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <input type="checkbox" checked={!!smart.policies.waitlistEnabled} onChange={e => up('policies', { waitlistEnabled: e.target.checked })} />
                        Auto-waitlist when sold out
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Waitlist cap</label>
                            <input className={inputCls} type="number" value={smart.policies.waitlistMax} onChange={e => up('policies', { waitlistMax: e.target.value })} /></div>
                        <div><label className={labelCls}>Seat hold (min)</label>
                            <input className={inputCls} type="number" value={smart.policies.holdMinutes} onChange={e => up('policies', { holdMinutes: e.target.value })} /></div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className={labelCls}>Refund policy</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1"><label className={labelCls}>Mode</label>
                            <select className={inputCls} value={smart.policies.refundPolicy.mode} onChange={e => up('policies', { refundPolicy: { ...smart.policies.refundPolicy, mode: e.target.value } })}>
                                <option value="tiered">Tiered</option>
                                <option value="full">Full</option>
                                <option value="none">No refund</option>
                            </select></div>
                        <div><label className={labelCls}>Cutoff (h)</label>
                            <input className={inputCls} type="number" value={smart.policies.refundPolicy.cutoffHours} onChange={e => up('policies', { refundPolicy: { ...smart.policies.refundPolicy, cutoffHours: e.target.value } })} /></div>
                        <div><label className={labelCls}>Fee %</label>
                            <input className={inputCls} type="number" value={smart.policies.refundPolicy.feePercent} onChange={e => up('policies', { refundPolicy: { ...smart.policies.refundPolicy, feePercent: e.target.value } })} /></div>
                    </div>
                </div>
            </div>

            {/* Hybrid stream + floor zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className={labelCls}>Hybrid / virtual streaming</p>
                    <div className="space-y-3">
                        <div><label className={labelCls}>Provider</label>
                            <select className={inputCls} value={smart.virtual.provider} onChange={e => up('virtual', { provider: e.target.value })}>
                                <option value="custom">Custom / embed</option>
                                <option value="youtube">YouTube Live</option>
                                <option value="zoom">Zoom</option>
                                <option value="meet">Google Meet</option>
                            </select></div>
                        <div><label className={labelCls}>Stream URL</label>
                            <input className={inputCls} placeholder="https://…" value={smart.virtual.streamUrl} onChange={e => up('virtual', { streamUrl: e.target.value })} /></div>
                        <div><label className={labelCls}>Replay URL (optional)</label>
                            <input className={inputCls} placeholder="https://…" value={smart.virtual.recordingUrl} onChange={e => up('virtual', { recordingUrl: e.target.value })} /></div>
                        <div><label className={labelCls}>Breakout rooms (comma separated)</label>
                            <input className={inputCls} placeholder="Founders, Design, Hiring" value={smart.virtual.breakoutRooms} onChange={e => up('virtual', { breakoutRooms: e.target.value })} /></div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className={labelCls}>Venue map / floor zones</p>
                    <div className="space-y-3">
                        <div><label className={labelCls}>Map type</label>
                            <select className={inputCls} value={smart.venue.mapType} onChange={e => up('venue', { mapType: e.target.value })}>
                                <option value="none">None</option>
                                <option value="floorplan">Floor plan</option>
                                <option value="seatmap">Seat map</option>
                            </select></div>
                        <div><label className={labelCls}>Map image URL</label>
                            <input className={inputCls} placeholder="https://…" value={smart.venue.mapImageUrl} onChange={e => up('venue', { mapImageUrl: e.target.value })} /></div>
                        <div><label className={labelCls}>Zones (comma separated)</label>
                            <input className={inputCls} placeholder="VIP, Floor, Balcony" value={smart.venue.zones} onChange={e => up('venue', { zones: e.target.value })} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SmartConfigModal = ({ invite, onClose, onSaved }) => {
    const [smart, setSmart] = useState(() => smartFromInvite(invite));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/invites/${invite._id}`, buildSmartPayload(smart));
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Smart ticketing — {invite.title}</h2>
                        <p className="text-xs text-gray-500">Tiers, surge pricing, waitlist, refunds, streaming &amp; floor zones</p>
                    </div>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 font-bold text-sm">✕ Close</button>
                </div>
                <div className="p-6">
                    {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-3 rounded-lg">{error}</div>}
                    <SmartConfigFields smart={smart} setSmart={setSmart} />
                    <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-5">
                        <button onClick={onClose} className="px-5 py-3 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm">Cancel</button>
                        <button onClick={save} disabled={saving}
                            className="px-6 py-3 rounded-lg bg-gray-900 text-white font-bold text-sm hover:bg-black disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [invites, setInvites] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [notice, setNotice] = useState('');

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

    const [showInviteForm, setShowInviteForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: ''
    });
    const [smart, setSmart] = useState(defaultSmart);
    const [configInvite, setConfigInvite] = useState(null);

    // Refunds tab
    const [refunds, setRefunds] = useState([]);
    const [refundTotals, setRefundTotals] = useState(null);
    const [refundBusy, setRefundBusy] = useState(false);

    // Waitlist tab
    const [waitlistEventId, setWaitlistEventId] = useState('');
    const [waitlistEntries, setWaitlistEntries] = useState([]);
    const [waitlistBusy, setWaitlistBusy] = useState(false);

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
                api.get('/bookings/my') // Admin gets all bookings
            ]);
            setInvites(invitesRes.data);
            setBookings(bookingsRes.data);
            if (!waitlistEventId && invitesRes.data[0]) setWaitlistEventId(invitesRes.data[0]._id);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRefunds = async () => {
        try {
            const { data } = await api.get('/refunds');
            setRefunds(data.refunds || []);
            setRefundTotals(data.totals || null);
        } catch (error) {
            console.error('Error fetching refunds', error);
        }
    };

    const fetchWaitlist = async (eventId) => {
        if (!eventId) return;
        try {
            const { data } = await api.get(`/waitlist/event/${eventId}`);
            setWaitlistEntries(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching waitlist', error);
        }
    };

    useEffect(() => {
        if (tab === 'refunds') fetchRefunds();
        if (tab === 'waitlist') fetchWaitlist(waitlistEventId);
    }, [tab, waitlistEventId]);

    const decideRefund = async (id, decision) => {
        if (!window.confirm(`${decision === 'approve' ? 'Approve and pay out' : 'Reject'} this refund?`)) return;
        setRefundBusy(true);
        try {
            await api.put(`/refunds/${id}`, { decision });
            fetchRefunds();
        } catch (error) {
            alert(error.response?.data?.error || 'Refund decision failed');
        } finally {
            setRefundBusy(false);
        }
    };

    const promoteWaitlist = async () => {
        if (!waitlistEventId) return;
        setWaitlistBusy(true);
        try {
            const { data } = await api.post(`/waitlist/event/${waitlistEventId}/promote`, { seats: 1 });
            setNotice(data.message || 'Seats promoted');
            fetchWaitlist(waitlistEventId);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Promote failed');
        } finally {
            setWaitlistBusy(false);
        }
    };

    const handleCreateInvite = async (e) => {
        e.preventDefault();
        try {
            await api.post('/invites', { ...formData, ...buildSmartPayload(smart) });
            setShowInviteForm(false);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
            setSmart(defaultSmart());
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating invite');
        }
    };

    const handleDeleteInvite = async (id) => {
        if (window.confirm('Are you sure you want to delete this invite?')) {
            try {
                await api.delete(`/invites/${id}`);
                fetchData();
            } catch (error) {
                alert('Error deleting invite');
            }
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error confirming booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Cancel this user\'s booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading admin panel...</div>;

    const TABS = [
        { id: 'overview', label: 'Overview & Bookings' },
        { id: 'refunds', label: `Refunds${refundTotals?.pending ? ` (${refundTotals.pending})` : ''}` },
        { id: 'waitlist', label: 'Waitlist' }
    ];

    const statusBadge = (status) => {
        if (status === 'confirmed') return 'bg-green-100 text-green-700';
        if (status === 'cancelled') return 'bg-red-100 text-red-700';
        if (status === 'refunded') return 'bg-purple-100 text-purple-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="min-h-screen transition-colors duration-1000 py-8 px-4 sm:px-6" style={{ backgroundColor: currentBgColor }}>
        <div
            className="max-w-7xl mx-auto"
        >
            <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300">Manage events, smart pricing, bookings, refunds &amp; entry.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={() => navigate('/admin/checkin')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition shadow-md text-sm"
                    >
                        Check-in Station
                    </button>
                    <button
                        onClick={() => navigate('/admin/analytics')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-lg transition shadow-md text-sm"
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
                    >
                        {showInviteForm ? 'Cancel Creation' : '+ Create New Invite'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition ${tab === t.id
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {notice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold p-3 rounded-xl mb-6">
                    {notice}
                </div>
            )}

            {tab === 'overview' && (
            <>
            {/* Admin Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-green-600">₹{bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-xl font-bold">₹</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Paid Clients</p>
                        <h3 className="text-3xl font-black text-blue-600">{new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">👤</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Pending Requests</p>
                        <h3 className="text-3xl font-black text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl font-bold">⏳</div>
                </div>
            </div>

            {showInviteForm &&
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 animation-slideDown">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Invite</h2>
        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <input required type="text" placeholder="Event Title" className={inputCls} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <input required type="text" placeholder="Category (e.g., Tech, Music)" className={inputCls} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            <input required type="date" className={inputCls} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            <input required type="text" placeholder="Location" className={inputCls} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            <input required type="number" placeholder="Total Seats" className={inputCls} value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
            <input required type="number" placeholder="Ticket Price (0 for free)" className={inputCls} value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />

            <div className="md:col-span-2">
                <input type="text" placeholder="Image URL (Provide any direct link to an image)" className={inputCls + ' w-full'} value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
            </div>

            <textarea required placeholder="Invite Description" className={inputCls + ' md:col-span-2 h-32 resize-none'} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

            <SmartConfigFields smart={smart} setSmart={setSmart} />

            <button type="submit" className="md:col-span-2 bg-gray-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-black transition shadow-md">Publish Invite</button>
        </form>
    </div>
}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Invites Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">{invites.length}</span>
                        All Invites
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {invites.length === 0 ? <li className="p-6 text-gray-500 text-center">No invites created yet.</li> :
                                invites.map(invite => (
                                    <li key={invite._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 mb-1 leading-tight">{invite.title}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1 font-medium"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {new Date(invite.date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 font-medium"><div className={`w-2 h-2 rounded-full ${invite.availableSeats > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div> {invite.availableSeats}/{invite.totalSeats} seats</span>
                                                {invite.currentPrice != null && (
                                                    <span className="font-bold text-gray-800">
                                                        {invite.symbol || '₹'}{invite.currentPrice}
                                                        {invite.surge && <span className="ml-1 text-[10px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">surge ×{Number(invite.multiplier).toFixed(2)}</span>}
                                                    </span>
                                                )}
                                                {invite.tiersCount > 0 && (
                                                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{invite.tiersCount} tiers</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                            <button onClick={() => setConfigInvite(invite)} className="flex-1 sm:flex-none text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                                                Smart Setup
                                            </button>
                                            <button onClick={() => handleDeleteInvite(invite._id)} className="flex-1 sm:flex-none text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>

                {/* Bookings Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">{bookings.length}</span>
                        Booking Requests
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {bookings.length === 0 ? <li className="p-6 text-gray-500 text-center">No bookings yet.</li> :
                                bookings.map(booking => (
                                    <li key={booking._id} className={`p-6 hover:bg-gray-50 transition border-l-4 ${booking.status === 'pending' ? 'border-l-yellow-400' : booking.status === 'confirmed' ? 'border-l-green-400' : booking.status === 'refunded' ? 'border-l-purple-400' : 'border-l-red-400'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{booking.inviteId?.title || 'Deleted Invite'}</h4>
                                            <div className="flex flex-col gap-1 items-end shrink-0 ml-4">
                                                <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${statusBadge(booking.status)}`}>{booking.status}</span>
                                                {booking.status !== 'cancelled' && <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-indigo-100 text-indigo-700' : booking.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-800'}`}>{booking.paymentStatus.replace('_', ' ')}</span>}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100 text-sm">
                                            <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">User:</span>
                                                <span className="font-semibold">{booking.userId?.name}</span>
                                                <span className="text-gray-400">({booking.userId?.email})</span>
                                            </p>
                                            <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">Amount:</span>
                                                <span className={`font-semibold ${booking.amount === 0 ? 'text-green-600' : ''}`}>{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</span>
                                                {booking.quantity > 1 && <span className="text-gray-500 text-xs">({booking.quantity} tickets{booking.tierName ? ` • ${booking.tierName}` : ''})</span>}
                                            </p>
                                            <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">Date:</span>
                                                <span>{new Date(booking.createdAt).toLocaleString()}</span>
                                            </p>
                                            {booking.checkedIn && (
                                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Check-in:</span>
                                                    <span className="font-semibold text-green-600">{booking.checkInMethod || 'scan'} • {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString() : ''}</span>
                                                </p>
                                            )}
                                            {booking.nft?.tokenId && (
                                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">NFT:</span>
                                                    <span className="font-mono text-[11px] text-indigo-600">{booking.nft.tokenId}</span>
                                                </p>
                                            )}
                                            {booking.paymentMethod && booking.paymentMethod !== 'free' && (
                                                <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Method:</span>
                                                    <span className="font-semibold text-indigo-600 uppercase text-xs">{booking.paymentMethod}</span>
                                                    {booking.paymentReference && <span className="font-mono text-gray-400 text-xs">({booking.paymentReference})</span>}
                                                </p>
                                            )}
                                            {booking.inviteId && (
                                                <p className="text-gray-700 flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Seats:</span>
                                                    <span className={`font-bold ${booking.inviteId.availableSeats > 0 ? 'text-green-600' : 'text-red-500'}`}>{booking.inviteId.availableSeats}</span> remaining of {booking.inviteId.totalSeats}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons for admin */}
                                        {booking.status === 'pending' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="flex-1 min-w-[120px] bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                                    ✓ Approve as Paid
                                                </button>
                                                <button onClick={() => handleConfirmBooking(booking._id, 'not_paid')} className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                                    ✓ Approve Undecided
                                                </button>
                                                <button onClick={() => handleCancelBooking(booking._id)} className="w-[80px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2.5 px-3 rounded-lg transition">
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
            </div>
            </>
            )}

            {tab === 'refunds' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-wider mb-1">Requests</p>
                            <h3 className="text-2xl font-black text-gray-800">{refundTotals?.count ?? 0}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-wider mb-1">Pending</p>
                            <h3 className="text-2xl font-black text-yellow-600">{refundTotals?.pending ?? 0}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-wider mb-1">Refunded</p>
                            <h3 className="text-2xl font-black text-purple-600">₹{(refundTotals?.amount ?? 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-wider mb-1">Fees retained</p>
                            <h3 className="text-2xl font-black text-green-600">₹{(refundTotals?.fees ?? 0).toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Refund ledger</h3>
                            <button onClick={fetchRefunds} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Refresh</button>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
                            {refunds.length === 0 && <li className="p-6 text-gray-500 text-center">No refund requests yet.</li>}
                            {refunds.map(r => (
                                <li key={r._id} className="p-5 hover:bg-gray-50 transition">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900">{r.eventId?.title || 'Deleted event'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {r.userId?.name} ({r.userId?.email}) • {new Date(r.createdAt).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {r.reason ? `“${r.reason}”` : 'No reason given'}{r.snapshot?.tier ? ` • ${r.snapshot.tier}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <p className="font-black text-gray-900">₹{r.amount}</p>
                                                <p className="text-[10px] text-gray-500 font-semibold">fee ₹{r.feeAmount || 0} • {r.feePercent || 0}%</p>
                                            </div>
                                            <span className={`px-2 py-1 text-[10px] font-black rounded uppercase ${r.status === 'processed' ? 'bg-purple-100 text-purple-700' : r.status === 'rejected' ? 'bg-red-100 text-red-600' : r.status === 'auto_approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {r.status.replace('_', ' ')}
                                            </span>
                                            {['pending', 'approved'].includes(r.status) && (
                                                <div className="flex gap-2">
                                                    <button disabled={refundBusy} onClick={() => decideRefund(r._id, 'approve')}
                                                        className="bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 text-xs font-bold py-2 px-3 rounded-lg transition disabled:opacity-50">
                                                        Approve
                                                    </button>
                                                    <button disabled={refundBusy} onClick={() => decideRefund(r._id, 'reject')}
                                                        className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2 px-3 rounded-lg transition disabled:opacity-50">
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {tab === 'waitlist' && (
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1">
                            <label className={labelCls}>Event</label>
                            <select className={inputCls} value={waitlistEventId} onChange={e => setWaitlistEventId(e.target.value)}>
                                {invites.length === 0 && <option value="">No events yet</option>}
                                {invites.map(inv => <option key={inv._id} value={inv._id}>{inv.title}</option>)}
                            </select>
                        </div>
                        <button onClick={promoteWaitlist} disabled={waitlistBusy || !waitlistEventId}
                            className="px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-50">
                            {waitlistBusy ? 'Promoting…' : 'Release 1 seat → promote next'}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Queue ({waitlistEntries.length})</h3>
                            <button onClick={() => fetchWaitlist(waitlistEventId)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Refresh</button>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
                            {waitlistEntries.length === 0 && <li className="p-6 text-gray-500 text-center">Nobody is on the waitlist for this event.</li>}
                            {waitlistEntries.map(w => (
                                <li key={w._id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-black shrink-0">
                                            {w.position}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{w.userId?.name || 'Unknown user'}</p>
                                            <p className="text-xs text-gray-500 truncate">{w.userId?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-gray-500 font-semibold">{w.quantity} seat{w.quantity > 1 ? 's' : ''}</span>
                                        {w.holdExpiresAt && w.status === 'promoted' && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                                hold → {new Date(w.holdExpiresAt).toLocaleTimeString()}
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 text-[10px] font-black rounded uppercase ${w.status === 'promoted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {w.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500 font-semibold">
                        Seats open automatically when a paid booking is cancelled or refunded — the first person in the queue is promoted and notified across all channels.
                    </p>
                </div>
            )}
        </div>

        {configInvite && (
            <SmartConfigModal
                invite={configInvite}
                onClose={() => setConfigInvite(null)}
                onSaved={() => { setConfigInvite(null); fetchData(); }}
            />
        )}
        </div>
    );
};

export default AdminDashboard;
