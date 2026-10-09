import React, { useState } from 'react';
import api from '../../utils/axios';
import { FaChair, FaMapMarkerAlt, FaLock, FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';

const FloorMap = ({ eventId, data, onRefresh }) => {
    const floorMap = data.floorMap || { zones: [] };
    const zones = floorMap.zones || [];
    const seats = data.seats || [];
    const mySeats = data.mySeats || [];
    const canInteract = data.canInteract;
    const [busySeat, setBusySeat] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const seatMap = seats.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

    const toggleSeat = async (seatId, zoneId) => {
        const isMine = mySeats.includes(seatId);
        setBusySeat(seatId);
        setError('');
        setNotice('');
        try {
            if (isMine) {
                if (!window.confirm('Release this seat?')) return;
                await api.post(`/events/${eventId}/seats`, { seatId, zone: zoneId, release: true });
                setNotice('Seat released.');
            } else {
                await api.post(`/events/${eventId}/seats`, { seatId, zone: zoneId });
                setNotice('Seat reserved for you.');
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.response?.data?.error || 'Could not update seat');
        } finally {
            setBusySeat('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300">
                        <FaChair /> Interactive Venue Floor Map
                        <span className="text-slate-500 normal-case tracking-normal font-bold">({floorMap.mapType})</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700 border border-slate-600"></span> Open</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600"></span> Yours</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-800/70"></span> Taken</span>
                    </div>
                </div>

                {error && <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-xl text-xs font-semibold mb-3">{error}</div>}
                {notice && <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs font-semibold mb-3">{notice}</div>}

                {floorMap.mapImageUrl && (
                    <img src={floorMap.mapImageUrl} alt="Venue map" className="w-full max-h-64 object-cover rounded-xl mb-4 border border-slate-800" />
                )}

                {/* Stage / screen indicator */}
                <div className="mx-auto w-2/3 max-w-md text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 bg-slate-900 border border-slate-800 rounded-lg py-2 mb-6">
                    {floorMap.mapType === 'booth' ? 'Expo Backwall' : 'Stage'}
                </div>

                <div className="space-y-8">
                    {zones.map(zone => (
                        <div key={zone.id}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-indigo-400" size={11} /> {zone.name}
                                </p>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {zone.rows}×{zone.cols} • {zone.priceMultiplier && zone.priceMultiplier !== 1 ? `${zone.priceMultiplier}x price` : 'standard'}
                                </span>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 overflow-x-auto">
                                <div className="flex flex-col gap-1.5 min-w-max mx-auto w-max">
                                    {Array.from({ length: zone.rows }).map((_, r) => (
                                        <div key={r} className="flex gap-1.5 items-center">
                                            <span className="w-5 text-[9px] text-slate-600 font-bold text-center">{String.fromCharCode(65 + r)}</span>
                                            {Array.from({ length: zone.cols }).map((__, c) => {
                                                const seatId = `${zone.id}-${r + 1}-${c + 1}`;
                                                const seat = seatMap[seatId];
                                                const mine = mySeats.includes(seatId);
                                                const taken = !!seat && !mine;
                                                const disabled = busySeat === seatId || (!canInteract && !mine);
                                                return (
                                                    <button
                                                        key={seatId}
                                                        onClick={() => !taken && toggleSeat(seatId, zone.id)}
                                                        disabled={taken || disabled}
                                                        title={taken ? `Taken${seat?.label ? ' • ' + seat.label : ''}` : mine ? 'Your seat — click to release' : `${zone.name} seat ${String.fromCharCode(65 + r)}${c + 1}`}
                                                        className={`w-7 h-7 rounded-md border text-[8px] font-black transition flex items-center justify-center
                                                            ${mine ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40'
                                                                : taken ? 'bg-rose-950/70 border-rose-900 text-rose-300/70 cursor-not-allowed'
                                                                    : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:bg-indigo-900 hover:border-indigo-500 hover:text-white cursor-pointer'}
                                                            ${busySeat === seatId ? 'opacity-50' : ''}`}
                                                    >
                                                        {busySeat === seatId ? <FaSpinner className="animate-spin" /> : mine ? <FaCheckCircle /> : taken ? <FaLock size={9} /> : c + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!canInteract && (
                    <div className="mt-5 flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl font-semibold">
                        <FaLock size={10} /> Seat selection unlocks after you book a pass.
                    </div>
                )}
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Your reserved spots</h3>
                {mySeats.length === 0 ? (
                    <p className="text-xs text-slate-500 flex items-center gap-2"><FaTimesCircle className="text-slate-600" size={11} /> No seats reserved yet.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {mySeats.map(id => (
                            <span key={id} className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700 text-indigo-200 text-[11px] font-bold font-mono">
                                {id}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-[10px] text-slate-600 mt-3 font-semibold">
                    {seats.length} seat(s) reserved across all attendees • reserved spots sync to your digital pass.
                </p>
            </div>
        </div>
    );
};

export default FloorMap;
