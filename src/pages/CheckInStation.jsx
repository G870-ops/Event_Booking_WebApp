import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import {
    FaQrcode, FaFingerprint, FaTabletAlt, FaSearch, FaCheckCircle, FaTimesCircle,
    FaExclamationTriangle, FaSpinner, FaSyncAlt, FaUndo, FaPrint, FaTicketAlt, FaUsers
} from 'react-icons/fa';

const MODES = [
    { id: 'qr', label: 'QR / Code', icon: <FaQrcode size={13} /> },
    { id: 'rfid', label: 'RFID Wristband', icon: <FaFingerprint size={13} /> },
    { id: 'face', label: 'Face Check-in', icon: <FaSearch size={13} /> },
    { id: 'kiosk', label: 'Self-Service Kiosk', icon: <FaTabletAlt size={13} /> }
];

const emptyKiosk = { name: '', email: '', mobile: '', quantity: 1, paymentMethod: 'cash' };

const CheckInStation = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');
    const [mode, setMode] = useState('qr');
    const [code, setCode] = useState('');
    const [faceName, setFaceName] = useState('');
    const [faceDescriptor, setFaceDescriptor] = useState('');
    const [kiosk, setKiosk] = useState(emptyKiosk);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [badge, setBadge] = useState(null);
    const scanRef = useRef(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') navigate('/login');
    }, [user, navigate]);

    const loadEvents = useCallback(async () => {
        try {
            const { data } = await api.get('/invites');
            setEvents(data);
            setEventId(prev => prev || (data[0] && data[0]._id) || '');
        } catch (err) {
            console.error('Failed to load events', err);
        }
    }, []);

    const loadStats = useCallback(async () => {
        if (!eventId) return;
        try {
            const { data } = await api.get(`/checkin/event/${eventId}`);
            setStats(data);
        } catch (err) {
            console.error('Gate stats failed', err);
        }
    }, [eventId]);

    useEffect(() => { loadEvents(); }, [loadEvents]);
    useEffect(() => { loadStats(); const t = setInterval(loadStats, 8000); return () => clearInterval(t); }, [loadStats]);
    useEffect(() => { if (mode === 'qr' || mode === 'rfid') scanRef.current?.focus(); }, [mode]);

    const handleResult = (data, fallbackMessage) => {
        setResult({
            type: data.result || (data.valid ? 'success' : 'invalid'),
            title: data.message || fallbackMessage,
            detail: data.error || '',
            attendee: data.attendee,
            event: data.event,
            score: data.faceScore,
            at: new Date()
        });
        loadStats();
    };

    const submitScan = async (e) => {
        e && e.preventDefault();
        if (!code.trim() || busy) return;
        setBusy(true);
        setResult(null);
        try {
            const endpoint = mode === 'rfid' ? '/checkin/rfid' : '/checkin/scan';
            const { data } = await api.post(endpoint, {
                code: code.trim(),
                method: mode,
                eventId,
                gate: mode === 'rfid' ? 'RFID-GATE' : 'MAIN-GATE',
                device: 'GATE-STATION'
            });
            handleResult(data, 'Checked in');
        } catch (err) {
            const payload = err.response?.data || {};
            setResult({
                type: payload.result || 'invalid',
                title: payload.error || 'Scan rejected',
                detail: payload.message || '',
                attendee: payload.attendee,
                score: payload.faceScore,
                at: new Date()
            });
            loadStats();
        } finally {
            setBusy(false);
            setCode('');
            scanRef.current?.focus();
        }
    };

    const submitFace = async () => {
        if ((!faceDescriptor.trim() && !faceName.trim()) || busy) return;
        setBusy(true);
        setResult(null);
        try {
            const { data } = await api.post('/checkin/face', {
                faceDescriptor: faceDescriptor.trim() || undefined,
                lookupName: faceName.trim() || undefined,
                eventId,
                gate: 'FACE-GATE',
                device: 'CAM-01'
            });
            handleResult(data, 'Face matched');
        } catch (err) {
            const payload = err.response?.data || {};
            setResult({
                type: payload.result || 'invalid',
                title: payload.error || 'No face match',
                detail: payload.message || '',
                attendee: payload.attendee,
                at: new Date()
            });
        } finally {
            setBusy(false);
            setFaceDescriptor('');
            setFaceName('');
        }
    };

    const submitKiosk = async (e) => {
        e.preventDefault();
        if (!kiosk.name.trim()) return;
        setBusy(true);
        try {
            const { data } = await api.post('/checkin/kiosk', { ...kiosk, eventId, gate: 'KIOSK-01' });
            setBadge(data.badge);
            setResult({
                type: 'success',
                title: 'Walk-up registration complete',
                detail: `Badge queued for printing • ${data.badge.amount === 0 ? 'Free' : '₹' + data.badge.amount}`,
                attendee: { name: data.badge.attendee },
                at: new Date()
            });
            setKiosk(emptyKiosk);
            loadStats();
        } catch (err) {
            setResult({ type: 'invalid', title: err.response?.data?.error || 'Kiosk registration failed', at: new Date() });
        } finally {
            setBusy(false);
        }
    };

    const runSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const { data } = await api.get('/checkin/search', { params: { q: searchQuery } });
            setSearchResults(data);
        } catch (err) {
            console.error('Search failed', err);
        }
    };

    const undo = async (bookingId) => {
        if (!window.confirm('Revert this check-in?')) return;
        try {
            await api.post(`/checkin/${bookingId}/undo`);
            setResult(null);
            loadStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Undo failed');
        }
    };

    const resultStyles = {
        success: { border: 'border-emerald-700', bg: 'bg-emerald-950/50', text: 'text-emerald-300', icon: <FaCheckCircle size={34} /> },
        duplicate: { border: 'border-amber-700', bg: 'bg-amber-950/50', text: 'text-amber-300', icon: <FaExclamationTriangle size={34} /> },
        denied: { border: 'border-rose-800', bg: 'bg-rose-950/50', text: 'text-rose-300', icon: <FaTimesCircle size={34} /> },
        invalid: { border: 'border-rose-800', bg: 'bg-rose-950/50', text: 'text-rose-300', icon: <FaTimesCircle size={34} /> }
    };

    const style = result ? (resultStyles[result.type] || resultStyles.invalid) : null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <button onClick={() => navigate('/admin')} className="text-[11px] font-bold text-slate-400 hover:text-white mb-1">← Admin Dashboard</button>
                        <h1 className="text-2xl md:text-3xl font-black text-white font-display">Gate Check-In Station</h1>
                        <p className="text-xs text-slate-400 mt-1">QR &amp; RFID gate control • facial recognition • self-service kiosk badge printing</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={eventId}
                            onChange={e => { setEventId(e.target.value); setStats(null); setResult(null); }}
                            className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 max-w-[260px]"
                        >
                            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                        </select>
                        <button onClick={loadStats} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white">
                            <FaSyncAlt size={12} />
                        </button>
                    </div>
                </div>

                {/* Live gate stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: 'Confirmed', value: stats?.confirmed ?? '—', color: 'text-indigo-300' },
                        { label: 'Checked in', value: stats?.checkedIn ?? '—', color: 'text-emerald-300' },
                        { label: 'Awaiting entry', value: stats?.pending ?? '—', color: 'text-amber-300' },
                        { label: 'Attendance', value: stats ? `${stats.attendanceRate}%` : '—', color: 'text-cyan-300' },
                        { label: 'Waitlist', value: stats?.waitlist ?? '—', color: 'text-purple-300' }
                    ].map(card => (
                        <div key={card.label} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{card.label}</p>
                            <p className={`text-2xl font-black font-mono ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Scanner */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                                {MODES.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => { setMode(m.id); setResult(null); }}
                                        className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 border transition ${mode === m.id
                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                                    >
                                        {m.icon} {m.label}
                                    </button>
                                ))}
                            </div>

                            {(mode === 'qr' || mode === 'rfid') && (
                                <form onSubmit={submitScan} className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {mode === 'rfid' ? 'Tap wristband or enter RFID code' : 'Scan QR or paste gate pass token'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            ref={scanRef}
                                            value={code}
                                            onChange={e => setCode(e.target.value)}
                                            placeholder={mode === 'rfid' ? 'RFID-XXXXXXXXXXXX' : 'IVT-XXXX-XXXX-XXXX-XXXX-XXXXXXXX'}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-sm font-mono text-white tracking-wider outline-none focus:border-indigo-500"
                                            autoFocus
                                        />
                                        <button type="submit" disabled={busy || !code.trim()}
                                            className="px-5 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2">
                                            {busy ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Check in
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-semibold">Scanner wedge input supported — just scan and the pass is verified instantly.</p>
                                </form>
                            )}

                            {mode === 'face' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Attendee name (fallback biometric lookup)</label>
                                        <input value={faceName} onChange={e => setFaceName(e.target.value)} placeholder="e.g. Alice Smith"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Face descriptor token (from enrolled device / camera API)</label>
                                        <input value={faceDescriptor} onChange={e => setFaceDescriptor(e.target.value)} placeholder="Paste descriptor captured by the camera module"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none focus:border-indigo-500" />
                                    </div>
                                    <button onClick={submitFace} disabled={busy || (!faceDescriptor.trim() && !faceName.trim())}
                                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
                                        {busy ? <FaSpinner className="animate-spin" /> : <FaSearch />} Verify identity &amp; admit
                                    </button>
                                    <p className="text-[10px] text-slate-500">
                                        Contactless entry: the descriptor is hashed server-side and matched against enrolled biometric tokens. Attendees enrol from their dashboard.
                                    </p>
                                </div>
                            )}

                            {mode === 'kiosk' && (
                                <form onSubmit={submitKiosk} className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input required placeholder="Attendee full name" value={kiosk.name}
                                            onChange={e => setKiosk({ ...kiosk, name: e.target.value })}
                                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                        <input placeholder="Email (optional)" value={kiosk.email} type="email"
                                            onChange={e => setKiosk({ ...kiosk, email: e.target.value })}
                                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                        <input placeholder="Mobile (optional)" value={kiosk.mobile}
                                            onChange={e => setKiosk({ ...kiosk, mobile: e.target.value })}
                                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                        <select value={kiosk.paymentMethod} onChange={e => setKiosk({ ...kiosk, paymentMethod: e.target.value })}
                                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500">
                                            <option value="cash">Pay at venue (cash)</option>
                                            <option value="card">Card terminal</option>
                                            <option value="free">Free entry</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase">Tickets</label>
                                        <input type="number" min="1" max="10" value={kiosk.quantity}
                                            onChange={e => setKiosk({ ...kiosk, quantity: Number(e.target.value) })}
                                            className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
                                        <button type="submit" disabled={busy}
                                            className="flex-1 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
                                            {busy ? <FaSpinner className="animate-spin" /> : <FaTabletAlt />} Register &amp; print badge
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Result */}
                        {result && (
                            <div className={`border-2 ${style.border} ${style.bg} rounded-3xl p-6`}>
                                <div className="flex items-start gap-4">
                                    <div className={style.text}>{style.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-xl font-black ${style.text}`}>{result.title}</h3>
                                        {result.detail && <p className="text-xs text-slate-300 mt-1">{result.detail}</p>}
                                        {result.attendee && (
                                            <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                                                <p><span className="text-slate-500 font-bold w-20 inline-block">Attendee</span> <span className="text-white font-semibold">{result.attendee.name}</span></p>
                                                <p><span className="text-slate-500 font-bold w-20 inline-block">Contact</span> {result.attendee.email || result.attendee.mobile}</p>
                                                {result.event?.title && <p><span className="text-slate-500 font-bold w-20 inline-block">Event</span> {result.event.title}</p>}
                                                {typeof result.score === 'number' && result.score > 0 && (
                                                    <p><span className="text-slate-500 font-bold w-20 inline-block">Face score</span> {(result.score * 100).toFixed(1)}%</p>
                                                )}
                                                <p><span className="text-slate-500 font-bold w-20 inline-block">Time</span> {result.at.toLocaleTimeString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Printed badge */}
                        {badge && (
                            <div className="bg-white text-slate-900 rounded-3xl p-6 border-4 border-dashed border-slate-300 relative">
                                <button onClick={() => setBadge(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"><FaTimesCircle /></button>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black tracking-[0.3em] uppercase">INVITOR • ON-SITE BADGE</span>
                                    <span className="text-[10px] font-black uppercase">{badge.tier}</span>
                                </div>
                                <h2 className="text-3xl font-black leading-none">{badge.attendee}</h2>
                                <p className="text-sm font-semibold text-slate-600 mt-1">{badge.event}</p>
                                <div className="flex items-center gap-4 mt-5">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(badge.qrToken)}`} alt="badge qr" className="w-28 h-28" />
                                    <div className="text-xs space-y-1">
                                        <p><b>Tickets:</b> {badge.quantity}</p>
                                        <p><b>Amount:</b> {badge.amount === 0 ? 'FREE' : `₹${badge.amount}`}</p>
                                        <p className="font-mono"><b>QR:</b> {badge.qrToken}</p>
                                        <p className="font-mono"><b>RFID:</b> {badge.rfidCode}</p>
                                        {badge.nftTokenId && <p className="font-mono"><b>NFT:</b> {badge.nftTokenId}</p>}
                                    </div>
                                </div>
                                <button onClick={() => window.print()} className="mt-5 w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 print:hidden">
                                    <FaPrint /> Print badge
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search + recent scans */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><FaSearch /> Manual lookup</h3>
                            <div className="flex gap-2">
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
                                    placeholder="Name, email, QR or booking id"
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500" />
                                <button onClick={runSearch} className="px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Go</button>
                            </div>
                            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                                {searchResults.map(b => (
                                    <div key={b._id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px]">
                                        <p className="font-bold text-white">{b.userId?.name || 'Unknown'} <span className="text-slate-500 font-normal">• {b.eventId?.title}</span></p>
                                        <p className="text-slate-500 font-mono truncate">{b.qrToken || b._id}</p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className={`font-black uppercase ${b.checkedIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {b.checkedIn ? 'Checked in' : b.status}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setCode(b.qrToken || b._id)} className="text-indigo-400 font-bold hover:underline">Use code</button>
                                                {b.checkedIn && <button onClick={() => undo(b._id)} className="text-rose-400 font-bold hover:underline">Undo</button>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {searchQuery && searchResults.length === 0 && <p className="text-[11px] text-slate-600">No matches.</p>}
                            </div>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                <FaUsers /> Recent gate activity
                            </h3>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto">
                                {(stats?.recent || []).map(log => (
                                    <div key={log._id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-[11px]">
                                        <div className="min-w-0">
                                            <p className="text-white font-bold truncate">{log.userId?.name || 'Unknown'}</p>
                                            <p className="text-slate-500 truncate">{new Date(log.createdAt).toLocaleTimeString()} • {log.method} • {log.gate}</p>
                                        </div>
                                        <span className={`font-black uppercase shrink-0 ${log.result === 'success' ? 'text-emerald-400' : log.result === 'duplicate' ? 'text-amber-400' : 'text-rose-400'}`}>
                                            {log.result}
                                        </span>
                                    </div>
                                ))}
                                {stats && (stats.recent || []).length === 0 && <p className="text-[11px] text-slate-600">No scans yet for this event.</p>}
                            </div>
                            {stats?.byMethod && Object.keys(stats.byMethod).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                                    {Object.entries(stats.byMethod).map(([method, count]) => (
                                        <span key={method} className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                            {method}: <span className="text-indigo-300">{count}</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckInStation;
