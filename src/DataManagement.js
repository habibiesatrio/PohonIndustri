import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Assuming firebase.js exports a db object
import { collection, addDoc, getDocs } from 'firebase/firestore';

const DataManagement = () => {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dataCollection = collection(db, 'exportData');
      const dataSnapshot = await getDocs(dataCollection);
      const dataList = dataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(dataList);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setNotification({ message: 'Error fetching data from Firestore.', type: 'error' });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        const fileName = selectedFile.name.toLowerCase();
        if (fileName.endsWith('.csv') || fileName.endsWith('.json')) {
            setFile(selectedFile);
            parseFile(selectedFile);
        } else {
            setNotification({ message: 'Unsupported file type. Please upload CSV or JSON.', type: 'error' });
        }
    }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          setPreviewData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } else if (fileName.endsWith('.csv')) {
          // Basic CSV parsing
          const lines = content.split('\n').filter(line => line.trim() !== '');
          const headers = lines[0].split(',').map(h => h.trim());
          const jsonData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i];
              return obj;
            }, {});
          });
          setPreviewData(jsonData);
        }
        setNotification({ message: 'File ready for preview.', type: 'info' });
      } catch (error) {
        setNotification({ message: 'Error parsing file. Please check the file format.', type: 'error' });
        console.error("Error parsing file:", error);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      setNotification({ message: 'No data to import.', type: 'warning' });
      return;
    }

    try {
      const dataCollection = collection(db, 'exportData');
      for (const item of previewData) {
        await addDoc(dataCollection, item);
      }
      setNotification({ message: 'Data imported successfully!', type: 'success' });
      setFile(null);
      setPreviewData([]);
      fetchData(); // Refresh data from Firestore
    } catch (error) {
      setNotification({ message: 'Error importing data to Firestore.', type: 'error' });
      console.error("Error importing data: ", error);
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
    link.setAttribute('download', 'export_data.csv');
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Management</h1>

      {notification.message && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${ 
            notification.type === 'success' ? 'bg-green-100 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 text-red-700' :
            notification.type === 'info' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
        }`} role="alert">
          {notification.message}
        </div>
      )}

      <div className="flex space-x-2 mb-4">
        <div>
          <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Choose File (CSV/JSON)
          </label>
          <input id="file-upload" type="file" accept=".csv,.json" className="hidden" onChange={handleFileChange} />
        </div>
        <button onClick={exportToCSV} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Export Data (CSV)
        </button>
      </div>
      
      {previewData.length > 0 && (
        <div>
          {renderTable(previewData, "Data Preview")}
          <button onClick={handleImport} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-2">
            Confirm Import
          </button>
        </div>
      )}

      {renderTable(data, "Data from Firestore")}

    </div>
  );
};

export default DataManagement;
