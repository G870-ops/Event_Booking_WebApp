import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/axios';
import {
    FaRobot, FaUserFriends, FaBriefcase, FaTags, FaPlus, FaCheck, FaTimes,
    FaSpinner, FaLightbulb, FaTicketAlt, FaComments
} from 'react-icons/fa';

const TagEditor = ({ label, tags, onChange, color = 'indigo' }) => {
    const [draft, setDraft] = useState('');
    const add = () => {
        const value = draft.trim();
        if (!value) return;
        if (!tags.includes(value)) onChange([...tags, value]);
        setDraft('');
    };
    return (
        <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
            <div className="flex gap-2">
                <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder="Type and press Enter"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button onClick={add} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"><FaPlus size={10} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => onChange(tags.filter(t => t !== tag))}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${color === 'cyan'
                            ? 'bg-cyan-950/50 border-cyan-800 text-cyan-300 hover:border-rose-500'
                            : 'bg-indigo-950/50 border-indigo-800 text-indigo-300 hover:border-rose-500'}`}
                        title="Remove"
                    >
                        {tag} <FaTimes size={8} />
                    </button>
                ))}
                {tags.length === 0 && <span className="text-[10px] text-slate-600">None yet</span>}
            </div>
        </div>
    );
};

const NetworkingPanel = ({ eventId, data, onRefresh }) => {
    const [profile, setProfile] = useState({ bio: '', company: '', role: '', interests: [], skills: [], links: [] });
    const [recs, setRecs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, recsRes] = await Promise.allSettled([
                api.get('/auth/profile'),
                api.get(`/events/${eventId}/networking`)
            ]);
            if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.profile || profile);
            if (recsRes.status === 'fulfilled') {
                setRecs(recsRes.value.data);
                setMessage('');
            } else {
                setRecs({ recommendations: [], error: recsRes.reason?.response?.data?.error || 'Networking locked' });
            }
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const saveProfile = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.put('/auth/profile', profile);
            setMessage('Profile saved — matching model refreshed.');
            await load();
            if (onRefresh) onRefresh();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Could not save profile');
        } finally {
            setSaving(false);
        }
    };

    const connect = async (userId) => {
        setMessage('');
        try {
            await api.post(`/events/${eventId}/connect`, { userId });
            setMessage('Connection request sent!');
            await load();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Could not send request');
        }
    };

    const respond = async (cid, status) => {
        try {
            await api.post(`/events/${eventId}/connect/${cid}/respond`, { status });
            await load();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Action failed');
        }
    };

    const locked = recs && recs.error;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 h-max">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300 mb-4">
                    <FaTags /> Networking Profile
                </h3>
                {message && <div className="bg-indigo-950/40 border border-indigo-800 text-indigo-200 p-2.5 rounded-lg text-[11px] font-semibold mb-3">{message}</div>}

                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Headline role</label>
                        <input value={profile.role || ''} onChange={e => setProfile({ ...profile, role: e.target.value })}
                            placeholder="e.g. Frontend Engineer"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Company / school</label>
                        <input value={profile.company || ''} onChange={e => setProfile({ ...profile, company: e.target.value })}
                            placeholder="e.g. Acme Labs"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Bio</label>
                        <textarea rows={3} value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="What are you looking for at this event?"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none" />
                    </div>
                    <TagEditor label="Interests" tags={profile.interests || []} onChange={interests => setProfile({ ...profile, interests })} />
                    <TagEditor label="Skills" tags={profile.skills || []} onChange={skills => setProfile({ ...profile, skills })} color="cyan" />
                    <button onClick={saveProfile} disabled={saving}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} Save profile
                    </button>
                </div>
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-2 space-y-6">
                <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-300">
                            <FaRobot /> AI Matchmaking
                        </h3>
                        {recs && (
                            <span className="text-[10px] text-slate-500 font-bold">
                                {recs.attendeesConsidered || 0} attendees • model {recs.model}
                            </span>
                        )}
                    </div>

                    {loading && <div className="flex items-center gap-2 text-xs text-slate-500"><FaSpinner className="animate-spin" /> Running match engine…</div>}

                    {!loading && locked && (
                        <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl font-semibold">
                            <FaTicketAlt size={11} /> {recs.error}
                        </div>
                    )}

                    {!loading && !locked && (recs?.recommendations || []).length === 0 && (
                        <p className="text-xs text-slate-500">
                            No matches yet. Add interests and skills to your profile, and check back as other attendees register.
                        </p>
                    )}

                    <div className="space-y-3">
                        {(recs?.recommendations || []).map(row => {
                            const already = (recs.connections || []).some(c => String(c.to) === String(row.user._id) || String(c.from) === String(row.user._id));
                            return (
                                <div key={row.user._id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shrink-0">
                                        {row.user.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{row.user.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                                                    {row.user.role || 'Attendee'}{row.user.company ? ` • ${row.user.company}` : ''}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-black text-emerald-400 font-mono leading-none">{row.score}</p>
                                                <p className="text-[8px] text-slate-500 font-bold uppercase">match</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {row.reasons.map((reason, i) => (
                                                <p key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                                                    <FaLightbulb className="text-amber-400 mt-0.5 shrink-0" size={9} /> {reason}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {[...row.sharedInterests, ...row.sharedSkills].slice(0, 6).map(t => (
                                                <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-900 text-indigo-300 text-[9px] font-bold">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="shrink-0 self-center">
                                        <button
                                            onClick={() => connect(row.user._id)}
                                            disabled={already}
                                            className={`px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${already
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-emerald-700 hover:bg-emerald-600 text-white'}`}
                                        >
                                            <FaUserFriends size={10} /> {already ? 'Requested' : 'Connect'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Suggested sessions & sponsors */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300 mb-3">
                            <FaComments /> Recommended sessions
                        </h3>
                        {(recs?.sessions || []).length === 0 && <p className="text-xs text-slate-500">No sessions published.</p>}
                        <div className="space-y-2">
                            {(recs?.sessions || []).map((s, i) => (
                                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                                    <p className="text-xs font-bold text-white">{s.title || s.name}</p>
                                    <p className="text-[10px] text-slate-500">{s.time || s.speaker || ''}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300 mb-3">
                            <FaBriefcase /> Matched sponsors
                        </h3>
                        {(recs?.sponsors || []).length === 0 && <p className="text-xs text-slate-500">No sponsors published.</p>}
                        <div className="space-y-2">
                            {(recs?.sponsors || []).map((s, i) => (
                                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-bold text-white">{s.name}</p>
                                        <p className="text-[10px] text-slate-500">{s.booth ? `Booth ${s.booth}` : s.offer || ''}</p>
                                    </div>
                                    {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-amber-400 hover:underline">Visit</a>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Connections */}
                <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">My connections</h3>
                    {(recs?.connections || []).length === 0 && <p className="text-xs text-slate-500">No connection requests yet.</p>}
                    <div className="space-y-2">
                        {(recs?.connections || []).map(c => (
                            <div key={c._id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-300 font-semibold">Request #{c._id.slice(-6)} • {c.status}</span>
                                {c.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => respond(c._id, 'accepted')} className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold"><FaCheck size={9} /> Accept</button>
                                        <button onClick={() => respond(c._id, 'declined')} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"><FaTimes size={9} /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default NetworkingPanel;
