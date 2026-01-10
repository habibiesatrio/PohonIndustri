import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (!user) {
        return null; // or a loading spinner
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center px-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-4xl font-black">
                        {(user.nama || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">{user.nama || user.email}</h2>
                        <p className="text-slate-500">{user.email}</p>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nomor HP</h3>
                        <p className="text-slate-800 text-lg">{user.nomorHp || '-'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Bio</h3>
                        <p className="text-slate-800 text-lg">{user.bio || '-'}</p>
                    </div>
                </div>

                <div className="mt-8 border-t pt-6 text-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-red-600 hover:text-red-800 font-medium"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
