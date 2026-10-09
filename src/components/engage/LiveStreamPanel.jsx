import React from 'react';
import { FaVideo, FaRecordVinyl, FaDoorOpen, FaExternalLinkAlt, FaBroadcastTower } from 'react-icons/fa';

const embeddable = (url = '') =>
    /youtube\.com|youtu\.be|vimeo\.com|facebook\.com\/plugins|meet\.google\.com|zoom\.us/.test(url);

const isHls = (url = '') => /\.m3u8($|\?)/i.test(url);

const LiveStreamPanel = ({ virtual = {}, event, canInteract }) => {
    const streamUrl = virtual.streamUrl || '';
    const recordingUrl = virtual.recordingUrl || '';
    const rooms = virtual.breakoutRooms || [];

    return (
        <div className="space-y-6">
            {/* Main live stage */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300">
                        <FaBroadcastTower /> Live Stage
                    </div>
                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${streamUrl ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></span>
                        {streamUrl ? 'ON AIR' : 'OFFLINE'}
                        {virtual.provider ? <span className="uppercase text-slate-500">• {virtual.provider}</span> : null}
                    </span>
                </div>

                <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
                    {streamUrl ? (
                        isHls(streamUrl) ? (
                            <video src={streamUrl} controls autoPlay muted playsInline className="w-full h-full object-contain bg-black" />
                        ) : embeddable(streamUrl) || streamUrl.startsWith('http') ? (
                            <iframe
                                src={streamUrl}
                                title={`${event?.title || 'Event'} live stream`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Invalid stream URL</div>
                        )
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
                            <FaVideo size={26} />
                            <p className="text-sm font-semibold">No live stream configured for this event</p>
                            <p className="text-[11px] text-slate-600 max-w-sm">
                                The organiser can paste a YouTube / Vimeo / HLS / RTMP-embed URL from the admin dashboard to broadcast to remote attendees.
                            </p>
                        </div>
                    )}
                </div>

                {streamUrl && (
                    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-[11px] text-slate-400">
                        <span className="font-mono truncate max-w-[60%]">{streamUrl}</span>
                        <a href={streamUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold">
                            Open in new tab <FaExternalLinkAlt size={9} />
                        </a>
                    </div>
                )}
            </div>

            {/* Video on demand */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300 mb-3">
                    <FaRecordVinyl /> Video On Demand (Replay)
                </div>
                {recordingUrl ? (
                    isHls(recordingUrl) ? (
                        <video src={recordingUrl} controls className="w-full rounded-xl bg-black" style={{ aspectRatio: '16 / 9' }} />
                    ) : (
                        <a href={recordingUrl} target="_blank" rel="noreferrer"
                            className="block w-full text-center py-3 rounded-xl bg-cyan-950/50 border border-cyan-800/50 text-cyan-300 font-bold text-xs hover:bg-cyan-900/50 transition">
                            Watch recorded session <FaExternalLinkAlt className="inline ml-1" size={10} />
                        </a>
                    )
                ) : (
                    <p className="text-xs text-slate-500">Recording will appear here once the organiser publishes the VOD.</p>
                )}
            </div>

            {/* Breakout rooms / networking booths */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-300 mb-3">
                    <FaDoorOpen /> Virtual Breakout Rooms & Sponsor Booths
                </div>
                {rooms.length === 0 ? (
                    <p className="text-xs text-slate-500">No breakout rooms published yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rooms.map((room, idx) => (
                            <div key={room.id || idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{room.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                                        {room.kind === 'booth' ? 'Networking booth' : room.kind === 'chat' ? 'Live chat room' : 'Video room'}
                                        {room.opensAt ? ` • opens ${new Date(room.opensAt).toLocaleString()}` : ''}
                                    </p>
                                </div>
                                {room.url ? (
                                    <a href={room.url} target="_blank" rel="noreferrer"
                                        className="shrink-0 px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5">
                                        Join <FaExternalLinkAlt size={9} />
                                    </a>
                                ) : (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">Not open</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {!canInteract && (
                    <p className="text-[11px] text-amber-400/80 mt-3 font-semibold">Book a pass to unlock full hybrid participation.</p>
                )}
            </div>
        </div>
    );
};

export default LiveStreamPanel;
