import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import { FileText, X } from 'lucide-react';
import 'reactflow/dist/style.css';

const initialNodesData = [
    { id: '1', position: { x: 0, y: 150 }, data: { label: 'Perguruan Tinggi (R&D)' }, type: 'input' },
    { id: '2', position: { x: 250, y: 0 }, data: { label: 'BRIN (Validasi & Lisensi)' } },
    { id: '3', position: { x: 250, y: 300 }, data: { label: 'Industri Dalam Negeri' } },
    { id: '4', position: { x: 500, y: 150 }, data: { label: 'Produk Komersial' }, type: 'output' },
    { id: '5', position: { x: 250, y: 450 }, data: { label: 'Industri Luar Negeri' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    { id: 'e2-4', source: '2', target: '4', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true },
    { id: 'e5-4', source: '5', target: '4', animated: true },
];

const COLORS = {
    pt: "#0ea5e9",
    brin: "#6366f1",
    idn: "#10b981",
    iln: "#f97316",
    lainnya: "#ef4444"
};

// Use simplified keys without newlines
const KEY_MAP = {
    "Perguruan Tinggi Dalam Negeri (Data DJKI)": "pt",
    "BRIN (Data DJKI)": "brin",
    "Industry Dalam Negeri (Data DJKI)": "idn",
    "Industry Luar Negeri (Data DJKI)": "iln",
    "Lainnya": "lainnya"
};

const DISPLAY_NAMES = {
    pt: "Perguruan Tinggi Dalam Negeri (Data DJKI)",
    brin: "BRIN (Data DJKI)",
    idn: "Industry Dalam Negeri (Data DJKI)",
    iln: "Industry Luar Negeri (Data DJKI)",
    lainnya: "Lainnya"
};

const SAFE_KEYS = Object.values(KEY_MAP);

// Normalization function to handle whitespace and newlines
const normalizeKey = (key) => key.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ');

const DetailModal = ({ product, onClose }) => {
    if (!product) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-slate-800">{product.JenisProduk}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </div>
                <ul>
                    {SAFE_KEYS.map(key => (
                        <li key={key} className="flex justify-between items-center py-3 border-b">
                            <span className="text-sm text-gray-600">{DISPLAY_NAMES[key]}</span>
                            <span className="text-lg font-bold text-sky-600">{product[key] || 0}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const AnalitikPaten = () => {
    const [patentsData, setPatentsData] = useState([]);
    const [publications, setPublications] = useState([]);
    const [publicationHolders, setPublicationHolders] = useState([]);
    const [selectedHolder, setSelectedHolder] = useState('');
    const [filteredPublications, setFilteredPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
    const [edges] = useEdgesState(initialEdges);

    const chartData = useMemo(() => {
        return patentsData.map(p => {
            const total = SAFE_KEYS.reduce((acc, key) => acc + (p[key] || 0), 0);
            return { ...p, total };
        });
    }, [patentsData]);

    const totalPatents = useMemo(() => chartData.reduce((acc, p) => acc + p.total, 0), [chartData]);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch patents
                const patentsSnapshot = await getDocs(collection(db, "patents"));
                const patentsList = patentsSnapshot.docs.map(doc => {
                    const rawData = doc.data();
                    const sanitizedData = { id: doc.id };
                    
                    for (const rawKey in rawData) {
                        const normalizedRawKey = normalizeKey(rawKey);
                        const matchedKey = Object.keys(KEY_MAP).find(k => normalizeKey(k) === normalizedRawKey);

                        if (matchedKey) {
                            sanitizedData[KEY_MAP[matchedKey]] = Number(rawData[rawKey]) || 0;
                        } else {
                            sanitizedData[rawKey] = rawData[rawKey];
                        }
                    }
                    return sanitizedData;
                });
                setPatentsData(patentsList);

                // Fetch publications
                const publicationsSnapshot = await getDocs(collection(db, "publications"));
                const publicationsList = publicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPublications(publicationsList);

                const holders = [...new Set(publicationsList.map(p => p.PEMEGANG).filter(Boolean))];
                setPublicationHolders(holders);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedHolder) {
            setFilteredPublications(publications.filter(p => p.PEMEGANG === selectedHolder));
        } else {
            setFilteredPublications([]);
        }
    }, [selectedHolder, publications]);

    useEffect(() => {
        if (selectedHolder) {
            const holderCount = filteredPublications.length;
            setNodes(nds =>
                nds.map(node => {
                    const newLabel = (label, count) => `${label} (${count} Publikasi)`;
                    if (node.data.label.includes('Perguruan Tinggi') && selectedHolder === 'Perguruan Tinggi') {
                        node.data = { ...node.data, label: newLabel('Perguruan Tinggi', holderCount) };
                    } else if (node.data.label.includes('BRIN') && selectedHolder === 'BRIN') {
                        node.data = { ...node.data, label: newLabel('BRIN', holderCount) };
                    } else if (node.data.label.includes('Industri DN') && selectedHolder === 'Industri Dalam Negeri') {
                        node.data = { ...node.data, label: newLabel('Industri DN', holderCount) };
                    } else if (node.data.label.includes('Industri LN') && selectedHolder === 'Industri Luar Negeri') {
                        node.data = { ...node.data, label: newLabel('Industri LN', holderCount) };
                    } else {
                        // Reset other nodes
                        const originalLabel = initialNodesData.find(n => n.id === node.id).data.label;
                        node.data = { ...node.data, label: originalLabel };
                    }
                    return node;
                })
            );
        } else {
            // Reset all nodes if no holder is selected
            setNodes(initialNodesData);
        }
    }, [filteredPublications, selectedHolder, setNodes]);

    const handleChartClick = (data) => {
        if (data && data.activePayload) {
            setSelectedProduct(data.activePayload[0].payload);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <DetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="bg-sky-50 border-l-4 border-sky-500 text-sky-800 p-4 rounded-r-lg" role="alert">
                    <div className="flex">
                        <div className="py-1"><FileText className="h-5 w-5 text-sky-500 mr-3" /></div>
                        <div>
                            <p className="font-bold">Narasi Analitik</p>
                            <p className="text-sm">Grafik menunjukkan total paten untuk setiap jenis produk, dipecah berdasarkan sumber. Klik pada bar untuk melihat detail rincian paten.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Filter Publikasi berdasarkan Pemegang</h3>
                <select
                    value={selectedHolder}
                    onChange={(e) => setSelectedHolder(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="">Pilih Pemegang</option>
                    {publicationHolders.map(holder => (
                        <option key={holder} value={holder}>{holder}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Perkembangan Paten berdasarkan Jenis Produk</h3>
                {loading ? <p>Memuat chart...</p> : (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} onClick={handleChartClick} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="JenisProduk" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {SAFE_KEYS.map((key) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={COLORS[key]} name={DISPLAY_NAMES[key]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {selectedHolder && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Publikasi oleh {selectedHolder}</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    {filteredPublications.length > 0 && Object.keys(filteredPublications[0]).map(key => (
                                        <th key={key} className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPublications.map((row, index) => (
                                    <tr key={index}>
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <p className="text-gray-900 whitespace-no-wrap">{String(value)}</p>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100" style={{ height: 600 }}>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Peta Jalan Paten (Total Paten: {totalPatents})</h3>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};

export default AnalitikPaten;
