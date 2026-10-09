import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { FaBell, FaTimes, FaCheckDouble } from 'react-icons/fa';

const NotificationBell = () => {
    const { user } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef(null);

    const load = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/automation/notifications/my');
            setItems(data.items || []);
            setUnread(data.unread || 0);
        } catch (err) {
            console.error('Notification load failed', err);
        }
    }, [user]);

    useEffect(() => {
        load();
        if (!user) return;
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, [user, load]);

    useEffect(() => {
        const onDoc = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const markAll = async () => {
        try {
            await api.post('/automation/notifications/read-all');
            load();
        } catch (err) {
            console.error('Mark all failed', err);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={boxRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition"
                title="Notifications"
            >
                <FaBell size={15} />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</p>
                        <div className="flex items-center gap-2">
                            <button onClick={markAll} title="Mark all read"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition">
                                <FaCheckDouble size={11} />
                            </button>
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition">
                                <FaTimes size={11} />
                            </button>
                        </div>
                    </div>

                    {loading && <p className="p-4 text-xs text-slate-500">Loading…</p>}

                    {!loading && items.length === 0 && (
                        <div className="p-6 text-center">
                            <FaBell className="mx-auto text-slate-700 mb-2" size={20} />
                            <p className="text-xs text-slate-500">You're all caught up.</p>
                        </div>
                    )}

                    {items.map(n => (
                        <div key={n._id}
                            className={`px-4 py-3 border-b border-slate-900 last:border-0 ${n.read ? 'opacity-60' : 'bg-indigo-950/20'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-white">{n.title}</p>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1"></span>}
                            </div>
                            {n.body && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>}
                            <p className="text-[9px] text-slate-600 font-bold mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
