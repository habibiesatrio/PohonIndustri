import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Database,
    Layers,
    Microscope,
    Landmark,
    LogOut,
    LayoutDashboard,
    User,
    Bell,
    Settings,
    Download,
    ChevronDown,
    Globe,
    Target,
    TrendingUp,
    ArrowRight
} from 'lucide-react';

// --- Reusable UI Components ---
const NavItem = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${active ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-slate-500 hover:bg-slate-50'}`}>
        {icon} {label}
    </button>
);

const MetricCard = ({ label, val, sub, icon }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-4 group">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-red-50 transition-colors">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <h4 className="text-2xl font-black text-slate-900 leading-none">{val}</h4>
            {sub && <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{sub}</p>}
        </div>
    </div>
);


const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [activeDashTab, setActiveDashTab] = useState('hilirisasi');
    const [isHilirisasiOpen, setHilirisasiOpen] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center"><p>Loading user data...</p></div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] font-sans text-slate-900 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col p-6 sticky top-0 h-screen z-50">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-100">
                        <LayoutDashboard className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Intelligence</h1>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Portal Admin BRIN</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavItem active={activeDashTab === 'hilirisasi'} onClick={() => setActiveDashTab('hilirisasi')} icon={<Layers size={18} />} label="Hilirisasi Nasional" />
                    <NavItem active={activeDashTab === 'paten'} onClick={() => setActiveDashTab('paten')} icon={<Microscope size={18} />} label="Analitik Paten" />
                    <NavItem active={activeDashTab === 'sektoral'} onClick={() => setActiveDashTab('sektoral')} icon={<Landmark size={18} />} label="Data Sektoral" />
                    <div className="relative">
                        <button onClick={() => setHilirisasiOpen(!isHilirisasiOpen)} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase transition-all text-slate-500 hover:bg-slate-50`}>
                            <div className="flex items-center gap-3"><Database size={18} /> Manajemen Hilirisasi</div>
                            <ChevronDown size={18} className={`transition-transform ${isHilirisasiOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isHilirisasiOpen && (
                            <div className="pl-8 pt-2 space-y-2">
                                <button onClick={() => navigate('/data-management')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all text-slate-500 hover:bg-slate-100`}>Manajemen Data</button>
                                <button onClick={() => navigate('/pohon-industri')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all text-slate-500 hover:bg-slate-100`}>Pohon Industri</button>
                            </div>
                        )}
                    </div>
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-50">
                     <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black">
                            {(user?.nama || user?.email)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase">{user?.nama || user?.email || 'User'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Lihat Profile</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-600 font-bold text-xs uppercase transition-colors">
                        <LogOut size={18} /> Logout Portal
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Sistem Industri dan Manufaktur Berkelanjutan</h2>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Update Data: 12 Jan 2026</p>
                    </div>
                     <div className="flex gap-4">
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all"><Bell size={20} /></button>
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all"><Settings size={20} /></button>
                        <button className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-red-100 hover:bg-red-700 transition-all"><Download size={16} /> Export Report</button>
                    </div>
                </header>

                {activeDashTab === 'hilirisasi' && (
                    <div className="animate-in fade-in duration-500 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <MetricCard label="Total Komoditas Strategis" val="95" sub="Sesuai Roadmap 2045" icon={<Database className="text-red-600" />} />
                            <MetricCard label="Maturitas Rata-rata" val="TRL 7.2" sub="Trend Meningkat" icon={<Target className="text-indigo-600" />} />
                            <MetricCard label="Nilai Tambah Agregat" val="35.4x" sub="Target: 50x" icon={<TrendingUp className="text-emerald-600" />} />
                            <MetricCard label="Status Swasembada" val="64%" sub="Proyeksi 2026" icon={<Globe className="text-amber-600" />} />
                        </div>
                    </div>
                )}
                {activeDashTab === 'paten' && <div className="bg-white p-8 rounded-2xl"><h2 className="font-bold text-xl">Analitik Paten</h2><p>Content for this tab goes here.</p></div>}
                {activeDashTab === 'sektoral' && <div className="bg-white p-8 rounded-2xl"><h2 className="font-bold text-xl">Data Sektoral</h2><p>Content for this tab goes here.</p></div>}

            </main>
        </div>
    );
};

export default Dashboard;