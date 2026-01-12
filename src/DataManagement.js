import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';

const DataManagement = () => {
  const [data, setData] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const dataCollection = collection(db, 'pohon_industri');
      const dataSnapshot = await getDocs(dataCollection);
      const dataList = dataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(dataList);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setNotification({ message: `Error fetching data from Firestore: ${error.message}`, type: 'error' });
    }
  };

  const handleUpload = (file) => {
    if (!file) {
        setNotification({ message: 'Please select a file to upload.', type: 'warning' });
        return;
    }
    Papa.parse(file, {
      header: true,
      delimiter: ";",
      complete: async (results) => {
        const batch = writeBatch(db);
        
        results.data.forEach((row) => {
          if (!row.cmdCode) return;
  
          const code = row.cmdCode.toString();
          let parentId = "ROOT";
  
          // LOGIKA PEMETAAN OTOMATIS BERDASARKAN HS CODE
          if (code.startsWith("7219") || code.startsWith("7220")) {
            parentId = "7218"; // Produk Stainless Steel Flat-rolled anaknya Ingot (7218)
          } else if (code.startsWith("7304") || code.startsWith("7306")) {
            parentId = "7219"; // Pipa (73) anaknya HRC (7219)
          } else if (code.startsWith("7214") || code.startsWith("7216")) {
            parentId = "7206"; // Steel Bar anaknya Iron Ingot (7206)
          } else if (code === "7206" || code === "7218") {
            parentId = "7201"; // Ingot anaknya Pig Iron/Ferro Alloy (7201/7202)
          }
  
          const docRef = doc(db, "pohon_industri", code);
          batch.set(docRef, {
            name: row['Product Name'],
            fobValue: row['fobvalue (US$)'],
            unitValue: row['Unit Value (US$/ton)'],
            parentId: parentId,
            cmdCode: code
          });
        });
  
        try {
            await batch.commit();
            setNotification({ message: 'Database Berhasil Diperbarui!', type: 'success' });
            fetchData(); // Refresh data
        } catch (error) {
            setNotification({ message: `Error updating database: ${error.message}`, type: 'error' });
            console.error("Error committing batch: ", error);
        }
      },
      error: (error) => {
        setNotification({ message: `Error parsing CSV file: ${error.message}`, type: 'error' });
        console.error("Error parsing file:", error);
      }
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        handleUpload(selectedFile);
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
        ...data.map(row => headers.map(header => JSON.stringify(row[header], replacer)).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pohon_industri_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({ message: 'Data exported successfully!', type: 'success' });
  };

  function replacer(key, value) {
    return value === null || value === undefined ? '' : value;
  }


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
                      <p className="text-gray-900 whitespace-no-wrap">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
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

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Data Management</h1>
        <p className="text-red-500">You must be logged in to manage data. Please log in first.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Data Management for Pohon Industri</h1>
            <Link to="/dashboard" className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors">
                <ArrowLeft size={18} />
                Back to Dashboard
            </Link>
        </div>

      {notification.message && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${ 
            notification.type === 'success' ? 'bg-green-100 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
        }`} role="alert">
          {notification.message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Import & Export</h2>
        <p className="mb-4 text-sm text-gray-600">Upload a CSV file with a ';' delimiter to update the 'pohon_industri' database. Required columns: cmdCode, Product Name, fobvalue (US$), Unit Value (US$/ton).</p>
        <div className="flex space-x-4">
            <div>
                <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Upload CSV
                </label>
                <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
            <button onClick={exportToCSV} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Export Data (CSV)
            </button>
        </div>
      </div>
      
      {renderTable(data, "Data from Firestore 'pohon_industri'")}

    </div>
  );
};

export default DataManagement;