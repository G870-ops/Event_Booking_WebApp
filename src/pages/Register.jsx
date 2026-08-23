import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaTicketAlt, FaShieldAlt, FaUser, FaChevronRight } from 'react-icons/fa';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [verificationIdentifier, setVerificationIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                if (!email && !mobile) {
                    setError('Please provide either an Email Address or a Mobile Number.');
                    setLoading(false);
                    return;
                }
                const data = await register(name, email, mobile, password);
                setVerificationIdentifier(data.email);
                setShowOTP(true);
                setError('');
            } else {
                await verifyOTP(verificationIdentifier, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[75vh] flex flex-col justify-center items-center p-4 relative text-slate-100">
            {/* Ambient decorative backgrounds */}
            <div className="absolute top-[20%] left-[10%] ambient-glow opacity-25"></div>
            <div className="absolute bottom-[20%] right-[10%] ambient-glow-cyan opacity-20"></div>

            <div className="glass-panel rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl relative border border-slate-800/80 z-10 hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-600/5">
                        <FaTicketAlt size={22} className="animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 leading-tight tracking-tight font-display">Create Account</h2>
                    <p className="text-slate-400 text-xs font-medium">Join the Invitor event coordinate network</p>
                </div>

                {error && (
                    <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 rounded-xl mb-6 text-center text-xs font-semibold leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!showOTP ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="your name"
                                    className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition duration-200"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address (Optional if Mobile provided)</label>
                                <input
                                    type="email"
                                    placeholder="name@domain.com"
                                    className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition duration-200"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mobile Number (Optional if Email provided)</label>
                                <input
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition duration-200"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                    maxLength="10"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition duration-200"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex flex-col items-center mb-4 text-center">
                                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 rounded-full flex items-center justify-center mb-2 animate-bounce">
                                    <FaShieldAlt size={18} />
                                </div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Verification Code (OTP)</label>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    A security OTP verification pass has been generated for <strong className="text-slate-300">{verificationIdentifier}</strong>. Enter it below to unlock your credentials.
                                </p>
                            </div>
                            <input
                                type="text"
                                required
                                placeholder="000000"
                                className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3.5 text-center text-xl font-mono tracking-widest font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition duration-200"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                maxLength="6"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
                    >
                        {loading ? 'Transmitting credentials...' : (
                            <>
                                {showOTP ? 'Authorize Registration' : 'Register Account'} <FaChevronRight size={10} />
                            </>
                        )}
                    </button>
                </form>

                {!showOTP && (
                    <p className="text-center mt-6 text-slate-400 text-xs font-semibold">
                        Already have credentials? 
                        <Link to="/login" className="text-indigo-400 font-bold hover:underline ml-1">Sign in</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Register;
