import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// More robust CSV to JSON converter
const csvToJson = (csv) => {
    console.log("Starting CSV to JSON conversion");
    const lines = csv.split('\n');
    if (lines.length === 0) {
        console.error("CSV is empty or invalid.");
        return [];
    }
    const result = [];
    // Trim and remove quotes from headers
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    console.log("CSV Headers:", headers);

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines

        const obj = {};
        // This regex handles quoted fields with commas
        const currentline = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        
        if (currentline.length === headers.length) {
            for (let j = 0; j < headers.length; j++) {
                let val = currentline[j].trim();
                // Remove quotes if they are at the beginning and end
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1);
                }
                obj[headers[j]] = val;
            }
            result.push(obj);
        } else {
            console.warn(`Skipping line ${i + 1} due to mismatched column count. Expected ${headers.length}, got ${currentline.length}. Line content: ${lines[i]}`);
        }
    }
    console.log("CSV parsing result:", result);
    return result;
};

const PatentManagement = () => {
    const [previewData, setPreviewData] = useState([]);
    const [file, setFile] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [data, setData] = useState([]);
    
    const [jenisProduk, setJenisProduk] = useState('');
    const [jumlahPaten, setJumlahPaten] = useState('');

    const fetchData = useCallback(async () => {
        try {
          console.log("Fetching patents data from Firestore...");
          const querySnapshot = await getDocs(collection(db, "patents"));
          const dataList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(dataList);
          console.log("Patents data fetched:", dataList);
        } catch (error) {
          console.error("Error fetching data:", error.message);
          setNotification({ message: `Error fetching data from Firestore: ${error.message}`, type: 'error' });
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            console.log("File selected:", selectedFile.name);
            setFile(selectedFile);
            setNotification({ message: 'File selected. Reading file...', type: 'info' });

            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target.result;
                console.log("File content loaded.");
                try {
                    let parsedData;
                    if (selectedFile.name.endsWith('.json')) {
                        console.log("Parsing JSON file...");
                        parsedData = JSON.parse(content);
                    } else if (selectedFile.name.endsWith('.csv')) {
                        console.log("Parsing CSV file...");
                        parsedData = csvToJson(content);
                    } else {
                        setNotification({ message: 'Unsupported file type. Please upload a CSV or JSON file.', type: 'error' });
                        return;
                    }
                    
                    console.log("Parsed data:", parsedData);

                    if (Array.isArray(parsedData)) {
                        setPreviewData(parsedData);
                        setNotification({ message: 'Preview ready. Please confirm to import.', type: 'info' });
                    } else {
                        setPreviewData([parsedData]);
                        setNotification({ message: 'Preview ready. Please confirm to import.', type: 'info' });
                    }
                } catch (error) {
                    setNotification({ message: `Error parsing file: ${error.message}`, type: 'error' });
                    console.error("Error parsing file: ", error);
                    setPreviewData([]);
                }
            };
            reader.onerror = (e) => {
                setNotification({ message: `Error reading file: ${e.target.error.name}`, type: 'error' });
                console.error("Error reading file:", e.target.error);
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleImport = async () => {
        if (previewData.length === 0) {
            setNotification({ message: 'No data to import.', type: 'warning' });
            return;
        }
        console.log("Starting patent data import with validation...");

        const invalidRows = [];
        const batch = writeBatch(db);

        previewData.forEach((row, index) => {
            const finalJenisProduk = jenisProduk || row.jenisProduk; // Prioritize dropdown
            const finalNamaProduk = row.namaProduk;
            const finalPublikasi = row.publikasi;

            // Validation check
            if (!finalJenisProduk || !finalNamaProduk || !finalPublikasi) {
                console.warn(`Validation failed for row ${index + 1}:`, {finalJenisProduk, finalNamaProduk, finalPublikasi});
                invalidRows.push({ index: index + 2, name: finalNamaProduk || 'Unknown' }); // +2 because of header and 0-based index
                return; // Skip adding this row to the batch
            }

            const docRef = doc(collection(db, "patents")); // Auto-generates ID
            batch.set(docRef, {
                ...row,
                jenisProduk: finalJenisProduk,
                namaProduk: finalNamaProduk,
                publikasi: finalPublikasi,
                jumlahPaten: jumlahPaten || row.jumlahPaten || 'Tidak Ditentukan',
                createdAt: new Date()
            });
        });

        if (invalidRows.length > 0) {
            const errorMsg = `Import Aborted. ${invalidRows.length} rows are missing required data ('jenisProduk', 'namaProduk', or 'publikasi'). Please fix your file and try again. Problematic rows: ${invalidRows.map(r => r.name).join(', ')}`;
            setNotification({ message: errorMsg, type: 'error' });
            alert(errorMsg);
            return;
        }

        try {
            await batch.commit();
            console.log("Batch commit successful.");
            setNotification({ message: 'Patent database updated successfully!', type: 'success' });
            alert('Patent database updated successfully!');
            setFile(null);
            setPreviewData([]);
            fetchData();
        } catch (error) {
            setNotification({ message: `Error updating database: ${error.message}`, type: 'error' });
            alert(`Error updating database: ${error.message}`);
            console.error("Error committing batch: ", error);
        }
    };
    
    const exportToCSV = () => {
        if (data.length === 0) {
            setNotification({ message: 'No data to export.', type: 'warning' });
            return;
        }
    
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let value = row[header];
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                     if (value instanceof Date) {
                        return value.toISOString();
                    }
                    if(typeof value === 'object' && value !== null){
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'patents_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification({ message: 'Data exported successfully!', type: 'success' });
    };

    const renderTable = (tableData, title) => (
        <div className="my-4">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                {tableData.length > 0 ? (
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                {Object.keys(tableData[0]).map(key => (
                                    <th key={key} className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
                                        <td key={i} className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="p-4">No data to display.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Manajemen Paten</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Produk</label>
                    <select value={jenisProduk} onChange={(e) => setJenisProduk(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                        <option value="">Pilih Jenis Produk</option>
                        <option value="Perguruan Tinggi Dalam Negeri (Data DJKI)">Perguruan Tinggi Dalam Negeri (Data DJKI)</option>
                        <option value="BRIN (Data DJKI)">BRIN (Data DJKI)</option>
                        <option value="Industry Dalam Negeri (Data DJKI)">Industry Dalam Negeri (Data DJKI)</option>
                        <option value="Industry Luar Negeri (Data DJKI)">Industry Luar Negeri (Data DJKI)</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Paten Terkait</label>
                    <select value={jumlahPaten} onChange={(e) => setJumlahPaten(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                        <option value="">Pilih Jumlah Paten</option>
                        <option value="Umum">Umum</option>
                        <option value="BRIN">BRIN</option>
                        <option value="Industry DN">Industry DN</option>
                        <option value="Industry LN">Industry LN</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
            </div>

            <p className="mb-4 text-sm text-gray-600">Upload a CSV or JSON file to update the 'patents' database. The file should be an array of objects.</p>
            <div className="flex space-x-4 items-center">
                <div>
                    <label htmlFor="patent-file-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Choose File (CSV/JSON)
                    </label>
                    <input id="patent-file-upload" type="file" accept=".json,.csv" className="hidden" onChange={handleFileChange} />
                </div>
                <button
                    onClick={handleImport}
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-purple-300 disabled:cursor-not-allowed"
                    disabled={previewData.length === 0}
                >
                    Upload Data
                </button>
                <button onClick={exportToCSV} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    Export Data (CSV)
                </button>
            </div>
            {file && (
                <p className="text-sm text-gray-500 mt-4">Selected: {file.name}</p>
            )}

            {notification.message && (
                <div className={`p-4 my-4 text-sm rounded-lg ${ 
                    notification.type === 'success' ? 'bg-green-100 text-green-700' :
                    notification.type === 'error' ? 'bg-red-100 text-red-700' :
                    notification.type === 'info' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                }`} role="alert">
                {notification.message}
                </div>
            )}
            
            {previewData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow my-6">
                    {renderTable(previewData, "Data Preview")}
                </div>
            )}

            {renderTable(data, "Data from Firestore 'patents'")}
        </div>
    );
};

export default PatentManagement;
