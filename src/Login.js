import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: email, 2: otp
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulasi login - ganti dengan logika autentikasi nyata
        if (email && password) {
            navigate('/dashboard');
        } else {
            setMessage('Harap isi email dan password.');
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        if (step === 1) {
            if (forgotEmail) {
                // Simulasi kirim OTP
                alert(`OTP dikirim ke ${forgotEmail}. (Simulasi: OTP adalah 123456)`);
                setStep(2);
                setMessage('');
            } else {
                setMessage('Harap isi email.');
            }
        } else {
            if (otp === '123456') { // Simulasi OTP
                alert('Password reset berhasil! Cek email Anda.');
                setShowForgotPassword(false);
                setStep(1);
                setForgotEmail('');
                setOtp('');
            } else {
                setMessage('OTP salah. Coba lagi.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {!showForgotPassword ? (
                    <>
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Portal Login</h2>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Masukkan email Anda"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Masukkan password Anda"
                                    required
                                />
                            </div>
                            {message && <p className="text-red-500 text-sm">{message}</p>}
                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                            >
                                Masuk
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setShowForgotPassword(true)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                Lupa Password?
                            </button>
                        </div>
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="text-slate-500 hover:text-slate-700 text-sm"
                            >
                                Kembali ke Beranda
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Reset Password</h2>
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            {step === 1 ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Masukkan email Anda"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Kode OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Masukkan kode OTP"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-2">OTP dikirim ke email Anda. (Simulasi: 123456)</p>
                                </div>
                            )}
                            {message && <p className="text-red-500 text-sm">{message}</p>}
                            <button
                                type="submit"
                                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                            >
                                {step === 1 ? 'Kirim OTP' : 'Konfirmasi'}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setStep(1);
                                    setForgotEmail('');
                                    setOtp('');
                                    setMessage('');
                                }}
                                className="text-slate-500 hover:text-slate-700 text-sm"
                            >
                                Kembali ke Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;