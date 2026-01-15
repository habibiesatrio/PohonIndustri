import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ArrowRight, Landmark, TreeDeciduous
} from 'lucide-react';

// Database Komoditas Utama (Dataset Detail dari Dokumen)
const hsDatabase = [
  { 
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
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHS, setSelectedHS] = useState(null);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const result = hsDatabase.find(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.code.includes(searchQuery)
    );
    setSelectedHS(result || 'not_found');
    const resultSection = document.getElementById('search-result');
    if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleLogin = () => navigate('/login');

  return (
      <div className="min-h-screen bg-sky-50 font-sans text-slate-900">
        <nav className="sticky top-0 z-50 bg-sky-50/80 backdrop-blur-lg border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex items-center gap-3">
                <div className="bg-sky-600 p-2 rounded-xl"><TreeDeciduous className="text-white w-6 h-6" /></div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight leading-none uppercase">Pohon Industri</span>
                  <span className="text-[10px] font-bold text-sky-600 tracking-widest uppercase">Indonesia</span>
                </div>
              </div>
              <button onClick={handleLogin} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-sky-600 transition-all">Login Dashboard</button>
            </div>
          </div>
        </nav>
        <header className="relative pt-20 pb-32 overflow-hidden text-center">
          <div className="max-w-7xl mx-auto px-4">
             <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-600 px-4 py-2 rounded-full text-[10px] font-black uppercase mb-8 border border-sky-200">
              <Landmark size={14} /> Badan Riset dan Inovasi Nasional
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 leading-[0.9] tracking-tighter">
              Navigasi Hilirisasi <br /> <span className="text-sky-600">Industri Indonesia.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
              Data intelijen pohon industri nasional untuk percepatan nilai tambah ekonomi berbasis riset.
            </p>
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative flex bg-white rounded-3xl shadow-2xl p-3 border border-slate-100">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
              <input type="text" className="w-full pl-16 pr-4 py-5 rounded-2xl outline-none text-xl font-bold" placeholder="Cari Komoditas Strategis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
              <button className="bg-sky-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 uppercase">Trace <ArrowRight size={20} /></button>
            </form>
          </div>
        </header>
        <section id="search-result" className="max-w-7xl mx-auto px-4 py-10">
          {selectedHS && selectedHS !== 'not_found' && (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-5">
               <h2 className="text-3xl font-black mb-4 uppercase">{selectedHS.name} - HS {selectedHS.code}</h2>
               <p className="text-slate-500 max-w-2xl mb-10">{selectedHS.description}</p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedHS.hilirisasiDetail.map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Produk Hilir</p>
                       <h4 className="font-black text-slate-800 mb-4">{item.product}</h4>
                       <div className="flex gap-2">
                          <Badge label="TRL" val={item.trl} color="bg-sky-100 text-sky-700" />
                          <Badge label="MRL" val={item.mrl} color="bg-indigo-100 text-indigo-700" />
                          <Badge label="CRL" val={item.crl} color="bg-emerald-100 text-emerald-700" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </section>
      </div>
  );
};

// UI REUSABLE COMPONENTS
const Badge = ({ label, val, color }) => (
  <div className={`px-2 py-1 rounded text-[10px] font-black ${color}`}>
    {label}: {val}
  </div>
);

export default Home;
