import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/axios';
import {
    FaPoll, FaComments, FaTrophy, FaArrowUp, FaPaperPlane, FaPlus, FaCheckCircle, FaSpinner, FaLock
} from 'react-icons/fa';

const PollsQA = ({ eventId, data, onRefresh }) => {
    const { user } = useContext(AuthContext);
    const polls = data.polls || [];
    const questions = data.questions || [];
    const leaderboard = data.leaderboard || [];
    const chat = data.chat || [];
    const canInteract = data.canInteract;
    const isAdmin = user?.role === 'admin';

    const [questionText, setQuestionText] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [chatText, setChatText] = useState('');
    const [busy, setBusy] = useState(false);
    const [answerDrafts, setAnswerDrafts] = useState({});
    const [pollDraft, setPollDraft] = useState({ question: '', options: '' });
    const [error, setError] = useState('');

    const act = async (fn) => {
        setBusy(true);
        setError('');
        try {
            await fn();
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Action failed');
        } finally {
            setBusy(false);
        }
    };

    const vote = (pollId, optionId) => act(() => api.post(`/events/${eventId}/polls/${pollId}/vote`, { optionId }));
    const ask = () => {
        if (!questionText.trim()) return;
        return act(() => api.post(`/events/${eventId}/questions`, { text: questionText, anonymous })).then(() => setQuestionText(''));
    };
    const upvote = (qid) => act(() => api.post(`/events/${eventId}/questions/${qid}/upvote`));
    const answer = (qid) => act(() => api.post(`/events/${eventId}/questions/${qid}/answer`, { answer: answerDrafts[qid] || '' }));
    const sendChat = () => {
        if (!chatText.trim()) return;
        return act(() => api.post(`/events/${eventId}/chat`, { text: chatText })).then(() => setChatText(''));
    };
    const createPoll = () => {
        const options = pollDraft.options.split(',').map(s => s.trim()).filter(Boolean);
        if (!pollDraft.question.trim() || options.length < 2) {
            setError('Poll needs a question and at least 2 comma-separated options');
            return;
        }
        return act(() => api.post(`/events/${eventId}/polls`, { question: pollDraft.question, options }))
            .then(() => setPollDraft({ question: '', options: '' }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Polls + Q&A */}
            <div className="lg:col-span-2 space-y-6">
                {error && (
                    <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-xl text-xs font-semibold">{error}</div>
                )}

                {/* POLLS */}
                <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300">
                            <FaPoll /> Live Polls
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold">{polls.length} poll{polls.length === 1 ? '' : 's'}</span>
                    </div>

                    {isAdmin && (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-4 space-y-2">
                            <input
                                value={pollDraft.question}
                                onChange={e => setPollDraft({ ...pollDraft, question: e.target.value })}
                                placeholder="Ask the audience…"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-2">
                                <input
                                    value={pollDraft.options}
                                    onChange={e => setPollDraft({ ...pollDraft, options: e.target.value })}
                                    placeholder="Options separated by commas (Yes, No, Maybe)"
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                />
                                <button onClick={createPoll} disabled={busy}
                                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                                    <FaPlus size={10} /> Add
                                </button>
                            </div>
                        </div>
                    )}

                    {polls.length === 0 && <p className="text-xs text-slate-500">No polls yet. Start the conversation!</p>}

                    <div className="space-y-4">
                        {polls.map(poll => (
                            <div key={poll._id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <p className="text-sm font-bold text-white">{poll.question}</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${poll.status === 'open' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-slate-800 text-slate-400'}`}>
                                        {poll.status}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {poll.options.map(opt => {
                                        const selected = poll.myVoteOptionId === opt._id;
                                        return (
                                            <button
                                                key={opt._id}
                                                onClick={() => vote(poll._id, opt._id)}
                                                disabled={busy || poll.status === 'closed'}
                                                className={`relative w-full text-left px-3 py-2.5 rounded-lg border overflow-hidden transition disabled:cursor-not-allowed ${selected ? 'border-indigo-500 bg-indigo-950/40' : 'border-slate-800 bg-slate-950 hover:border-slate-600'}`}
                                            >
                                                <span className="absolute inset-y-0 left-0 bg-indigo-600/25 transition-all" style={{ width: `${opt.percent}%` }}></span>
                                                <span className="relative flex items-center justify-between text-xs font-semibold text-slate-200">
                                                    <span className="flex items-center gap-2">
                                                        {selected && <FaCheckCircle className="text-indigo-400" size={11} />}
                                                        {opt.label}
                                                    </span>
                                                    <span className="font-mono text-slate-400">{opt.percent}% • {opt.votes}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{poll.totalVotes} votes</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Q&A */}
                <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-300 mb-4">
                        <FaComments /> Live Q&A
                    </h3>

                    {canInteract || isAdmin ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-4 space-y-2">
                            <textarea
                                value={questionText}
                                onChange={e => setQuestionText(e.target.value)}
                                rows={2}
                                placeholder="Type your question for the speaker…"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 resize-none"
                            />
                            <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold cursor-pointer">
                                    <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="accent-cyan-500" />
                                    Ask anonymously
                                </label>
                                <button onClick={ask} disabled={busy || !questionText.trim()}
                                    className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                                    {busy ? <FaSpinner className="animate-spin" size={10} /> : <FaPaperPlane size={10} />} Submit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl mb-4 font-semibold">
                            <FaLock size={10} /> Book a pass to join the live discussion.
                        </div>
                    )}

                    <div className="space-y-3">
                        {questions.length === 0 && <p className="text-xs text-slate-500">No questions yet — be the first.</p>}
                        {questions.map(q => (
                            <div key={q._id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => upvote(q._id)}
                                        disabled={busy}
                                        className={`shrink-0 flex flex-col items-center px-2 py-1.5 rounded-lg border text-xs font-bold transition disabled:opacity-50 ${q.upvoted ? 'bg-indigo-950 border-indigo-600 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                                    >
                                        <FaArrowUp size={10} />
                                        {q.upvotes}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-slate-200 font-semibold">{q.text}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">
                                            {q.author} • {new Date(q.createdAt).toLocaleString()}
                                        </p>
                                        {q.answer && (
                                            <div className="mt-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-2.5">
                                                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Organiser answer</p>
                                                <p className="text-xs text-emerald-100/90">{q.answer}</p>
                                            </div>
                                        )}
                                        {isAdmin && (
                                            <div className="mt-2 flex gap-2">
                                                <input
                                                    value={answerDrafts[q._id] || ''}
                                                    onChange={e => setAnswerDrafts({ ...answerDrafts, [q._id]: e.target.value })}
                                                    placeholder="Publish an answer…"
                                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-emerald-500"
                                                />
                                                <button onClick={() => answer(q._id)} disabled={busy}
                                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold disabled:opacity-50">
                                                    Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Live chat */}
                <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-3">Live Chat</h3>
                    <div className="h-56 overflow-y-auto space-y-2 pr-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                        {chat.length === 0 && <p className="text-xs text-slate-600">Say hello 👋</p>}
                        {chat.map(m => (
                            <div key={m._id} className={`text-xs ${m.mine ? 'text-right' : ''}`}>
                                <span className={`font-bold ${m.mine ? 'text-indigo-300' : 'text-slate-300'}`}>{m.name}: </span>
                                <span className="text-slate-400 break-words">{m.text}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <input
                            value={chatText}
                            onChange={e => setChatText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                            placeholder={canInteract || isAdmin ? 'Message everyone…' : 'Book a pass to chat'}
                            disabled={!canInteract && !isAdmin}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                        <button onClick={sendChat} disabled={busy || (!canInteract && !isAdmin) || !chatText.trim()}
                            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">
                            <FaPaperPlane size={11} />
                        </button>
                    </div>
                </section>
            </div>

            {/* Right: leaderboard */}
            <div className="space-y-6">
                <section className="bg-gradient-to-b from-amber-950/40 to-slate-950/70 border border-amber-900/50 rounded-2xl p-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300 mb-4">
                        <FaTrophy /> Gamification Leaderboard
                    </h3>
                    {leaderboard.length === 0 && <p className="text-xs text-slate-500">Points are awarded for voting, asking questions and checking in.</p>}
                    <div className="space-y-2">
                        {leaderboard.map(row => (
                            <div key={row.userId} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${row.mine ? 'bg-indigo-950/50 border-indigo-700' : 'bg-slate-900/60 border-slate-800'}`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${row.rank === 1 ? 'bg-amber-500 text-black' : row.rank === 2 ? 'bg-slate-300 text-black' : row.rank === 3 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        {row.rank}
                                    </span>
                                    <span className="text-xs font-bold text-slate-200 truncate">{row.name}{row.mine ? ' (you)' : ''}</span>
                                </div>
                                <span className="text-[11px] font-black text-amber-300 font-mono shrink-0">{row.points} pts</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">How points work</h3>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 font-semibold">
                        <li>• Cast a poll vote <span className="text-indigo-300 float-right">+{data.gamification?.pointsPerVote ?? 10}</span></li>
                        <li>• Ask a question <span className="text-indigo-300 float-right">+{data.gamification?.pointsPerQuestion ?? 20}</span></li>
                        <li>• Upvote a question <span className="text-indigo-300 float-right">+5</span></li>
                        <li>• Ticket purchase <span className="text-indigo-300 float-right">+25</span></li>
                        <li>• On-site check-in <span className="text-indigo-300 float-right">+{data.gamification?.pointsPerCheckIn ?? 50}</span></li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default PollsQA;
