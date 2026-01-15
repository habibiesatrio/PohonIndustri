import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState, 
    ReactFlowProvider, // Tambahkan ini
    useViewport // Tambahkan ini
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import { 
    GitMerge, LayoutDashboard, Search, X, 
    ArrowUp, ArrowDown, Database, LogOut, 
    Bell, Settings, Download 
} from 'lucide-react';
import IndustrialNode from './IndustrialNode';

const nodeTypes = { industrial: IndustrialNode };

// --- KOMPONEN INTERNAL UNTUK ZOOM PERCENTAGE ---
const ZoomDisplay = () => {
    const { zoom } = useViewport();
    return (
        <div className="absolute bottom-6 right-24 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-sm z-10 font-black text-slate-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Zoom: {Math.round(zoom * 100)}%
        </div>
    );
};

const PohonIndustriContent = () => { // Bungkus konten dalam provider
    const navigate = useNavigate();
    const [allData, setAllData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedPopUp, setSelectedPopUp] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    useEffect(() => {
        const q = query(collection(db, "pohon_industri"));
        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllData(data);
        });
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const edgeType = 'smoothstep'; 
    const edgeStyle = { stroke: '#0ea5e9', strokeWidth: 3 };

    const onHideChildren = useCallback((id) => {
        setEdges((eds) => {
            const getDescendants = (parentId, collectedIds = []) => {
                const targets = eds.filter(e => e.source === parentId).map(e => e.target);
                targets.forEach(t => {
                    collectedIds.push(t);
                    getDescendants(t, collectedIds);
                });
                return collectedIds;
            };
            const idsToRemove = getDescendants(id);
            setNodes(nds => nds.filter(n => !idsToRemove.includes(n.id)));
            return eds.filter(e => !idsToRemove.includes(e.target));
        });
    }, [setNodes, setEdges]);

    const onExpandChildren = useCallback((id) => {
        setNodes((nds) => {
            const parentNode = nds.find(n => n.id === id);
            if (!parentNode) return nds;
            const children = allData.filter(item => item.parentId === id);
            const newNodes = [];
            const newEdges = [];
            children.forEach((child, index) => {
                if (!nds.find(n => n.id === child.id)) {
                    newNodes.push({
                        id: child.id,
                        type: 'industrial',
                        data: { 
                            id: child.id,
                            label: child.name || child.label, 
                            hsCode: child.id, 
                            category: 'INTERMEDIATE PRODUCT', 
                            onExpandChildren, onHideChildren, onExpandParent,
                            onShowDetail: (d) => setSelectedPopUp(d),
                            ...child 
                        },
                        position: { 
                            x: parentNode.position.x + 450, 
                            y: parentNode.position.y + (index * 200) - ((children.length - 1) * 100) 
                        }
                    });
                    newEdges.push({
                        id: `e-${id}-${child.id}`,
                        source: id, target: child.id,
                        animated: true, type: edgeType, style: edgeStyle
                    });
                }
            });
            if (newEdges.length > 0) setEdges(eds => [...eds, ...newEdges]);
            return [...nds, ...newNodes];
        });
    }, [allData, onHideChildren]);

    const onExpandParent = useCallback((id) => {
        setNodes((nds) => {
            const childNode = nds.find(n => n.id === id);
            if (!childNode) return nds;
            const item = allData.find(i => i.id === id);
            if (!item?.parentId || item.parentId === 'ROOT') return nds;
            const parent = allData.find(i => i.id === item.parentId);
            if (parent && !nds.find(n => n.id === parent.id)) {
                const newNode = {
                    id: parent.id,
                    type: 'industrial',
                    data: { 
                        id: parent.id,
                        label: parent.name || parent.label, 
                        hsCode: parent.id, 
                        category: 'RAW MATERIAL', 
                        onExpandChildren, onHideChildren, onExpandParent,
                        onShowDetail: (d) => setSelectedPopUp(d),
                        ...parent 
                    },
                    position: { x: childNode.position.x - 450, y: childNode.position.y }
                };
                setEdges(eds => [...eds, {
                    id: `e-${parent.id}-${id}`,
                    source: parent.id, target: id,
                    animated: true, type: edgeType, style: edgeStyle
                }]);
                return [...nds, newNode];
            }
            return nds;
        });
    }, [allData, onExpandChildren, onHideChildren]);

    const resetAndLoadRoot = (product) => {
        setNodes([{
            id: product.id,
            type: 'industrial',
            data: { 
                id: product.id,
                label: product.name || product.label, 
                hsCode: product.id, 
                category: 'RAW MATERIAL', 
                onExpandChildren, onHideChildren, onExpandParent,
                onShowDetail: (d) => setSelectedPopUp(d),
                ...product 
            },
            position: { x: 0, y: 300 }
        }]);
        setEdges([]);
        setSearchTerm("");
    };

    return (
        <div className="flex h-screen bg-sky-50 font-sans overflow-hidden">
            {/* SIDEBAR IDENTIK DASHBOARD.JS */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-6 sticky top-0 h-screen z-50">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-100">
                        <LayoutDashboard className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Intelligence</h1>
                        <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Portal Admin BRIN</p>
                    </div>
                </div>
                
                <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                    <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-all">
                        <LayoutDashboard size={18} /> Kembali ke Dashboard
                    </Link>
                    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase bg-sky-600 text-white shadow-lg shadow-sky-100">
                        <GitMerge size={18} /> Pohon Industri
                    </div>

                    <div className="pt-8 px-2 border-t border-slate-50 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Database size={14} className="text-slate-400" />
                            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Navigasi Detail Produk</h2>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={14} />
                            <input 
                                type="text" 
                                placeholder="Cari HS / Nama..." 
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="mt-4 space-y-1">
                            {searchTerm && allData.filter(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.includes(searchTerm)).map(item => (
                                <button key={item.id} onClick={() => resetAndLoadRoot(item)} className="w-full text-left p-3 rounded-xl hover:bg-sky-50 group transition-all border border-transparent hover:border-sky-100">
                                    <p className="text-[10px] font-black text-slate-700 uppercase leading-none group-hover:text-sky-700">{item.name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">HS {item.id}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-50">
                    <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-black text-sm uppercase">
                            {(user?.nama || user?.email)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{user?.nama || 'User'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Lihat Profile</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-sky-600 font-bold text-xs uppercase transition-colors">
                        <LogOut size={18} /> Logout Portal
                    </button>
                </div>
            </aside>

            {/* TOP BAR IDENTIK DASHBOARD.JS */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 bg-white border-b border-slate-100 shadow-sm z-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 leading-none tracking-tighter">Sistem Industri dan Manufaktur Berkelanjutan</h2>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Update Data: 12 Jan 2026</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all"><Bell size={20} /></button>
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all"><Settings size={20} /></button>
                        <button className="bg-sky-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all"><Download size={16} /> Export Report</button>
                    </div>
                </header>

                <div className="flex-1 bg-white relative overflow-hidden">
                    <ReactFlow 
                        nodes={nodes} edges={edges} 
                        onNodesChange={onNodesChange} 
                        nodeTypes={nodeTypes} 
                        fitView
                    >
                        <Background color="#cbd5e1" gap={30} size={1} variant="dots" />
                        <Controls className="bg-white shadow-2xl rounded-xl border-none ml-4 mb-4" />
                        {/* INDIKATOR ZOOM */}
                        <ZoomDisplay />
                    </ReactFlow>

                    {/* POP UP DETAIL */}
                    {selectedPopUp && (
                        <div className="absolute top-10 right-10 w-85 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 border border-slate-50 z-[100] animate-in slide-in-from-right duration-500">
                            <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                                <div>
                                    <p className="text-[9px] font-black text-sky-600 uppercase tracking-[0.2em] mb-1">{selectedPopUp.category}</p>
                                    <h3 className="text-xl font-black text-slate-900 uppercase leading-tight tracking-tight">{selectedPopUp.label}</h3>
                                </div>
                                <button onClick={() => setSelectedPopUp(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Total Ekspor (USD)</p>
                                    <div className="flex items-center gap-3 text-2xl font-black text-emerald-700">
                                        <ArrowUp size={22} className="text-emerald-500" /> ${selectedPopUp.fobValue?.toLocaleString('de-DE') || '0'}
                                    </div>
                                </div>
                                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Unit Value / Ton</p>
                                    <div className="flex items-center gap-3 text-2xl font-black text-indigo-700">
                                        <span className="text-indigo-400 font-bold">$</span> {selectedPopUp.unitValue?.toLocaleString('de-DE') || '0'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- WRAPPER UTAMA AGAR PROVIDER BEKERJA ---
const PohonIndustri = () => (
    <ReactFlowProvider>
        <PohonIndustriContent />
    </ReactFlowProvider>
);

export default PohonIndustri;