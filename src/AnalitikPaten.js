import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import { FileText } from 'lucide-react';
import 'reactflow/dist/style.css';

const initialNodesData = [
    { id: '1', position: { x: 0, y: 150 }, data: { label: 'Perguruan Tinggi (R&D)' }, type: 'input' },
    { id: '2', position: { x: 250, y: 0 }, data: { label: 'BRIN (Validasi & Lisensi)' } },
    { id: '3', position: { x: 250, y: 300 }, data: { label: 'Industri Dalam Negeri' } },
    { id: '4', position: { x: 500, y: 150 }, data: { label: 'Produk Komersial' }, type: 'output' },
    { id: '5', position: { x: 250, y: 450 }, data: { label: 'Industri Luar Negeri' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, label: 'Lisensi & Riset' },
    { id: 'e1-3', source: '1', target: '3', animated: true, label: 'Kerjasama Riset' },
    { id: 'e2-4', source: '2', target: '4', animated: true, label: 'Produk Inovasi BRIN' },
    { id: 'e3-4', source: '3', target: '4', animated: true, label: 'Produk Manufaktur' },
    { id: 'e5-4', source: '5', target: '4', animated: true, label: 'Produk Impor/Lisensi' },
];

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f97316", "#ef4444", "#8b5cf6"];

const AnalitikPaten = () => {
    const [patentsData, setPatentsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Semua');
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

    const filteredPatents = useMemo(() => {
        if (filter === 'Semua') return patentsData;
        return patentsData.filter(p => p.jenisProduk === filter);
    }, [patentsData, filter]);

    const { chartData, productTypes } = useMemo(() => {
        const patentsByYearAndType = filteredPatents.reduce((acc, patent) => {
            if (patent.createdAt instanceof Date) {
                const year = patent.createdAt.getFullYear();
                const type = patent.jenisProduk || 'Lainnya';
                if (!acc[year]) acc[year] = { year };
                acc[year][type] = (acc[year][type] || 0) + 1;
            }
            return acc;
        }, {});
        const allProductTypes = [...new Set(filteredPatents.map(p => p.jenisProduk || 'Lainnya'))];
        const result = Object.values(patentsByYearAndType).sort((a, b) => a.year - b.year);
        return { chartData: result, productTypes: allProductTypes };
    }, [filteredPatents]);

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
        if (loading) return <p>Memuat narasi...</p>;
        const totalPatents = filteredPatents.length;
        const explanation = totalPatents > 0
            ? `Menampilkan data untuk filter "${filter}". Total paten yang ditemukan adalah ${totalPatents}. Grafik menunjukkan tren pendaftaran paten per tahun, dikelompokkan berdasarkan jenis produk.`
            : `Tidak ada data paten untuk filter "${filter}".`;

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
                        onChange={(e) => setFilter(e.target.value)}
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
                <h3 className="text-xl font-bold text-slate-800 mb-6">Perkembangan Paten berdasarkan Jenis Produk</h3>
                {loading ? <p>Memuat chart...</p> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
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
                <h3 className="text-xl font-bold text-slate-800 mb-6">Rekapitulasi Data Paten</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Produk</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Publikasi</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis Produk</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tahun</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-8 text-slate-500">Memuat data...</td></tr>
                            ) : filteredPatents.length > 0 ? filteredPatents.map(patent => (
                                <tr key={patent.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap font-medium">{patent.namaProduk || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{patent.publikasi || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                         <span className={`relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight`}>
                                            <span aria-hidden className={`absolute inset-0 bg-green-200 opacity-50 rounded-full`}></span>
                                            <span className="relative">{patent.jenisProduk || '-'}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{patent.createdAt instanceof Date ? patent.createdAt.getFullYear() : '-'}</p>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center p-8 text-slate-500">Tidak ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100" style={{ height: 600 }}>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Peta Jalan Paten (Dinamis)</h3>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
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
