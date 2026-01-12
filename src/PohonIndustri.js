import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, FileText, Folder, FolderOpen, ChevronRight } from 'lucide-react';

// Helper function to build the tree from a flat list of nodes
const buildTree = (nodes) => {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node, children: [] }]));
    const tree = [];

    const hasCycle = (child, parent) => {
        let current = parent;
        while (current) {
            if (current.id === child.id) return true;
            current = nodeMap.get(current.parentId);
        }
        return false;
    };

    nodeMap.forEach(node => {
        if (node.parentId && nodeMap.has(node.parentId)) {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                if (hasCycle(node, parent)) {
                    console.warn("Cycle detected! Skipping node:", node.id, "to prevent infinite loop.");
                    tree.push(node); // Treat as a root node to avoid losing it
                } else {
                    parent.children.push(node);
                }
            }
        } else {
            tree.push(node);
        }
    });
    
    const compareNodes = (a, b) => {
        const nameA = String(a.name || '').toUpperCase();
        const nameB = String(b.name || '').toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    };

    nodeMap.forEach(node => {
        if (node.children) {
            node.children.sort(compareNodes);
        }
    });
    tree.sort(compareNodes);

    return tree;
};

// Recursive TreeNode Component
const TreeNode = ({ node, level, onNodeSelect, selectedNode }) => {
    const [isOpen, setIsOpen] = useState(level < 1); // Auto-expand root and first level

    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode && selectedNode.id === node.id;

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };
    
    const handleSelect = (e) => {
        e.stopPropagation();
        onNodeSelect(node);
    };

    return (
        <div style={{ marginLeft: `${level * 20}px` }}>
            <div 
                onClick={handleSelect}
                className={`flex items-center space-x-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-red-100' : 'hover:bg-slate-100'}`}
            >
                {hasChildren ? (
                    <span onClick={handleToggle} className="p-0.5 hover:bg-slate-200 rounded">
                        {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                ) : <span className="w-[18px]"></span>}
                
                {hasChildren ? 
                    (isOpen ? <FolderOpen size={16} className="text-amber-500" /> : <Folder size={16} className="text-amber-500" />) : 
                    <FileText size={16} className="text-slate-500" />
                }
                
                <span className={`text-sm font-medium ${isSelected ? 'font-bold text-red-700' : 'text-slate-800'}`}>{node.name || 'Unnamed Node'}</span>
            </div>
            {isOpen && hasChildren && (
                <div className="border-l-2 border-slate-200 ml-3 pl-1">
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} level={level + 1} onNodeSelect={onNodeSelect} selectedNode={selectedNode} />
                    ))}
                </div>
            )}
        </div>
    );
};

const DetailView = ({ node }) => {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div>
                <p className="text-sm font-bold text-slate-500">Product Name</p>
                <h3 className="text-2xl font-bold text-slate-900">{node.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                    <p className="text-sm font-bold text-slate-500">HS Code (cmdCode)</p>
                    <p className="text-lg text-slate-800 font-mono">{node.id}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500">Parent ID</p>
                    <p className="text-lg text-slate-800 font-mono">{node.parentId}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500">FOB Value (US$)</p>
                    <p className="text-lg text-emerald-600 font-semibold">{node.fobValue?.toLocaleString('de-DE') || 'N/A'}</p>
                </div>
                 <div>
                    <p className="text-sm font-bold text-slate-500">Unit Value (US$/ton)</p>
                    <p className="text-lg text-indigo-600 font-semibold">{node.unitValue?.toLocaleString('de-DE') || 'N/A'}</p>
                </div>
            </div>
            <details className="pt-4 border-t">
                <summary className="text-sm font-bold text-slate-500 cursor-pointer">Raw Data</summary>
                <pre className="text-xs bg-slate-100 p-4 rounded-lg mt-2 overflow-x-auto">
                    {JSON.stringify(node, null, 2)}
                </pre>
            </details>
        </div>
    )
}

const PohonIndustri = () => {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "pohon_industri"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Received snapshot from Firestore...");
            const dataList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            if (dataList.length > 0) {
                const tree = buildTree(dataList);
                setTreeData(tree);
            } else {
                setTreeData([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching realtime data: ", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <div className="h-screen w-full flex bg-slate-50 font-sans">
            <div className="w-1/3 bg-white p-6 border-r border-slate-200 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                     <h1 className="text-xl font-black text-slate-800">Pohon Industri</h1>
                     <Link to="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
                        <ArrowLeft size={16} />
                        Dashboard
                    </Link>
                </div>
                {loading ? (
                    <p className="text-slate-500">Loading data from Firestore...</p>
                ) : treeData.length > 0 ? (
                    <div className="space-y-1">
                        {treeData.map(node => (
                            <TreeNode key={node.id} node={node} level={0} onNodeSelect={setSelectedNode} selectedNode={selectedNode} />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">No data found in 'pohon_industri' collection. Please upload a data file.</p>
                )}
            </div>
            <div className="w-2/3 p-12 overflow-y-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
                    <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
                        <FileText size={24} className="text-red-600"/>
                        Detail Produk
                    </h2>
                    {selectedNode ? (
                        <DetailView node={selectedNode} />
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-slate-500 font-semibold">Click on a node to see its details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PohonIndustri;
