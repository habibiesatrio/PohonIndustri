import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState, 
    ReactFlowProvider, 
    useViewport,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

// ENGINE: Menggunakan Realtime Database
import { ref, onValue } from 'firebase/database';
import { rtdb } from './firebase'; 

import { Link, useNavigate } from 'react-router-dom';
import { 
    GitMerge, LayoutDashboard, Search, X, 
    ArrowUp, ArrowDown, Database, LogOut, 
    Bell, Settings, Download 
} from 'lucide-react';

import IndustrialNode from './IndustrialNode';

const nodeTypes = { industrial: IndustrialNode };

// --- KOMPONEN ZOOM INDICATOR ---
const ZoomDisplay = () => {
    const { zoom } = useViewport();
    return (
        <div className="absolute bottom-6 right-24 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-sm z-10 font-black text-slate-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Zoom: {Math.round(zoom * 100)}%
        </div>
    );
};

const PohonIndustriContent = () => {
    const { setCenter } = useReactFlow();
    const navigate = useNavigate();
    const [allData, setAllData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedPopUp, setSelectedPopUp] = useState(null);
    const [user, setUser] = useState(null);

    // 1. ENGINE: Sinkronisasi User & RTDB
    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }

        const dbRef = ref(rtdb, '/'); 
        return onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const formatted = Array.isArray(data) 
                    ? data.filter(i => i !== null) 
                    : Object.values(data);
                setAllData(formatted);
            }
        });
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // --- ENGINE: LOGIKA INTERAKSI & LAYOUTING ---
    const onToggleExpand = useCallback((id) => {
        setNodes(nds => nds.map(node => ({
            ...node,
            data: { ...node.data, isExpanded: node.id === id ? !node.data.isExpanded : false }
        })));
    }, [setNodes]);

    const onHideChildren = useCallback((id) => {
        setEdges((eds) => {
            const getDescendants = (parentId, collected = []) => {
                const targets = eds.filter(e => e.source === parentId).map(e => e.target);
                targets.forEach(t => { collected.push(t); getDescendants(t, collected); });
                return collected;
            };
            const toRemove = getDescendants(id);
            setNodes(nds => nds.filter(n => !toRemove.includes(n.id)));
            return eds.filter(e => !toRemove.includes(e.target));
        });
    }, [setNodes]);

    const onHideParent = useCallback((id) => {
        setEdges((eds) => {
            const getAncestors = (childId, collected = []) => {
                const sources = eds.filter(e => e.target === childId).map(e => e.source);
                sources.forEach(s => { collected.push(s); getAncestors(s, collected); });
                return collected;
            };
            const toRemove = getAncestors(id);
            setNodes(nds => nds.filter(n => !toRemove.includes(n.id)));
            return eds.filter(e => !toRemove.includes(e.source));
        });
    }, [setNodes]);

    // ENGINE UTAMA: Membangun Pohon (1 Parent & All Children)
    const buildTreeLogic = (selectedProduct) => {
        const nodesMap = new Map();
        const edgesMap = new Map();

        nodesMap.set(selectedProduct.Harmony_ID, selectedProduct);

        // Cari Parent 1 tingkat
        const parents = allData.filter(i => i.Harmony_ID === selectedProduct.Harmony_ID);
        parents.forEach(rel => {
            if (rel.Parent_ID && rel.Parent_ID !== "ROOT") {
                const pNode = allData.find(i => i.Harmony_ID === rel.Parent_ID);
                if (pNode) {
                    nodesMap.set(pNode.Harmony_ID, pNode);
                    edgesMap.set(`e-${rel.Parent_ID}-${selectedProduct.Harmony_ID}`, {
                        source: rel.Parent_ID, target: selectedProduct.Harmony_ID, label: rel.Process_Name
                    });
                }
            }
        });

        // Cari Children Rekursif
        const findDescendants = (pid) => {
            allData.filter(i => i.Parent_ID === pid).forEach(child => {
                if (!nodesMap.has(child.Harmony_ID)) {
                    nodesMap.set(child.Harmony_ID, child);
                    edgesMap.set(`e-${pid}-${child.Harmony_ID}`, {
                        source: pid, target: child.Harmony_ID, label: child.Process_Name
                    });
                    findDescendants(child.Harmony_ID);
                }
            });
        };
        findDescendants(selectedProduct.Harmony_ID);

        const finalNodes = Array.from(nodesMap.values()).map((item, index) => {
            let depth = 0; let curr = item;
            while(curr?.Parent_ID && curr.Parent_ID !== "ROOT") {
                depth++;
                curr = allData.find(x => x.Harmony_ID === curr.Parent_ID);
                if (depth > 10) break;
            }
            return {
                id: item.Harmony_ID,
                type: 'industrial',
                data: { 
                    ...item, isExpanded: false, onToggleExpand, onHideChildren, onHideParent,
                    onExpandChildren: (hid) => { const p = allData.find(x=>x.Harmony_ID===hid); if(p) buildTreeLogic(p); },
                    onExpandParent: (hid) => { const p = allData.find(x=>x.Harmony_ID===hid); if(p) buildTreeLogic(p); },
                    onShowDetail: (d) => setSelectedPopUp(d)
                },
                position: { x: depth * 480, y: index * 220 - (nodesMap.size * 100) }
            };
        });

        const finalEdges = Array.from(edgesMap.values()).map((e, idx) => ({
            id: `edge-${idx}`,
            source: e.source, target: e.target, label: e.label,
            animated: true, type: 'smoothstep', style: { stroke: '#ef4444', strokeWidth: 3 },
            labelStyle: { fill: '#ef4444', fontWeight: 800, fontSize: 8, textTransform: 'uppercase' }
        }));

        setNodes(finalNodes);
        setEdges(finalEdges);
        setSearchTerm("");

        // FOKUS KAMERA
        setTimeout(() => {
            const target = finalNodes.find(n => n.id === selectedProduct.Harmony_ID);
            if (target) setCenter(target.position.x + 120, target.position.y + 50, { zoom: 0.8, duration: 1200 });
        }, 200);
    };

    return (
        <div className="flex h-screen bg-sky-50 font-sans overflow-hidden">
            {/* DESAIN SIDEBAR TETAP SAMA */}
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
                        <div className="flex items-center gap-2 mb-4 text-slate-800">
                            <Database size={14} className="text-slate-400" />
                            <h2 className="text-[10px] font-black uppercase tracking-widest">Navigasi Detail Produk</h2>
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
                        <div className="mt-4 space-y-1 max-h-[35vh] overflow-y-auto pr-1">
                            {searchTerm && allData.filter(i => i.Product_Name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.Harmony_ID?.toString().toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                <button key={item.Harmony_ID} onClick={() => buildTreeLogic(item)} className="w-full text-left p-3 rounded-xl hover:bg-sky-50 group transition-all border border-transparent hover:border-sky-100">
                                    <p className="text-[10px] font-black text-slate-700 uppercase leading-none group-hover:text-sky-700">{item.Product_Name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">HS {item.Harmony_ID}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-50">
                    <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-black text-sm uppercase">
                            {(user?.nama || user?.email)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{user?.nama || 'User'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Lihat Profile</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-600 font-bold text-xs uppercase transition-colors"><LogOut size={18} /> Logout Portal</button>
                </div>
            </aside>

            {/* DESAIN TOP BAR TETAP SAMA */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 bg-white border-b border-slate-100 shadow-sm z-10 font-sans">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 leading-none tracking-tighter">Sistem Industri dan Manufaktur Berkelanjutan</h2>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Update Data: 12 Jan 2026</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 shadow-sm hover:bg-slate-50"><Bell size={20}/></button>
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 shadow-sm hover:bg-slate-50"><Settings size={20}/></button>
                        <button className="bg-sky-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all font-sans tracking-wide">
                            <Download size={16} /> Export Report
                        </button>
                    </div>
                </header>

                <div className="flex-1 bg-white relative overflow-hidden font-sans">
                    <ReactFlow 
                        nodes={nodes} edges={edges} onNodesChange={onNodesChange} 
                        nodeTypes={nodeTypes} fitView
                    >
                        <Background color="#cbd5e1" gap={30} size={1} variant="dots" />
                        <Controls className="bg-white shadow-2xl rounded-xl border-none ml-4 mb-4 overflow-hidden" />
                        <ZoomDisplay />
                    </ReactFlow>

                    {/* POP UP DETAIL TETAP ADA (Opsional jika ingin pakai Accordion) */}
                    {selectedPopUp && (
                        <div className="absolute top-10 right-10 w-85 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 border border-slate-50 z-[100] animate-in slide-in-from-right duration-500 overflow-y-auto max-h-[85vh] custom-scrollbar">
                            <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                                <div>
                                    <p className="text-[9px] font-black text-sky-600 uppercase tracking-[0.2em] mb-1">{selectedPopUp.Tier}</p>
                                    <h3 className="text-xl font-black text-slate-900 uppercase leading-tight tracking-tight">{selectedPopUp.Product_Name}</h3>
                                </div>
                                <button onClick={() => setSelectedPopUp(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group"><X size={20} className="text-slate-400" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Total Ekspor (USD)</p>
                                    <div className="flex items-center gap-3 text-2xl font-black text-emerald-700 font-sans">
                                        <ArrowUp size={22} className="text-emerald-500" /> ${Number(selectedPopUp.Downstream_Export || 0).toLocaleString('de-DE')}
                                    </div>
                                </div>
                                <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100">
                                    <p className="text-[10px] font-black text-red-600 uppercase mb-2 tracking-widest">Total Impor (USD)</p>
                                    <div className="flex items-center gap-3 text-2xl font-black text-red-700 font-sans">
                                        <span className="text-red-400 font-bold font-sans tracking-widest">▼</span> ${Number(selectedPopUp.Downstream_Import || 0).toLocaleString('de-DE')}
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

const PohonIndustri = () => (
    <ReactFlowProvider>
        <PohonIndustriContent />
    </ReactFlowProvider>
);

export default PohonIndustri;