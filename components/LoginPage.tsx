// src/components/LoginPage.tsx

// Import React and the useState hook for managing component state.
import React, { useState } from 'react';
// Import the User type definition.
import { User } from '../types';
// Import authentication-related services.
import { login, sendLoginOtp, verifyLoginOtp } from '../services';
// Import the centralized Icons object.
import { Icons } from '../constants';
// Import the custom hook to access the global application context.
import { useAppContext } from '../App';

// The LoginPage component handles user authentication.
const LoginPage: React.FC = () => {
    // Get the setUser function from the app context to update the global user state upon successful login.
    const { setUser } = useAppContext();
    // State to toggle between PIN login and QR code login tabs.
    const [activeTab, setActiveTab] = useState<'pin' | 'qr'>('pin');
    // State for the user's PIN input.
    const [pin, setPin] = useState('');
    // State for the user's password input.
    const [password, setPassword] = useState('');
    // State to hold and display any login errors.
    const [error, setError] = useState('');
    // State to indicate when an asynchronous operation (like login) is in progress.
    const [loading, setLoading] = useState(false);
    // State to manage the multi-step login flow (e.g., for Super Admin OTP).
    const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
    // State for the OTP input.
    const [otp, setOtp] = useState('');
    // State to temporarily hold the user object while waiting for OTP verification.
    const [userForOtp, setUserForOtp] = useState<User | null>(null);

    // Handles the initial login attempt with PIN and password.
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission behavior.
        setError('');       // Clear any previous errors.
        setLoading(true);   // Set loading state to true.

        try {
            // Call the login service function.
            const result = await login(pin, password);
            if (result) {
                // Check if the result requires OTP verification (for Super Admin).
                if ('otpRequired' in result && result.otpRequired) {
                    setUserForOtp(result.user);     // Store the user object.
                    await sendLoginOtp(result.user); // Trigger the OTP sending process.
                    setLoginStep('otp');            // Move to the OTP entry step.
                } else if ('id' in result) {
                    // If it's a direct login, set the user in the global context.
                    setUser(result);
                }
            } else {
                // If login fails (returns null), set an error message.
                setError('Invalid PIN or Password. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred during login.');
            console.error(err);
        } finally {
            setLoading(false); // Set loading state to false.
        }
    };

    // Handles the submission of the OTP.
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userForOtp) return; // Guard against submission without a user context.
        setError('');
        setLoading(true);
        try {
            // Call the OTP verification service.
            const verifiedUser = await verifyLoginOtp(userForOtp.id, otp);
            if (verifiedUser) {
                // If verification is successful, set the user in the global context.
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
    
    // Resets the component state to go back to the initial login screen from the OTP screen.
    const handleBackToLogin = () => {
        setLoginStep('credentials');
        setUserForOtp(null);
        setError('');
        setOtp('');
        setPin('');
        setPassword('');
    };

    // Render the component UI.
    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
             {/* Decorative background elements. */}
             <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-accent-500 to-primary-900 opacity-40 animate-gradient-bg"></div>
             <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-radial from-slate-900/10 to-slate-900"></div>
            {/* The main login card. */}
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 z-10 animate-fade-in-down">
                {/* Conditionally render the credentials form or the OTP form based on loginStep state. */}
                {loginStep === 'credentials' ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="flex flex-col items-center gap-3">
                                <Icons.logoIcon className="w-16 h-16 text-primary-500 animate-logo-breath" />
                                <h1 className="text-3xl font-bold text-white tracking-tight">Mira Attendance</h1>
                            </div>
                        </div>
                        
                        {/* Tab buttons to switch between PIN and QR login methods. */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-lg mb-6">
                            <button onClick={() => setActiveTab('pin')} className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'pin' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>PIN & Password</button>
                            <button onClick={() => setActiveTab('qr')} className={`py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'qr' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>QR Code</button>
                        </div>
                        
                        {/* Conditionally render the content of the active tab. */}
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
                    // The OTP verification form.
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold text-center text-slate-200 mb-2">Email Verification</h2>
                        <p className="text-slate-400 text-center mb-6">An OTP has been sent to registered email. Please enter it below.</p>
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
