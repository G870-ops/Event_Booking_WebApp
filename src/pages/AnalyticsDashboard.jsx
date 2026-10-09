import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import {
    FaChartLine, FaCoins, FaUsers, FaRobot, FaSyncAlt, FaSpinner,
    FaArrowLeft, FaCalendarCheck, FaBullhorn, FaCheckCircle
} from 'react-icons/fa';

const TABS = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine size={12} /> },
    { id: 'finance', label: 'Finance & Gateways', icon: <FaCoins size={12} /> },
    { id: 'attendees', label: 'Attendees', icon: <FaUsers size={12} /> },
    { id: 'automation', label: 'Automation', icon: <FaRobot size={12} /> }
];

const Stat = ({ label, value, accent = 'text-white', hint = '' }) => (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{label}</p>
        <p className={`text-2xl font-black font-mono ${accent}`}>{value}</p>
        {hint && <p className="text-[10px] text-slate-600 font-bold mt-1">{hint}</p>}
    </div>
);

const Bar = ({ value, max, color = 'bg-indigo-500', label, right }) => (
    <div className="mb-2.5">
        <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-semibold truncate">{label}</span>
            <span className="text-slate-300 font-bold shrink-0 ml-2">{right}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${max ? Math.max(4, (value / max) * 100) : 0}%` }}></div>
        </div>
    </div>
);

const AnalyticsDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [overview, setOverview] = useState(null);
    const [finance, setFinance] = useState(null);
    const [attendees, setAttendees] = useState(null);
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');
    const [eventReport, setEventReport] = useState(null);
    const [reminders, setReminders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [broadcast, setBroadcast] = useState({ title: '', body: '' });

    useEffect(() => {
        if (!user || user.role !== 'admin') navigate('/login');
    }, [user, navigate]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, fi, at, ev] = await Promise.all([
                api.get('/analytics/overview'),
                api.get('/analytics/finance'),
                api.get('/analytics/attendees'),
                api.get('/invites')
            ]);
            setOverview(ov.data);
            setFinance(fi.data);
            setAttendees(at.data);
            setEvents(ev.data);
            setEventId(prev => prev || (ev.data[0] && ev.data[0]._id) || '');
        } catch (err) {
            console.error('Analytics load failed', err);
        } finally {
          setLoading(false);
        }
    }, []);

    const loadEventReport = useCallback(async (id) => {
        if (!id) return;
        try {
            const { data } = await api.get(`/analytics/event/${id}`);
            setEventReport(data);
        } catch (err) {
            console.error('Event report failed', err);
        }
    }, []);

    const loadReminders = useCallback(async () => {
        try {
            const { data } = await api.get('/automation/reminders/status');
            setReminders(data);
        } catch (err) {
            console.error('Reminders status failed', err);
        }
    }, []);

    useEffect(() => {
        loadAll();
        loadReminders();
    }, [loadAll, loadReminders]);

    useEffect(() => { loadEventReport(eventId); }, [eventId, loadEventReport]);

    const runReminders = async () => {
        setBusy(true);
        setNotice('');
        try {
            const { data } = await api.post('/automation/reminders/run', {});
            setNotice(`Reminder sweep complete — ${data.sent} sent, ${data.skipped} already delivered.`);
            loadReminders();
        } catch (err) {
            setNotice(err.response?.data?.error || 'Reminder run failed');
        } finally {
            setBusy(false);
        }
    };

    const sendBroadcast = async () => {
        if (!broadcast.title.trim()) return;
        setBusy(true);
        setNotice('');
        try {
            const { data } = await api.post('/automation/broadcast', { ...broadcast, toAll: true });
            setNotice(`Broadcast dispatched to ${data.delivered}/${data.total} users.`);
            setBroadcast({ title: '', body: '' });
        } catch (err) {
            setNotice(err.response?.data?.error || 'Broadcast failed');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-indigo-400 font-mono text-xs">
                <FaSpinner className="animate-spin text-lg" /> Loading analytics…
            </div>
        );
    }

    const maxRevenue = Math.max(1, ...(overview?.revenueByDay || []).map(r => r.revenue));
    const maxChannel = Math.max(1, ...(overview?.byChannel || []).map(c => c.revenue));

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <button onClick={() => navigate('/admin')} className="text-[11px] font-bold text-slate-400 hover:text-white mb-1">← Admin Dashboard</button>
                        <h1 className="text-2xl md:text-3xl font-black text-white font-display">Revenue &amp; Attendance Analytics</h1>
                        <p className="text-xs text-slate-400 mt-1">Real-time sales velocity, conversion, drop-off and multi-currency finance</p>
                    </div>
                    <button onClick={loadAll} className="self-start px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2">
                        <FaSyncAlt size={11} /> Refresh
                    </button>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 border transition ${tab === t.id
                                ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {notice && (
                    <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-200 p-3 rounded-xl text-xs font-semibold mb-5 flex items-center gap-2">
                        <FaCheckCircle /> {notice}
                    </div>
                )}

                {tab === 'overview' && overview && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Stat label="Gross revenue" value={`₹${overview.revenue.gross.toLocaleString()}`} accent="text-emerald-400" hint={`${overview.bookings.paid} paid orders`} />
                            <Stat label="Net after refunds" value={`₹${overview.revenue.net.toLocaleString()}`} accent="text-cyan-400" hint={`₹${overview.revenue.refunded.toLocaleString()} refunded`} />
                            <Stat label="Confirm rate" value={`${overview.conversion.confirmRate}%`} accent="text-indigo-400" hint={`${overview.conversion.dropOff} dropped off`} />
                            <Stat label="Attendance rate" value={`${overview.conversion.attendanceRate}%`} accent="text-amber-400" hint={`${overview.bookings.confirmed} confirmed`} />
                            <Stat label="Avg order value" value={`₹${overview.revenue.avgOrderValue}`} accent="text-purple-400" hint={`${overview.engagement.attendees} unique attendees`} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Revenue — last 30 days</h3>
                                <div className="flex items-end gap-1.5 h-48">
                                    {(overview.revenueByDay.length ? overview.revenueByDay : [{ date: 'n/a', revenue: 0, bookings: 0 }]).map(row => (
                                        <div key={row.date} className="flex-1 group relative flex flex-col justify-end h-full">
                                            <div
                                                className="w-full bg-gradient-to-t from-indigo-700 to-indigo-400 rounded-t transition-all min-h-[3px]"
                                                style={{ height: `${Math.max(3, (row.revenue / maxRevenue) * 100)}%` }}
                                            ></div>
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[9px] bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                {row.date.slice(5)} • ₹{row.revenue}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 font-bold mt-2">
                                    <span>30d ago</span><span>Today</span>
                                </div>
                            </div>

                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Conversion funnel</h3>
                                {overview.funnel.map((step, i) => (
                                    <Bar key={step.label} label={step.label} value={step.value} max={overview.funnel[0].value}
                                        right={step.value} color={['bg-slate-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'][i]} />
                                ))}
                                <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-[11px]">
                                    <p className="flex justify-between"><span className="text-slate-500">Started</span><b>{overview.bookings.created}</b></p>
                                    <p className="flex justify-between"><span className="text-slate-500">Pending</span><b className="text-amber-400">{overview.bookings.pending}</b></p>
                                    <p className="flex justify-between"><span className="text-slate-500">Cancelled</span><b className="text-rose-400">{overview.bookings.cancelled}</b></p>
                                    <p className="flex justify-between"><span className="text-slate-500">Waitlist active</span><b className="text-purple-400">{overview.engagement.waitlistActive}</b></p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Revenue by payment channel</h3>
                                {overview.byChannel.length === 0 && <p className="text-xs text-slate-600">No paid orders yet.</p>}
                                {overview.byChannel.map(c => (
                                    <Bar key={c.channel} label={c.channel.toUpperCase()} value={c.revenue} max={maxChannel}
                                        right={`₹${c.revenue.toLocaleString()} • ${c.count}`} color="bg-cyan-600" />
                                ))}
                            </div>
                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Per-event report</h3>
                                <select value={eventId} onChange={e => setEventId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500 mb-4">
                                    {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                                </select>
                                {eventReport && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            <Stat label="Revenue" value={`₹${eventReport.revenue.gross}`} accent="text-emerald-400" />
                                            <Stat label="Bookings" value={eventReport.bookings.total} accent="text-indigo-400" />
                                            <Stat label="Seat fill" value={`${eventReport.seatFill}%`} accent="text-cyan-400" />
                                        </div>
                                        <div className="text-[11px] space-y-1.5 bg-slate-950 border border-slate-800 rounded-xl p-3">
                                            <p className="flex justify-between"><span className="text-slate-500">Checked in</span><b>{eventReport.attendance.checkedIn}/{eventReport.attendance.confirmed} ({eventReport.attendance.rate}%)</b></p>
                                            <p className="flex justify-between"><span className="text-slate-500">Sales velocity (7d)</span><b>{eventReport.salesVelocity7d} bookings</b></p>
                                            <p className="flex justify-between"><span className="text-slate-500">Waitlist</span><b>{eventReport.waitlist}</b></p>
                                            <p className="flex justify-between"><span className="text-slate-500">Poll votes</span><b>{eventReport.engagement.pollVotes}</b></p>
                                            <p className="flex justify-between"><span className="text-slate-500">Questions</span><b>{eventReport.engagement.questions}</b></p>
                                            <p className="flex justify-between"><span className="text-slate-500">Pending value</span><b className="text-amber-400">₹{eventReport.revenue.pending}</b></p>
                                        </div>
                                        {eventReport.byTier.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tier performance</p>
                                                {eventReport.byTier.map(t => (
                                                    <Bar key={t.tier} label={t.tier} value={t.revenue} max={Math.max(1, ...eventReport.byTier.map(x => x.revenue))}
                                                        right={`₹${t.revenue} • ${t.sold} sold`} color="bg-purple-600" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Refund engine status</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Stat label="Refund requests" value={overview.refunds.count} />
                                <Stat label="Refunded value" value={`₹${overview.refunds.amount.toLocaleString()}`} accent="text-rose-400" />
                                <Stat label="Fees retained" value={`₹${overview.refunds.fees.toLocaleString()}`} accent="text-emerald-400" />
                                <Stat label="Events live" value={overview.engagement.events} accent="text-indigo-400" />
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'finance' && finance && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Stat label="Gross settled" value={`₹${finance.totals.gross.toLocaleString()}`} accent="text-emerald-400" />
                            <Stat label="Net payout" value={`₹${finance.totals.net.toLocaleString()}`} accent="text-cyan-400" />
                            <Stat label="Refunded" value={`₹${finance.totals.refunded.toLocaleString()}`} accent="text-rose-400" />
                            <Stat label="Platform fees kept" value={`₹${finance.totals.feesRetained.toLocaleString()}`} accent="text-amber-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Gateways</h3>
                                {finance.gateways.length === 0 && <p className="text-xs text-slate-600">No settled payments yet.</p>}
                                {finance.gateways.map(g => (
                                    <Bar key={g.gateway} label={g.gateway.toUpperCase()} value={g.revenue} max={Math.max(1, ...finance.gateways.map(x => x.revenue))}
                                        right={`₹${g.revenue.toLocaleString()} • ${g.count}`} color="bg-emerald-600" />
                                ))}
                            </div>
                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Multi-currency settlement</h3>
                                {finance.currency.breakdown.length === 0 && <p className="text-xs text-slate-600">No currency data yet.</p>}
                                {finance.currency.breakdown.map(c => (
                                    <div key={c.currency} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0 text-xs">
                                        <span className="font-bold text-slate-300">{c.currency}</span>
                                        <span className="font-mono text-slate-400">{c.count} orders</span>
                                        <span className="font-black text-white">{c.revenue.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Revenue by category</h3>
                                {finance.byCategory.length === 0 && <p className="text-xs text-slate-600">No data yet.</p>}
                                {finance.byCategory.map(c => (
                                    <Bar key={c.category} label={c.category} value={c.revenue} max={Math.max(1, ...finance.byCategory.map(x => x.revenue))}
                                        right={`₹${c.revenue.toLocaleString()}`} color="bg-purple-600" />
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Refund ledger</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                                            <th className="text-left py-2">Status</th>
                                            <th className="text-left py-2">Count</th>
                                            <th className="text-right py-2">Amount</th>
                                            <th className="text-right py-2">Fees</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {finance.refunds.map(r => (
                                            <tr key={r.status} className="border-t border-slate-800">
                                                <td className="py-2.5 font-bold text-slate-300 uppercase">{r.status}</td>
                                                <td className="py-2.5 text-slate-400">{r.count}</td>
                                                <td className="py-2.5 text-right font-mono text-white">₹{r.amount.toLocaleString()}</td>
                                                <td className="py-2.5 text-right font-mono text-emerald-400">₹{(r.fees || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {finance.refunds.length === 0 && (
                                            <tr><td colSpan="4" className="py-4 text-center text-slate-600">No refunds recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'attendees' && attendees && (
                    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Attendee &amp; pass register ({attendees.rows.length})</h3>
                            <span className="text-[10px] text-slate-500 font-bold">Total users: {attendees.totalUsers}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[820px]">
                                <thead>
                                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                                        <th className="text-left py-2">Attendee</th>
                                        <th className="text-left py-2">Event</th>
                                        <th className="text-left py-2">Tier</th>
                                        <th className="text-right py-2">Amount</th>
                                        <th className="text-center py-2">Status</th>
                                        <th className="text-center py-2">Check-in</th>
                                        <th className="text-left py-2">NFT token</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.rows.map(row => (
                                        <tr key={row._id} className="border-t border-slate-800 hover:bg-slate-950/50">
                                            <td className="py-2.5">
                                                <p className="font-bold text-white">{row.attendee}</p>
                                                <p className="text-slate-500 text-[10px]">{row.email}</p>
                                            </td>
                                            <td className="py-2.5 text-slate-300">{row.event}</td>
                                            <td className="py-2.5 text-slate-400">{row.tier}</td>
                                            <td className="py-2.5 text-right font-mono text-white">{row.amount === 0 ? 'FREE' : `₹${row.amount}`}</td>
                                            <td className="py-2.5 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${row.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300' : row.status === 'pending' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-center">
                                                {row.checkedIn
                                                    ? <span className="text-emerald-400 font-bold">✓ {row.method}</span>
                                                    : <span className="text-slate-600">—</span>}
                                            </td>
                                            <td className="py-2.5 font-mono text-[10px] text-indigo-300">{row.nft || '—'}</td>
                                        </tr>
                                    ))}
                                    {attendees.rows.length === 0 && (
                                        <tr><td colSpan="7" className="py-6 text-center text-slate-600">No bookings yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'automation' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <FaCalendarCheck /> Multi-channel reminder queue
                                </h3>
                                <button onClick={runReminders} disabled={busy}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50">
                                    {busy ? <FaSpinner className="animate-spin" size={10} /> : <FaSyncAlt size={10} />} Run now
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-4">
                                Sends Email + SMS + WhatsApp + Push + In-App reminders at the 7d, 24h and 1h windows. Runs automatically every 15 minutes.
                                {reminders?.lastRunAt ? ` Last run: ${new Date(reminders.lastRunAt).toLocaleString()}` : ''}
                            </p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {(reminders?.events || []).map(row => (
                                    <div key={row.eventId} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{row.title}</p>
                                            <p className="text-slate-500 text-[10px]">{new Date(row.date).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-black uppercase text-[10px] ${row.window ? 'text-amber-400' : 'text-slate-600'}`}>{row.window || 'no window'}</p>
                                            <p className="text-[10px] text-slate-500">{row.confirmedBookings} passes • {row.alreadySent} sent</p>
                                        </div>
                                    </div>
                                ))}
                                {(reminders?.events || []).length === 0 && <p className="text-xs text-slate-600">No events in the next 7 days.</p>}
                            </div>
                        </div>

                        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                                <FaBullhorn /> Broadcast campaign
                            </h3>
                            <div className="space-y-3">
                                <input value={broadcast.title} onChange={e => setBroadcast({ ...broadcast, title: e.target.value })}
                                    placeholder="Notification title"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                <textarea rows={4} value={broadcast.body} onChange={e => setBroadcast({ ...broadcast, body: e.target.value })}
                                    placeholder="Message body — delivered to Email, WhatsApp, Push and the in-app bell."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none" />
                                <button onClick={sendBroadcast} disabled={busy || !broadcast.title.trim()}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                    {busy ? <FaSpinner className="animate-spin" /> : <FaBullhorn />} Send to all verified users
                                </button>
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1.5">
                                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-2">Channel status</p>
                                <p>• <b>Email:</b> SMTP via EMAIL_USER / EMAIL_PASS</p>
                                <p>• <b>SMS:</b> Fast2SMS or Twilio</p>
                                <p>• <b>WhatsApp:</b> WHATSAPP_TOKEN + WHATSAPP_PHONE_ID</p>
                                <p>• <b>Push:</b> in-app bell always on; Web Push with VAPID keys</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
