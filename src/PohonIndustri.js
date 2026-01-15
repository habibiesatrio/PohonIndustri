import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, ReactFlowProvider, useViewport, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { ref, onValue } from 'firebase/database';
import { rtdb } from './firebase'; 
import { Link, useNavigate } from 'react-router-dom';
import { GitMerge, LayoutDashboard, Search, LogOut, Download, Bell, Settings, Database } from 'lucide-react';
import IndustrialNode from './IndustrialNode';

const nodeTypes = { industrial: IndustrialNode };

const ZoomDisplay = () => {
    const { zoom } = useViewport();
    return (
        <div className="absolute bottom-6 right-24 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-sm z-10 font-black text-slate-500 text-[10px] uppercase tracking-widest flex items-center gap-2 font-sans">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
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
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (!userData) navigate('/login');
        else setUser(JSON.parse(userData));

        const dbRef = ref(rtdb, '/'); 
        return onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setAllData(Object.values(data).filter(item => item !== null));
        });
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    const onToggleExpand = useCallback((id) => {
        setNodes(nds => nds.map(node => ({
            ...node,
            data: { ...node.data, isExpanded: node.id === id ? !node.data.isExpanded : false }
        })));
    }, [setNodes]);

    // --- LOGIKA HIDE ---
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

    // --- LOGIKA UTAMA: 1 LEVEL PARENT & ALL LEVEL CHILDREN ---
    const buildSpecificFlow = (selectedItem) => {
        const nodesMap = new Map();
        const edgesMap = new Map();

        // 1. Tambahkan Diri Sendiri
        nodesMap.set(selectedItem.Harmony_ID, selectedItem);

        // 2. Tambahkan Parent Hanya 1 Tingkat (Multi-parent support)
        const parentRelations = allData.filter(i => i.Harmony_ID === selectedItem.Harmony_ID);
        parentRelations.forEach(rel => {
            if (rel.Parent_ID && rel.Parent_ID !== "ROOT") {
                const parentNode = allData.find(i => i.Harmony_ID === rel.Parent_ID);
                if (parentNode) {
                    nodesMap.set(parentNode.Harmony_ID, parentNode);
                    edgesMap.set(`e-${parentNode.Harmony_ID}-${selectedItem.Harmony_ID}`, {
                        source: parentNode.Harmony_ID, target: selectedItem.Harmony_ID, label: rel.Process_Name
                    });
                }
            }
        });

        // 3. Tambahkan Children Secara Rekursif (Semua Turunan ke Hilir)
        const findDescendants = (pid) => {
            const children = allData.filter(i => i.Parent_ID === pid);
            children.forEach(child => {
                if (!nodesMap.has(child.Harmony_ID)) {
                    nodesMap.set(child.Harmony_ID, child);
                    edgesMap.set(`e-${pid}-${child.Harmony_ID}`, {
                        source: pid, target: child.Harmony_ID, label: child.Process_Name
                    });
                    findDescendants(child.Harmony_ID);
                }
            });
        };
        findDescendants(selectedItem.Harmony_ID);

        // Layouting
        const getLevel = (id) => {
            const item = allData.find(i => i.Harmony_ID === id);
            if (!item?.Parent_ID || item.Parent_ID === "ROOT") return 0;
            // Untuk penentuan kolom visual, kita hitung kedalaman dari root data
            let current = item;
            let depth = 0;
            while(current?.Parent_ID && current.Parent_ID !== "ROOT") {
                depth++;
                current = allData.find(x => x.Harmony_ID === current.Parent_ID);
                if(depth > 10) break; // prevent infinite
            }
            return depth;
        };

        const finalNodes = Array.from(nodesMap.values()).map((item, index) => ({
            id: item.Harmony_ID,
            type: 'industrial',
            data: { 
                ...item, isExpanded: false, onToggleExpand, onHideChildren, onHideParent,
                onExpandChildren: (hid) => loadBranch(hid, 'down'),
                onExpandParent: (hid) => loadBranch(hid, 'up'),
                onShowDetail: () => {} // Detail sekarang lewat accordion
            },
            position: { x: getLevel(item.Harmony_ID) * 480, y: index * 220 - (nodesMap.size * 100) }
        }));

        const finalEdges = Array.from(edgesMap.values()).map((e, idx) => ({
            id: `edge-${idx}`,
            source: e.source, target: e.target, label: e.label,
            animated: true, type: 'smoothstep', style: { stroke: '#ef4444', strokeWidth: 3 },
            labelStyle: { fill: '#ef4444', fontWeight: 800, fontSize: 8, textTransform: 'uppercase' }
        }));

        setNodes(finalNodes);
        setEdges(finalEdges);
        setSearchTerm("");

        setTimeout(() => {
            const target = finalNodes.find(n => n.id === selectedItem.Harmony_ID);
            if (target) setCenter(target.position.x + 120, target.position.y + 50, { zoom: 0.8, duration: 1200 });
        }, 150);
    };

    const loadBranch = (id, direction) => {
        const product = allData.find(i => i.Harmony_ID === id);
        if (product) buildSpecificFlow(product);
    };

    return (
        <div className="flex h-screen bg-[#fcfdfe] font-sans overflow-hidden text-slate-900 leading-none">
            {/* SIDEBAR */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-6 sticky top-0 h-screen z-50">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-100"><GitMerge className="text-white w-6 h-6 rotate-90" /></div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Intelligence</h1>
                </div>
                <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                    <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-all shadow-none">
                        <LayoutDashboard size={18} /> Kembali ke Dashboard
                    </Link>
                    <div className="pt-8 px-2 border-t border-slate-50 mt-4 font-sans">
                        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14} className="text-slate-400"/> Navigasi Produk</h2>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={14} />
                            <input 
                                type="text" placeholder="Masukkan nama..." 
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-red-100 focus:bg-white transition-all shadow-inner"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="mt-4 space-y-1 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            {searchTerm && allData.filter(i => i.Product_Name?.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                <button key={item.Harmony_ID} onClick={() => buildSpecificFlow(item)} className="w-full text-left p-3 rounded-xl hover:bg-red-50 group transition-all">
                                    <p className="text-[10px] font-black text-slate-700 uppercase group-hover:text-red-700 leading-tight">{item.Product_Name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">ID: {item.Harmony_ID}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-50">
                    <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black uppercase text-sm">{(user?.nama || 'U').charAt(0)}</div>
                        <div><p className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{user?.nama || 'User'}</p><p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Profile</p></div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-600 font-bold text-[10px] uppercase transition-colors"><LogOut size={16} /> Logout Portal</button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 bg-white border-b border-slate-100 shadow-sm z-10 font-sans">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 leading-none">Visualisasi Arsitektur Industri</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Dynamic Multi-Parent Mindmap</p>
                    </div>
                    <div className="flex gap-4 font-sans">
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 shadow-sm"><Bell size={20}/></button>
                        <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 shadow-sm"><Settings size={20}/></button>
                        <button className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-red-700 transition-all tracking-widest shadow-red-100"><Download size={16} className="inline mr-2"/> Export Report</button>
                    </div>
                </header>
                <div className="flex-1 relative bg-white overflow-hidden">
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} fitView>
                        <Background color="#cbd5e1" gap={30} size={1} variant="dots" />
                        <Controls className="bg-white shadow-2xl rounded-xl border-none ml-4 mb-4 overflow-hidden" />
                        <ZoomDisplay />
                    </ReactFlow>
                </div>
            </main>
        </div>
    );
};

const PohonIndustri = () => (<ReactFlowProvider><PohonIndustriContent /></ReactFlowProvider>);
export default PohonIndustri;