import React, { useState } from 'react';
import { User } from '../types';
import { login, sendLoginOtp, verifyLoginOtp } from '../services';
import { Icons } from '../constants';
import { useAppContext } from '../App';

const LoginPage: React.FC = () => {
    const { setUser } = useAppContext();
    const [activeTab, setActiveTab] = useState<'pin' | 'qr'>('pin');
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
    const [otp, setOtp] = useState('');
    const [userForOtp, setUserForOtp] = useState<User | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(pin, password);
            if (result) {
                if ('otpRequired' in result && result.otpRequired) {
                    setUserForOtp(result.user);
                    await sendLoginOtp(result.user);
                    setLoginStep('otp');
                } else if ('id' in result) {
                    setUser(result);
                }
            } else {
                setError('Invalid PIN or Password. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred during login.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userForOtp) return;
        setError('');
        setLoading(true);
        try {
            const verifiedUser = await verifyLoginOtp(userForOtp.id, otp);
            if (verifiedUser) {
                setUser(verifiedUser);
            } else {
                setError('Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred during OTP verification.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleBackToLogin = () => {
        setLoginStep('credentials');
        setUserForOtp(null);
        setError('');
        setOtp('');
        setPin('');
        setPassword('');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-accent-500 to-primary-900 opacity-40 animate-gradient-bg"></div>
             <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-radial from-slate-900/10 to-slate-900"></div>
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 z-10 animate-fade-in-down">
                {loginStep === 'credentials' ? (
                    <>
                        <div className="text-center mb-8">
                            <Icons.logoWithText className="w-48 h-auto mx-auto animate-logo-breath" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-lg mb-6">
                            <button onClick={() => setActiveTab('pin')} className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'pin' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>PIN & Password</button>
                            <button onClick={() => setActiveTab('qr')} className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'qr' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>QR Code</button>
                        </div>
                        
                        {activeTab === 'pin' ? (
                            <form onSubmit={handleLogin}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">PIN</label>
                                        <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="e.g., FAC-01" className="w-full mt-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">Password</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow" />
                                    </div>
                                </div>
                                {error && <p className="text-red-400 text-sm mt-4 text-center animate-fade-in">{error}</p>}
                                <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 disabled:bg-primary-800 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center animate-fade-in">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mira-desktop-login&bgcolor=22d3ee&color=0f172a&qzone=1" alt="QR Code" className="mx-auto rounded-lg" />
                                <p className="mt-4 text-slate-300">Scan this with the Mira mobile app to log in instantly.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold text-center text-slate-200 mb-2">Email Verification</h2>
                        <p className="text-slate-400 text-center mb-6">An OTP has been sent to bhanu***@gmail.com. Please enter it below.</p>
                        <form onSubmit={handleOtpSubmit}>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Enter OTP</label>
                                <input 
                                    type="text" 
                                    value={otp} 
                                    onChange={e => setOtp(e.target.value)} 
                                    maxLength={6}
                                    placeholder="______" 
                                    className="w-full mt-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow text-center text-2xl tracking-[0.5em]" 
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm mt-4 text-center animate-fade-in">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 disabled:bg-primary-800 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </button>
                        </form>
                        <button onClick={handleBackToLogin} className="w-full text-center mt-4 text-sm text-slate-400 hover:text-white transition-colors">
                            &larr; Back to login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;