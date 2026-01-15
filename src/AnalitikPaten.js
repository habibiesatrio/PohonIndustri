import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import { FileText, XCircle } from 'lucide-react';
import 'reactflow/dist/style.css';

const initialNodesData = [
    { id: '1', position: { x: 0, y: 150 }, data: { label: 'Perguruan Tinggi (R&D)', type: 'Perguruan Tinggi Dalam Negeri (Data DJKI)' }, type: 'input' },
    { id: '2', position: { x: 250, y: 0 }, data: { label: 'BRIN (Validasi & Lisensi)', type: 'BRIN (Data DJKI)' } },
    { id: '3', position: { x: 250, y: 300 }, data: { label: 'Industri Dalam Negeri', type: 'Industry Dalam Negeri (Data DJKI)' } },
    { id: '4', position: { x: 500, y: 150 }, data: { label: 'Produk Komersial' }, type: 'output' },
    { id: '5', position: { x: 250, y: 450 }, data: { label: 'Industri Luar Negeri', type: 'Industry Luar Negeri (Data DJKI)' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, label: 'Lisensi & Riset' },
    { id: 'e1-3', source: '1', target: '3', animated: true, label: 'Kerjasama Riset' },
    { id: 'e2-4', source: '2', target: '4', animated: true, label: 'Produk Inovasi BRIN' },
    { id: 'e3-4', source: '3', target: '4', animated: true, label: 'Produk Manufaktur' },
    { id: 'e5-4', source: '5', target: '4', animated: true, label: 'Produk Impor/Lisensi' },
];

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f97316", "#ef4444", "#8b5cf6"];

const PatentCard = ({ patent }) => (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all ease-in-out">
        <p className="text-xs font-bold text-sky-600 uppercase mb-1">{patent.jenisProduk || 'N/A'}</p>
        <h4 className="font-bold text-slate-800 mb-2">{patent.namaProduk || 'Nama Produk Tidak Tersedia'}</h4>
        <p className="text-xs text-slate-500 mb-3">Publikasi: <span className="font-semibold">{patent.publikasi || 'N/A'}</span></p>
        <p className="text-xs font-mono bg-slate-50 rounded p-1 text-center">Tahun: {patent.createdAt instanceof Date ? patent.createdAt.getFullYear() : 'N/A'}</p>
    </div>
);


const AnalitikPaten = () => {
    const [patentsData, setPatentsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Semua');
    const [drilldownFilter, setDrilldownFilter] = useState(null); // { key, value }
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
    const [edges] = useEdgesState(initialEdges);

    useEffect(() => {
        const fetchPatents = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "patents"));
                const dataList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    if (data.createdAt && data.createdAt.toDate) {
                        data.createdAt = data.createdAt.toDate();
                    }
                    return { id: doc.id, ...data };
                });
                setPatentsData(dataList);
            } catch (error) {
                console.error("Error fetching patents data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatents();
    }, []);

    const handleChartClick = (data) => {
        if (data && data.activePayload) {
            const payload = data.activePayload[0].payload;
            const year = payload.year;
            const productType = data.activeLabel;
            setDrilldownFilter({ year, jenisProduk: productType });
        }
    };
    
    const onNodeClick = useCallback((event, node) => {
        const productType = node.data.type;
        if (productType && productType !== 'output') {
             setDrilldownFilter({ jenisProduk: productType });
        }
    }, []);

    const clearDrilldown = () => setDrilldownFilter(null);

    const patentsForDisplay = useMemo(() => {
        let data = (filter === 'Semua') ? patentsData : patentsData.filter(p => p.jenisProduk === filter);
        if (drilldownFilter) {
            data = data.filter(p => {
                let matches = true;
                if (drilldownFilter.year) {
                    matches = matches && p.createdAt instanceof Date && p.createdAt.getFullYear() === drilldownFilter.year;
                }
                if (drilldownFilter.jenisProduk) {
                    matches = matches && p.jenisProduk === drilldownFilter.jenisProduk;
                }
                return matches;
            });
        }
        return data;
    }, [patentsData, filter, drilldownFilter]);

    const { chartData, productTypes } = useMemo(() => {
        const dataToProcess = (filter === 'Semua') ? patentsData : patentsData.filter(p => p.jenisProduk === filter);
        const patentsByYearAndType = dataToProcess.reduce((acc, patent) => {
            if (patent.createdAt instanceof Date) {
                const year = patent.createdAt.getFullYear();
                const type = patent.jenisProduk || 'Lainnya';
                if (!acc[year]) acc[year] = { year };
                acc[year][type] = (acc[year][type] || 0) + 1;
            }
            return acc;
        }, {});
        const allProductTypes = [...new Set(dataToProcess.map(p => p.jenisProduk || 'Lainnya'))];
        const result = Object.values(patentsByYearAndType).sort((a, b) => a.year - b.year);
        return { chartData: result, productTypes: allProductTypes };
    }, [patentsData, filter]);

    useEffect(() => {
        const counts = patentsData.reduce((acc, p) => {
            const type = p.jenisProduk;
            if (type) {
                if (type.includes('Perguruan Tinggi')) acc.pt++;
                else if (type.includes('BRIN')) acc.brin++;
                else if (type.includes('Industri Dalam Negeri')) acc.idn++;
                else if (type.includes('Industri Luar Negeri')) acc.iln++;
            }
            return acc;
        }, { pt: 0, brin: 0, idn: 0, iln: 0 });

        setNodes(nds =>
            nds.map(node => {
                const newLabel = (label, count) => `${label} (${count} Paten)`;
                if (node.id === '1') node.data = { ...node.data, label: newLabel('Perguruan Tinggi', counts.pt) };
                if (node.id === '2') node.data = { ...node.data, label: newLabel('BRIN', counts.brin) };
                if (node.id === '3') node.data = { ...node.data, label: newLabel('Industri DN', counts.idn) };
                if (node.id === '5') node.data = { ...node.data, label: newLabel('Industri LN', counts.iln) };
                return node;
            })
        );
    }, [patentsData, setNodes]);


    const renderExplanation = () => {
        const totalPatents = patentsForDisplay.length;
        let explanation = `Menampilkan ${totalPatents} paten. `;

        if(drilldownFilter) {
            const year = drilldownFilter.year;
            const type = drilldownFilter.jenisProduk;
            explanation = `Drilldown aktif: ${totalPatents} paten ditemukan untuk ${type ? `tipe "${type}"` : ''} ${year ? `di tahun ${year}`: ''}. Klik tombol 'Clear' untuk kembali.`
        } else if (filter !== 'Semua') {
            explanation += `Data difilter berdasarkan jenis produk: "${filter}".`
        } else {
            explanation += 'Semua data paten ditampilkan.'
        }


        return (
            <div className="bg-sky-50 border-l-4 border-sky-500 text-sky-800 p-4 rounded-r-lg" role="alert">
                <div className="flex">
                    <div className="py-1"><FileText className="h-5 w-5 text-sky-500 mr-3" /></div>
                    <div>
                        <p className="font-bold">Narasi Analitik</p>
                        <p className="text-sm">{explanation}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Filter Analitik</h3>
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); clearDrilldown(); }}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="Semua">Semua Jenis Produk</option>
                        <option value="Perguruan Tinggi Dalam Negeri (Data DJKI)">Perguruan Tinggi Dalam Negeri</option>
                        <option value="BRIN (Data DJKI)">BRIN</option>
                        <option value="Industry Dalam Negeri (Data DJKI)">Industri Dalam Negeri</option>
                        <option value="Industry Luar Negeri (Data DJKI)">Industri Luar Negeri</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
                {renderExplanation()}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Perkembangan Paten (Klik bar untuk detail)</h3>
                {loading ? <p>Memuat chart...</p> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {productTypes.map((type, index) => (
                                <Bar key={type} dataKey={type} stackId="a" fill={COLORS[index % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Detail Data Paten</h3>
                    {drilldownFilter && (
                        <button onClick={clearDrilldown} className="flex items-center gap-2 text-xs font-bold bg-sky-100 text-sky-700 px-3 py-1 rounded-full hover:bg-sky-200 transition-colors">
                            <XCircle size={14} /> Clear Drilldown
                        </button>
                    )}
                </div>
                {loading ? <p>Memuat data...</p> : patentsForDisplay.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {patentsForDisplay.map(patent => <PatentCard key={patent.id} patent={patent} />)}
                    </div>
                ) : (
                    <p className="text-center p-8 text-slate-500">Tidak ada data untuk ditampilkan.</p>
                )}
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100" style={{ height: 600 }}>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Peta Jalan Paten (Klik node untuk filter)</h3>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onNodeClick={onNodeClick}
                    fitView
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};

export default AnalitikPaten;
