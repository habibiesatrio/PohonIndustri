import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area,
    PieChart,
    Pie,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    LineChart,
    Line
} from 'recharts';
import {
    Search,
    Globe,
    ShieldCheck,
    ArrowRight,
    Zap,
    Calculator,
    AlertTriangle,
    ChevronRight,
    Info,
    Database,
    Layers,
    Lightbulb,
    TrendingUp,
    Download,
    RefreshCw,
    Landmark,
    TreeDeciduous,
    Factory,
    Microscope,
    LineChart as LucideLineChart,
    LogOut,
    LayoutDashboard,
    User,
    Bell,
    Settings,
    PieChart as LucidePieChart,
    BookOpen,
    Target,
    Activity,
    Award,
    Map
} from 'lucide-react';

// Database Komoditas Utama (Dataset Detail dari Dokumen)
const hsDatabase = [{
        id: 'palm-oil',
        code: '1511.10.00',
        name: 'Kelapa Sawit (CPO)',
        sector: 'Pertanian & Perkebunan',
        description: 'Minyak kelapa sawit mentah. Produk strategis dengan maturitas teknologi tinggi (TRL 9).',
        stats: { export: 28600000000, import: 0, addedValue: '90.8%' },
        hilirisasiDetail: [
            { product: 'Biodiesel (B35)', trl: 9, mrl: 9, crl: 9, impact: 'High' },
            { product: 'Oleokimia Dasar', trl: 9, mrl: 9, crl: 8, impact: 'Medium' },
            { product: 'Avtur Sawit (Bioavtur)', trl: 7, mrl: 6, crl: 5, impact: 'High' },
            { product: 'Surfaktan Sawit', trl: 8, mrl: 7, crl: 6, impact: 'Medium' }
        ],
        patentDistribution: [
            { subject: 'Proses Ekstraksi', A: 120, B: 110, fullMark: 150 },
            { subject: 'Katalis Biofuel', A: 98, B: 130, fullMark: 150 },
            { subject: 'Oleokimia', A: 86, B: 130, fullMark: 150 },
            { subject: 'Peralatan Pabrik', A: 99, B: 100, fullMark: 150 },
            { subject: 'Pakan Ternak', A: 85, B: 90, fullMark: 150 },
        ],
        marketTrend: [
            { month: 'Jan', export: 2.1, target: 2.0 }, { month: 'Feb', export: 2.3, target: 2.1 },
            { month: 'Mar', export: 2.0, target: 2.2 }, { month: 'Apr', export: 2.5, target: 2.3 },
            { month: 'Mei', export: 2.8, target: 2.4 }, { month: 'Jun', export: 2.6, target: 2.5 }
        ]
    },
    {
        id: 'coal',
        code: '2701.12.10',
        name: 'Batubara Anthracite',
        sector: 'Pertambangan & Energi',
        description: 'Batu bara antrasit. Transformasi dari energi ke petrokimia (Coal to Chemicals).',
        stats: { export: 45000000000, import: 1200000, addedValue: '25-80%' },
        hilirisasiDetail: [
            { product: 'Methanol (Gasification)', trl: 9, mrl: 9, crl: 9, impact: 'High' },
            { product: 'DME (Substitution LPG)', trl: 8, mrl: 7, crl: 6, impact: 'High' },
            { product: 'Polypropylene', trl: 7, mrl: 6, crl: 5, impact: 'Medium' },
            { product: 'Carbon Fiber', trl: 5, mrl: 4, crl: 3, impact: 'High' }
        ],
        patentDistribution: [
            { subject: 'Gasifikasi', A: 140, B: 120, fullMark: 150 },
            { subject: 'Liquefaction', A: 80, B: 110, fullMark: 150 },
            { subject: 'Desulfurisasi', A: 110, B: 130, fullMark: 150 },
            { subject: 'Carbon Capture', A: 70, B: 140, fullMark: 150 },
            { subject: 'DME Synthesis', A: 95, B: 90, fullMark: 150 },
        ],
        marketTrend: [
            { month: 'Jan', export: 3.5, target: 3.2 }, { month: 'Feb', export: 3.8, target: 3.5 },
            { month: 'Mar', export: 4.2, target: 3.8 }, { month: 'Apr', export: 3.9, target: 4.0 },
            { month: 'Mei', export: 4.1, target: 4.2 }, { month: 'Jun', export: 4.5, target: 4.3 }
        ]
    }
];

const sectoralData = [
    { name: 'Pertanian', addedValue: 45, patents: 1200, growth: 5.2 },
    { name: 'Energi', addedValue: 35, patents: 850, growth: 8.4 },
    { name: 'Mineral', addedValue: 60, patents: 420, growth: 12.1 },
    { name: 'Kimia', addedValue: 25, patents: 310, growth: 4.8 },
];

const COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5'];

const Dashboard = () => {
    const [activeDashTab, setActiveDashTab] = useState('hilirisasi');
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

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return null; // or a loading spinner
    }

    return (
        <div className = "min-h-screen bg-[#fcfdfe] font-sans text-slate-900 flex flex-col md:flex-row" > { /* Sidebar Dashboard */ }
            <aside className = "w-full md:w-72 bg-white border-r border-slate-100 flex flex-col p-6 sticky top-0 h-screen z-50" >
                <div className = "flex items-center gap-3 mb-10" >
                    <div className = "bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-100" >
                        <LayoutDashboard className = "text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className = "text-lg font-black text-slate-900 uppercase leading-none" > Intelligence </h1>
                        <p className = "text-[10px] font-bold text-red-600 uppercase tracking-widest" > Portal Admin BRIN </p>
                    </div>
                </div>
                <nav className = "flex-1 space-y-2" >
                    <NavItem active = { activeDashTab === 'hilirisasi' } onClick = {() => setActiveDashTab('hilirisasi')} icon = { < Layers size = { 18 } />} label="Hilirisasi Nasional" />
                    <NavItem active = { activeDashTab === 'paten' } onClick = {() => setActiveDashTab('paten')} icon = { < Microscope size = { 18 } />} label="Analitik Paten" />
                    <NavItem active = { activeDashTab === 'sektoral' } onClick = {() => setActiveDashTab('sektoral')} icon = { < Landmark size = { 18 } />} label="Data Sektoral" />
                    <NavItem active = { activeDashTab === 'performance' } onClick = {() => setActiveDashTab('performance')} icon = { < Activity size = { 18 } />} label="Performa Ekspor" />
                    <NavItem active = { activeDashTab === 'gis' } onClick = {() => setActiveDashTab('gis')} icon = { < Map size = { 18 } />} label="Pemetaan GIS" />
                    <NavItem active = { activeDashTab === 'profile' } onClick = {() => navigate('/profile')} icon = { < User size = { 18 } />} label="Profil Pengguna" />
                </nav>
                <div className = "mt-auto pt-6 border-t border-slate-50" >
                    <div className = "flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4" >
                        <div className = "w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black" > {user.nama.charAt(0).toUpperCase()} </div>
                        <div>
                            <p className = "text-xs font-black text-slate-800 uppercase" > {user.nama} </p>
                            <p className = "text-[9px] font-bold text-slate-400 uppercase" > {user.email} </p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-600 font-bold text-xs uppercase transition-colors">
                        <User size={18} /> Profile
                    </button>
                    <button onClick = { handleLogout } className = "w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-600 font-bold text-xs uppercase transition-colors" >
                        <LogOut size = { 18 } /> Logout Portal
                    </button>
                </div>
            </aside>
            { /* Main Dashboard Content */ }
            <main className = "flex-1 p-6 md:p-12 overflow-y-auto" >
                <header className = "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10" >
                    <div>
                        <h2 className = "text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1" > Sistem Industri dan Manufaktur Berkelanjutan </h2>
                        <p className = "text-slate-400 text-sm font-medium uppercase tracking-widest" > Update Data: 08 Jan 2025, 14:04 WIB </p>
                    </div>
                    <div className = "flex gap-4" >
                        <button className = "bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all" >
                            <Bell size = { 20 } />
                        </button>
                        <button className = "bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all" >
                            <Settings size = { 20 } />
                        </button>
                        <button className = "bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-red-100 hover:bg-red-700 transition-all" >
                            <Download size = { 16 } /> Export Intelligence Report
                        </button>
                    </div>
                </header>
                { /* Dynamic Content Based on Tabs */ } {
                    activeDashTab === 'hilirisasi' && (
                        <div className = "animate-in fade-in duration-500 space-y-8" >
                            <div className = "grid grid-cols-1 md:grid-cols-4 gap-6" >
                                <MetricCard label = "Total Komoditas Strategis" val = "95" sub = "Sesuai Roadmap 2045" icon = { < Database className = "text-red-600" /> } />
                                <MetricCard label = "Maturitas Rata-rata" val = "TRL 7.2" sub = "Trend Meningkat" icon = { < Target className = "text-indigo-600" /> } />
                                <MetricCard label = "Nilai Tambah Agregat" val = "35.4x" sub = "Target: 50x" icon = { < TrendingUp className = "text-emerald-600" /> } />
                                <MetricCard label = "Status Swasembada" val = "64%" sub = "Proyeksi 2026" icon = { < Globe className = "text-amber-600" /> } />
                            </div>
                            <div className = "grid grid-cols-1 lg:grid-cols-12 gap-8" >
                                <div className = "lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" >
                                    <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8 flex items-center gap-2" >
                                        <Layers size = { 18 } className = "text-red-600" /> Detail Kesiapan Teknologi Hilir(TRL / MRL / CRL)
                                    </h3>
                                    <div className = "overflow-x-auto" >
                                        <table className = "w-full text-left" >
                                            <thead>
                                                <tr className = "border-b border-slate-100" >
                                                    <th className = "pb-4 text-[10px] font-black text-slate-400 uppercase" > Komoditas & Produk Hilir </th>
                                                    <th className = "pb-4 text-[10px] font-black text-slate-400 uppercase text-center" > TRL </th>
                                                    <th className = "pb-4 text-[10px] font-black text-slate-400 uppercase text-center" > MRL </th>
                                                    <th className = "pb-4 text-[10px] font-black text-slate-400 uppercase text-center" > CRL </th>
                                                    <th className = "pb-4 text-[10px] font-black text-slate-400 uppercase" > Status Driven </th>
                                                </tr>
                                            </thead>
                                            <tbody className = "divide-y divide-slate-50" > {
                                                hsDatabase.flatMap(hs => hs.hilirisasiDetail.map((item, idx) => (
                                                    <tr key = { `${hs.id}-${idx}` } className = "group hover:bg-slate-50 transition-colors" >
                                                        <td className = "py-4" >
                                                            <p className = "font-black text-sm text-slate-800 leading-none mb-1 uppercase" > { item.product } </p>
                                                            <p className = "text-[10px] font-bold text-slate-400 uppercase tracking-tighter" > Basis: { hs.name } </p>
                                                        </td>
                                                        <td className = "py-4 text-center" >
                                                            <span className = { `px-2 py-1 rounded text-[10px] font-black ${item.trl >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}` } > { item.trl } </span>
                                                        </td>
                                                        <td className = "py-4 text-center" >
                                                            <span className = { `px-2 py-1 rounded text-[10px] font-black ${item.mrl >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}` } > { item.mrl } </span>
                                                        </td>
                                                        <td className = "py-4 text-center" >
                                                            <span className = { `px-2 py-1 rounded text-[10px] font-black ${item.crl >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}` } > { item.crl } </span>
                                                        </td>
                                                        <td className = "py-4" >
                                                            <span className = { `text-[10px] font-black uppercase flex items-center gap-1 ${item.impact === 'High' ? 'text-red-600' : 'text-slate-400'}` } >
                                                                <Zap size = { 10 } /> {item.impact} Demand
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )))
                                            }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className = "lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col" >
                                    <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8" > Karakteristik Sektoral </h3>
                                    <div className = "flex-1 h-[300px]" >
                                        <ResponsiveContainer width = "100%" height = "100%" >
                                            <RadarChart cx = "50%" cy = "50%" outerRadius = "80%" data = { hsDatabase[0].patentDistribution } >
                                                <PolarGrid stroke = "#f1f5f9" />
                                                <PolarAngleAxis dataKey = "subject" fontSize = { 10 } fontStyle = "bold" />
                                                <Radar name = "Kelapa Sawit" dataKey = "A" stroke = "#dc2626" fill = "#dc2626" fillOpacity = { 0.5 } />
                                                <Radar name = "Batubara" dataKey = "B" stroke = "#4f46e5" fill = "#4f46e5" fillOpacity = { 0.3 } />
                                                <Tooltip />
                                                <Legend />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                } {
                    activeDashTab === 'paten' && (
                        <div className = "animate-in fade-in duration-500 space-y-8" >
                            <div className = "grid grid-cols-1 lg:grid-cols-12 gap-8" >
                                <div className = "lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" >
                                    <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8" > Pertumbuhan Inovasi Per - Institusi(Dataset BRIN) </h3>
                                    <div className = "h-[350px]" >
                                        <ResponsiveContainer width = "100%" height = "100%" >
                                            <BarChart data = { sectoralData } >
                                                <CartesianGrid strokeDasharray = "3 3" vertical = { false } stroke = "#f1f5f9" />
                                                <XAxis dataKey = "name" axisLine = { false } tickLine = { false } fontSize = { 12 } fontStyle = "bold" />
                                                <YAxis axisLine = { false } tickLine = { false } fontSize = { 12 } fontStyle = "bold" />
                                                <Tooltip cursor = {{ fill: '#f8fafc' }} />
                                                <Bar dataKey = "patents" name = "Jumlah Paten Terbit" fill = "#dc2626" radius = {[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className = "lg:col-span-5 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl" >
                                    <h3 className = "text-xs font-black text-red-400 uppercase tracking-widest mb-10 flex items-center gap-2" >
                                        <Award size = { 18 } /> Inovasi Paling Berdampak (Top Patents)
                                    </h3>
                                    <div className = "space-y-6" > {
                                        [
                                            { title: 'Katalis Bioavtur Merah Putih', inst: 'BRIN & ITB', trl: 7 },
                                            { title: 'DME Synthesis Reactor', inst: 'PTBA & BRIN', trl: 8 },
                                            { title: 'Graphene from Coal Tar', inst: 'BRIN Reseach', trl: 5 },
                                            { title: 'High-Purity Oleic Acid', inst: 'IPB University', trl: 9 }
                                        ].map((p, i) => (
                                            <div key = { i } className = "flex justify-between items-center border-b border-white/5 pb-4" >
                                                <div>
                                                    <p className = "font-black text-sm leading-tight mb-1" > { p.title } </p>
                                                    <p className = "text-[10px] font-bold text-slate-500 uppercase" > { p.inst } </p>
                                                </div>
                                                <span className = "bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded" > TRL { p.trl } </span>
                                            </div>
                                        ))
                                    }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                } {
                    activeDashTab === 'sektoral' && (
                        <div className = "animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 gap-8" >
                            <div className = "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" >
                                <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8" > Added Value Comparison( % ) </h3>
                                <div className = "h-[300px]" >
                                    <ResponsiveContainer width = "100%" height = "100%" >
                                        <PieChart >
                                            <Pie data = { sectoralData } cx = "50%" cy = "50%" innerRadius = { 60 } outerRadius = { 80 } paddingAngle = { 5 } dataKey = "addedValue" > {
                                                sectoralData.map((e, i) => < Cell key = { i } fill = { COLORS[i % COLORS.length] } />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className = "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" >
                                <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8" > Pertumbuhan Sektoral( % ) </h3>
                                <div className = "h-[300px]" >
                                    <ResponsiveContainer width = "100%" height = "100%" >
                                        <BarChart data = { sectoralData } layout = "vertical" >
                                            <XAxis type = "number" hide />
                                            <YAxis dataKey = "name" type = "category" fontSize = { 10 } fontStyle = "bold" axisLine = { false } tickLine = { false } />
                                            <Tooltip />
                                            <Bar dataKey = "growth" name = "Pertumbuhan Tahunan" fill = "#dc2626" radius = {[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )
                } {
                    activeDashTab === 'performance' && (
                        <div className = "animate-in fade-in duration-500 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" >
                            <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8" > Monitoring Ekspor Bulanan vs Target Strategis(Billion USD) </h3>
                            <div className = "h-[400px]" >
                                <ResponsiveContainer width = "100%" height = "100%" >
                                    <LineChart data = { hsDatabase[0].marketTrend } >
                                        <CartesianGrid strokeDasharray = "3 3" vertical = { false } stroke = "#f1f5f9" />
                                        <XAxis dataKey = "month" axisLine = { false } tickLine = { false } fontSize = { 12 } fontStyle = "bold" />
                                        <YAxis axisLine = { false } tickLine = { false } fontSize = { 12 } fontStyle = "bold" />
                                        <Tooltip />
                                        <Legend />
                                        <Line type = "monotone" dataKey = "export" name = "Realisasi Ekspor" stroke = "#dc2626" strokeWidth = { 4 } dot = {{ r: 6, fill: '#dc2626' }} />
                                        <Line type = "monotone" dataKey = "target" name = "Target Roadmap" stroke = "#94a3b8" strokeWidth = { 2 } strokeDasharray = "5 5" dot = { false } />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )
                } {
                    activeDashTab === 'gis' && (
                        <div className = "animate-in fade-in duration-500 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" >
                            <h3 className = "font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8" > Pemetaan Spasial Industri(GIS) </h3>
                            <div className = "h-[600px] bg-slate-100 rounded-2xl flex items-center justify-center" >
                                <p className = "text-slate-500 font-bold" > Google Maps API akan diintegrasikan disini. </p>
                            </div>
                        </div>
                    )
                }
            </main>
        </div>
    );
};

// UI REUSABLE COMPONENTS
const Badge = ({ label, val, color }) => (
    <div className = { `px-2 py-1 rounded text-[10px] font-black ${color}` } > { label }: { val } </div>
);

const NavItem = ({ active, onClick, icon, label }) => (
    <button onClick = { onClick } className = { `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${active ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-slate-500 hover:bg-slate-50'}` } > { icon } { label }
    </button>
);

const MetricCard = ({ label, val, sub, icon }) => (
    <div className = "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-4 group" >
        <div className = "w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-red-50 transition-colors" > { icon } </div>
        <div>
            <p className = "text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1" > { label } </p>
            <h4 className = "text-2xl font-black text-slate-900 leading-none" > { val } </h4> {
                sub && <p className = "text-[9px] font-bold text-slate-400 uppercase mt-1" > { sub } </p>}
        </div>
    </div>
);

export default Dashboard;