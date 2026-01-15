import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

console.log("AnalitikPaten.js module loaded");

const initialNodes = [
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

const AnalitikPaten = () => {
    console.log("AnalitikPaten component rendering...");
    const [patentsData, setPatentsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Semua');

    useEffect(() => {
        console.log("AnalitikPaten: useEffect for fetching data triggered.");
        const fetchPatents = async () => {
            setLoading(true);
            try {
                console.log("Fetching patents from Firestore...");
                const querySnapshot = await getDocs(collection(db, "patents"));
                const dataList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    if (data.createdAt && data.createdAt.toDate) {
                        data.createdAt = data.createdAt.toDate();
                    }
                    return {
                        id: doc.id,
                        ...data
                    };
                });
                console.log("Fetched patents data:", dataList);
                setPatentsData(dataList);
            } catch (error) {
                console.error("Error fetching patents data:", error);
            } finally {
                setLoading(false);
                console.log("Finished fetching patents data, loading set to false.");
            }
        };

        fetchPatents();
    }, []);

    const filteredPatents = useMemo(() => {
        console.log("Calculating filteredPatents. Current filter:", filter);
        if (filter === 'Semua') {
            return patentsData;
        }
        const result = patentsData.filter(p => p.jenisProduk === filter);
        console.log("Filtered patents result:", result);
        return result;
    }, [patentsData, filter]);

    const chartData = useMemo(() => {
        console.log("Calculating chartData.");
        const patentsByYear = filteredPatents.reduce((acc, patent) => {
            if (patent.createdAt instanceof Date) {
                const year = patent.createdAt.getFullYear();
                acc[year] = (acc[year] || 0) + 1;
            } else {
                console.warn("Patent object does not have a valid 'createdAt' Date field:", patent);
            }
            return acc;
        }, {});

        const result = Object.keys(patentsByYear).map(year => ({
            year: year,
            jumlah: patentsByYear[year],
        })).sort((a, b) => a.year - b.year);
        console.log("Chart data result:", result);
        return result;
    }, [filteredPatents]);

    const renderExplanation = () => {
        if (loading) return <p>Loading data...</p>;

        const totalPatents = filteredPatents.length;
        if (totalPatents === 0) {
            return <p>Tidak ada data paten untuk filter "{filter}".</p>;
        }

        const explanation = `
            Menampilkan data untuk filter "${filter}". 
            Total paten yang ditemukan adalah ${totalPatents}. 
            Grafik menunjukkan tren pendaftaran paten per tahun. 
            Peta jalan di bawah ini mengilustrasikan alur umum dari riset hingga komersialisasi produk.
        `;
        return <p className="text-gray-600 text-sm">{explanation}</p>;
    };

    console.log("AnalitikPaten: rendering return statement.");
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
                <div className="bg-gray-50 p-4 rounded-lg">
                    {renderExplanation()}
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Perkembangan Paten</h3>
                {loading ? <p>Loading chart...</p> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="jumlah" fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100" style={{ height: 600 }}>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Peta Jalan Paten</h3>
                <ReactFlow
                    nodes={initialNodes}
                    edges={initialEdges}
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
