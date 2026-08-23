import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaTicketAlt, FaShieldAlt, FaKey, FaChevronRight } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const data = await login(email, password);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setError('Account not verified. A new verification OTP has been sent to your email.');
            } else {
                setError(err.message || err);
            }
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
                    <h2 className="text-3xl font-black text-white mb-2 leading-tight tracking-tight font-display">Welcome Back</h2>
                    <p className="text-slate-400 text-xs font-medium">Access your Invitor secure gateway</p>
                </div>

                {error && (
                    <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 rounded-xl mb-6 text-center text-xs font-semibold leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!showOTP ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email ID or Mobile Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="name@domain.com or 10-digit mobile number"
                                        className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition duration-200"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••••••"
                                        className="w-full bg-slate-950 border border-slate-800/90 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition duration-200"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex flex-col items-center mb-4 text-center">
                                <div className="w-12 h-12 bg-cyan-950/50 border border-cyan-800/30 text-cyan-400 rounded-full flex items-center justify-center mb-2">
                                    <FaShieldAlt size={18} />
                                </div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Verification Code (OTP)</label>
                                <p className="text-xs text-slate-500">We have dispatched a verification pass token to your email</p>
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
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                        {loading ? 'Processing Secures...' : (
                            <>
                                {showOTP ? 'Authorize OTP Verification' : 'Sign In Gateway'} <FaChevronRight size={10} />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-400 text-xs font-semibold">
                    New to the network? 
                    <Link to="/register" className="text-indigo-400 font-bold hover:underline ml-1">Create account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
