import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { db, auth } from './firebase';

const Daftar = () => {
    const [nama, setNama] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nomorHp, setNomorHp] = useState('');
    const [bio, setBio] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleDaftar = (e) => {
        e.preventDefault();
        if (nama && email && password) {
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    set(ref(db, 'users/' + user.uid), {
                        nama: nama,
                        email: email,
                        nomorHp: nomorHp,
                        bio: bio,
                    })
                    .then(() => {
                        alert('Pendaftaran berhasil!');
                        navigate('/login');
                    })
                    .catch((error) => {
                        setMessage('Gagal menyimpan data pengguna.');
                        console.error("Error writing document: ", error);
                    });
                })
                .catch((error) => {
                    setMessage('Gagal mendaftar. Coba lagi.');
                    console.error("Error creating user: ", error);
                });
        } else {
            setMessage('Harap lengkapi semua data.');
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Buat Akun</h2>
                <form onSubmit={handleDaftar} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                        <input
                            type="text"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Masukkan nama lengkap"
                            required
                        />
                    </div>
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
                            placeholder="Buat password Anda"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nomor HP</label>
                        <input
                            type="tel"
                            value={nomorHp}
                            onChange={(e) => setNomorHp(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Masukkan nomor HP Anda"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bio Singkat</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Ceritakan sedikit tentang diri Anda"
                            rows="3"
                        ></textarea>
                    </div>
                    {message && <p className="text-red-500 text-sm">{message}</p>}
                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                        Daftar
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-600">
                        Sudah punya akun?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-red-600 hover:text-red-800 font-medium"
                        >
                            Masuk di sini
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Daftar;