import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DataManagement = () => {
  const [data, setData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
        const fetchedData = await fetchData();
        if (fetchedData) {
            setData(fetchedData);
        }
    };

    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pohon_industri"));
      const dataList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Data from Firebase:", dataList);
      return dataList;
    } catch (error) {
      console.error("Error fetching data:", error.message);
      setNotification({ message: `Error fetching data from Firestore: ${error.message}`, type: 'error' });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        setFile(selectedFile);
        setNotification({ message: 'File selected. Reading file...', type: 'info' });
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const jsonText = event.target.result;
            try {
                const parsedJson = JSON.parse(jsonText);
                // Assuming the JSON is an array of objects
                if (Array.isArray(parsedJson)) {
                    setPreviewData(parsedJson);
                    setNotification({ message: 'Preview ready. Please confirm to import.', type: 'info' });
                } else {
                    // Handle case where JSON is a single object
                    setPreviewData([parsedJson]);
                    setNotification({ message: 'Preview ready. Please confirm to import.', type: 'info' });
                }
            } catch (error) {
                setNotification({ message: `Error parsing JSON file: ${error.message}`, type: 'error' });
                console.error("Error parsing JSON file: ", error);
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
      console.log("Starting import process...");
  
      const batch = writeBatch(db);
      previewData.forEach((row, index) => {
          console.log(`Processing row ${index}:`, row);
          if (!row.cmdCode) {
              console.warn(`Skipping row ${index} due to missing cmdCode.`);
              return;
          }
  
          const code = row.cmdCode.toString();
          let parentId = "ROOT";
  
          // LOGIKA PEMETAAN OTOMATIS BERDASARKAN HS CODE
          if (code.startsWith("7219") || code.startsWith("7220")) {
          parentId = "7218";
          } else if (code.startsWith("7304") || code.startsWith("7306")) {
          parentId = "7219";
          } else if (code.startsWith("7214") || code.startsWith("7216")) {
          parentId = "7206";
          } else if (code === "7206" || code === "7218") {
          parentId = "7201";
          }
  
          const cleanAndParse = (value) => {
              if (typeof value !== 'string') return value;
              const cleaned = value.replace(/\./g, '').replace(',', '.');
              const number = parseFloat(cleaned);
              return isNaN(number) ? 0 : number;
          };
  
          // Fallback for potentially malformed keys from different file origins
          const name = row['Product Name'] || row['Product\nName'];
          const fobValue = row['fobvalue (US$)'] || row['fobvalue\n(US$)'];
          const unitValue = row['Unit Value (US$/ton)'] || row['Unit\nValue (US$/ton)'];
  
          console.log(`Extracted values for row ${index}:`, { name, fobValue, unitValue });
  
          const docRef = doc(db, "pohon_industri", code);
          batch.set(docRef, {
              ...row, // Preserve all original fields from the JSON row
              name: name,
              fobValue: cleanAndParse(fobValue),
              unitValue: cleanAndParse(unitValue),
              parentId: parentId,
              cmdCode: code
          });
      });
  
      try {
          await batch.commit();
          setNotification({ message: 'Database Berhasil Diperbarui!', type: 'success' });
          alert('Database Berhasil Diperbarui!');
          setFile(null);
          setPreviewData([]);
          const fetchedData = await fetchData();
          if (fetchedData) {
              setData(fetchedData);
          }
      } catch (error) {
          setNotification({ message: `Error updating database: ${error.message}`, type: 'error' });
          alert(`Error updating database: ${error.message}`);
          console.error("Error committing batch: ", error);
      }
    };
  const exportToJSON = () => {
    if (data.length === 0) {
        setNotification({ message: 'No data to export.', type: 'warning' });
        return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pohon_industri_data.json');
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
            notification.type === 'info' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
        }`} role="alert">
          {notification.message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Import & Export</h2>
        <p className="mb-4 text-sm text-gray-600">Upload a JSON file to update the 'pohon_industri' database. The file should be an array of objects.</p>
        <div className="flex space-x-4 items-center">
            <div>
                <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Choose JSON File
                </label>
                <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileChange} />
            </div>
            <button 
                onClick={handleImport} 
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-purple-300 disabled:cursor-not-allowed"
                disabled={previewData.length === 0}
            >
                Upload Data
            </button>
            <button onClick={exportToJSON} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Export Data (JSON)
            </button>
        </div>
        {file && (
            <p className="text-sm text-gray-500 mt-4">Selected: {file.name}</p>
        )}
      </div>
      
      {previewData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            {renderTable(previewData, "Data Preview")}
        </div>
      )}

      {renderTable(data, "Data from Firestore 'pohon_industri'")}

    </div>
  );
};

export default DataManagement;