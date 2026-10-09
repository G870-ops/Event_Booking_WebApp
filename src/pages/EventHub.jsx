import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import LiveStreamPanel from '../components/engage/LiveStreamPanel';
import PollsQA from '../components/engage/PollsQA';
import FloorMap from '../components/engage/FloorMap';
import NetworkingPanel from '../components/engage/NetworkingPanel';
import {
    FaArrowLeft, FaSpinner, FaVideo, FaPoll, FaChair, FaRobot,
    FaTicketAlt, FaBell, FaSyncAlt, FaQrcode
} from 'react-icons/fa';

const TABS = [
    { id: 'stream', label: 'Live & Hybrid', icon: <FaVideo size={12} /> },
    { id: 'engage', label: 'Polls, Q&A & Chat', icon: <FaPoll size={12} /> },
    { id: 'map', label: 'Venue Floor Map', icon: <FaChair size={12} /> },
    { id: 'network', label: 'AI Networking', icon: <FaRobot size={12} /> }
];

const EventHub = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('stream');
    const [lastSync, setLastSync] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const fetchHub = useCallback(async (silent = false) => {
        if (!silent) setSyncing(true);
        try {
            const { data: payload } = await api.get(`/events/${id}/engagement`);
            setData(payload);
            setError('');
            setLastSync(new Date());
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load the event hub');
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchHub();
        const timer = setInterval(() => fetchHub(true), 15000);
        return () => clearInterval(timer);
    }, [fetchHub]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-indigo-400 font-mono text-xs">
                <FaSpinner className="animate-spin text-lg" />
                <span>Opening Event Hub…</span>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-8 text-center flex flex-col items-center justify-center gap-4">
                <p className="text-slate-400">{error}</p>
                <Link to={`/invites/${id}`} className="text-indigo-400 hover:underline font-bold text-sm flex items-center gap-2">
                    <FaArrowLeft /> Back to event
                </Link>
            </div>
        );
    }

    const event = data.event || {};
    const virtual = data.virtual || {};
    const streamBadge = virtual.streamUrl ? 'LIVE' : 'HYBRID READY';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 md:p-6 mb-6 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <Link to={`/invites/${id}`} className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-white transition mb-2">
                                <FaArrowLeft size={10} /> Back to event
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-white font-display leading-tight truncate">{event.title}</h1>
                            <p className="text-xs text-slate-400 mt-1">
                                {event.date ? new Date(event.date).toLocaleString() : ''} • {event.location}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${virtual.streamUrl
                                ? 'bg-red-950/60 border-red-700 text-red-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {streamBadge}
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-950/60 border border-indigo-700 text-indigo-300">
                                {event.availableSeats}/{event.totalSeats} seats
                            </span>
                            <button onClick={() => fetchHub()} disabled={syncing}
                                className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 disabled:opacity-50">
                                <FaSyncAlt className={syncing ? 'animate-spin' : ''} size={9} /> Sync
                            </button>
                            {!data.canInteract && (
                                <button onClick={() => navigate(`/invites/${id}`)}
                                    className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5">
                                    <FaTicketAlt size={9} /> Get pass
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition border ${tab === t.id
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><FaBell size={9} /> Live data refreshes every 15s</span>
                        <span>{lastSync ? `Synced ${lastSync.toLocaleTimeString()}` : ''}</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-xl text-xs font-semibold mb-5 flex items-center justify-between gap-3">
                        <span>{error}</span>
                        <button onClick={() => fetchHub()} className="text-[11px] font-bold underline shrink-0">Retry</button>
                    </div>
                )}

                {tab === 'stream' && <LiveStreamPanel virtual={virtual} event={event} canInteract={data.canInteract} />}
                {tab === 'engage' && <PollsQA eventId={id} data={data} onRefresh={() => fetchHub(true)} />}
                {tab === 'map' && <FloorMap eventId={id} data={data} onRefresh={() => fetchHub(true)} />}
                {tab === 'network' && (
                    user ? <NetworkingPanel eventId={id} data={data} onRefresh={() => fetchHub(true)} /> : (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
                            <FaQrcode className="mx-auto text-indigo-400 mb-3" size={26} />
                            <p className="text-sm font-bold text-white mb-1">Sign in to unlock AI matchmaking</p>
                            <p className="text-xs text-slate-400 mb-5 max-w-md mx-auto">
                                Networking recommendations, connection requests and profile matching require an Invitor account.
                            </p>
                            <Link to="/login" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs">
                                Sign in
                            </Link>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default EventHub;
