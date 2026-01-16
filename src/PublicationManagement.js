import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

const PublicationManagement = () => {
  const [data, setData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const loadScript = (url, callback) => {
    let script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState) {
      script.onreadystatechange = function() {
        if (script.readyState === "loaded" || script.readyState === "complete") {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      script.onload = () => callback();
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
  };

  useEffect(() => {
    fetchData();
    loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", () => {
      console.log("xlsx script loaded");
    });
  }, []);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "publications"));
      const dataList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(dataList);
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
            try {
                const fileContent = event.target.result;
                let parsedData;
                if (selectedFile.name.endsWith('.json')) {
                    parsedData = JSON.parse(fileContent);
                } else if (selectedFile.name.endsWith('.csv')) {
                    if (window.XLSX) {
                        const workbook = window.XLSX.read(fileContent, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        parsedData = window.XLSX.utils.sheet_to_json(worksheet);
                    } else {
                        setNotification({ message: 'Could not parse CSV file. XLSX library not loaded.', type: 'error' });
                        return;
                    }
                } else {
                    setNotification({ message: 'Unsupported file type. Please upload a CSV or JSON file.', type: 'error' });
                    return;
                }
                
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
        if (selectedFile.name.endsWith('.csv')) {
            reader.readAsBinaryString(selectedFile);
        } else {
            reader.readAsText(selectedFile);
        }
    }
  };
  
    const handleImport = async () => {
      if (previewData.length === 0) {
          setNotification({ message: 'No data to import.', type: 'warning' });
          return;
      }
  
      const batch = writeBatch(db);
      previewData.forEach((row) => {
          const docId = row.NO ? String(row.NO) : doc(collection(db, "publications")).id;
          const docRef = doc(db, "publications", docId);
          batch.set(docRef, row);
      });
  
      try {
          await batch.commit();
          setNotification({ message: 'Database Berhasil Diperbarui!', type: 'success' });
          alert('Database Berhasil Diperbarui!');
          setFile(null);
          setPreviewData([]);
          fetchData();
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
    link.setAttribute('download', 'publications_data.json');
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
                      <p className="text-gray-900 whitespace-no-wrap">{String(value)}</p>
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
      <>
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Import & Export Publikasi</h2>
            <p className="mb-4 text-sm text-gray-600">Upload a CSV or JSON file to update the 'publications' database.</p>
            <div className="flex space-x-4 items-center">
                <div>
                    <label htmlFor="file-upload-publication" className="cursor-pointer bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded">
                        Choose File (CSV/JSON)
                    </label>
                    <input id="file-upload-publication" type="file" accept=".csv,.json" className="hidden" onChange={handleFileChange} />
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

        {renderTable(data, "Data from Firestore 'publications'")}
    </>
  );
};

export default PublicationManagement;