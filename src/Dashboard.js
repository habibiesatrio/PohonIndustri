import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
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
    ArrowUpCircle,
    ArrowDownCircle,
    Zap,
    Sheet,
    GitMerge
} from 'lucide-react';

// --- MOCK DATA FOR TRL/MRL/CRL ---
const mockTechData = {
    '7201': { status: 'Hulu', trl: 4, mrl: 3, crl: 2, drive: 'Medium Demand' },
    '7202': { status: 'Hulu', trl: 5, mrl: 4, crl: 3, drive: 'High Demand' },
    '7206': { status: 'Hilir', trl: 7, mrl: 7, crl: 6, drive: 'High Demand' },
    '7218': { status: 'Hilir', trl: 8, mrl: 8, crl: 8, drive: 'High Demand' },
    '7219': { status: 'Hilir', trl: 9, mrl: 9, crl: 9, drive: 'Medium Demand' },
    '7304': { status: 'Hilir', trl: 9, mrl: 9, crl: 9, drive: 'High Demand' },
    'default': { status: 'N/A', trl: 1, mrl: 1, crl: 1, drive: 'Low Demand' }
};

// --- Reusable UI Components ---
const NavItem = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${active ? 'bg-sky-600 text-white shadow-lg shadow-sky-100' : 'text-slate-500 hover:bg-slate-50'}`}>
        {icon} {label}
    </button>
);

const MetricCard = ({ label, val, sub, icon }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-4 group">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-sky-50 transition-colors">{icon}</div>
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
    const [hilirisasiData, setHilirisasiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [flowFilter, setFlowFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    useEffect(() => {
        if (user) { // Only fetch data if the user is authenticated
            const fetchData = async () => {
                setLoading(true);
                try {
                    const querySnapshot = await getDocs(collection(db, "pohon_industri"));
                    const dataList = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        const techData = mockTechData[data.cmdCode] || mockTechData.default;
                        return {
                            id: doc.id,
                            ...data,
                            ...techData
                        };
                    });
                    setHilirisasiData(dataList);
                } catch (error) {
                    console.error("Error fetching hilirisasi data:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [user]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const filteredData = useMemo(() => {
        if (flowFilter === 'All') {
            return hilirisasiData;
        }
        return hilirisasiData.filter(item => item.flowDesc === flowFilter);
    }, [hilirisasiData, flowFilter]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center"><p>Loading user data...</p></div>;
    }

    return (
        <div className="min-h-screen bg-sky-50 font-sans text-slate-900 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col p-6 sticky top-0 h-screen z-50">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-100"><LayoutDashboard className="text-white w-6 h-6" /></div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Intelligence</h1>
                        <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Portal Admin BRIN</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavItem active={activeDashTab === 'hilirisasi'} onClick={() => setActiveDashTab('hilirisasi')} icon={<Layers size={18} />} label="Hilirisasi Nasional" />
                    <NavItem active={activeDashTab === 'paten'} onClick={() => setActiveDashTab('paten')} icon={<Microscope size={18} />} label="Analitik Paten" />
                    <NavItem active={activeDashTab === 'sektoral'} onClick={() => setActiveDashTab('sektoral')} icon={<Landmark size={18} />} label="Data Sektoral" />
                    <NavItem active={false} onClick={() => navigate('/data-management')} icon={<Database size={18} />} label="Manajemen Data" />
                    <NavItem active={false} onClick={() => navigate('/pohon-industri')} icon={<GitMerge size={18} />} label="Pohon Industri" />
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-50">
                     <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-black">{(user?.nama || user?.email)?.charAt(0).toUpperCase() || 'U'}</div>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase">{user?.nama || user?.email || 'User'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Lihat Profile</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-sky-600 font-bold text-xs uppercase transition-colors"><LogOut size={18} /> Logout Portal</button>
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
                        <button className="bg-sky-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all"><Download size={16} /> Export Report</button>
                    </div>
                </header>

                {activeDashTab === 'hilirisasi' && (
                    <div className="animate-in fade-in duration-500 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <MetricCard label="Total Komoditas Strategis" val="95" sub="Sesuai Roadmap 2045" icon={<Database className="text-sky-600" />} />
                            <MetricCard label="Maturitas Rata-rata" val="TRL 7.2" sub="Trend Meningkat" icon={<Target className="text-indigo-600" />} />
                            <MetricCard label="Nilai Tambah Agregat" val="35.4x" sub="Target: 50x" icon={<TrendingUp className="text-emerald-600" />} />
                            <MetricCard label="Status Swasembada" val="64%" sub="Proyeksi 2026" icon={<Globe className="text-amber-600" />} />
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Detail Kesiapan Teknologi (TRL/MRL/CRL)</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setFlowFilter('All')} className={`px-4 py-2 text-xs font-bold rounded-lg ${flowFilter === 'All' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
                                    <button onClick={() => setFlowFilter('Export')} className={`px-4 py-2 text-xs font-bold rounded-lg ${flowFilter === 'Export' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Export</button>
                                    <button onClick={() => setFlowFilter('Import')} className={`px-4 py-2 text-xs font-bold rounded-lg ${flowFilter === 'Import' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Import</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase">Komoditas & Produk</th>
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase text-center">Arus</th>
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase">Status</th>
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase text-center">TRL</th>
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase text-center">MRL</th>
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase text-center">CRL</th>
                                            <th className="p-3 text-xs font-black text-slate-500 uppercase">Status Driven</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr><td colSpan="7" className="text-center p-8 text-slate-500">Loading data...</td></tr>
                                        ) : filteredData.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="p-3">
                                                    <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{item.id}</p>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {item.flowDesc === 'Export' ? <ArrowUpCircle className="text-green-500 mx-auto" /> : <ArrowDownCircle className="text-red-500 mx-auto" />}
                                                </td>
                                                <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'Hulu' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{item.status}</span></td>
                                                <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-xs font-black ${item.trl >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-50 text-sky-600'}`}>{item.trl}</span></td>
                                                <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-xs font-black ${item.mrl >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-50 text-sky-600'}`}>{item.mrl}</span></td>
                                                <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-xs font-black ${item.crl >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-50 text-sky-600'}`}>{item.crl}</span></td>
                                                <td className="p-3"><span className={`flex items-center gap-1.5 text-xs font-bold ${item.drive === 'High Demand' ? 'text-sky-600' : 'text-slate-500'}`}><Zap size={14} />{item.drive}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
