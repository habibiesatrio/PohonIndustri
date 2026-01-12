import React, { useMemo } from 'react';
import Tree from 'react-d3-tree';

const IndustrialTree = ({ rawData }) => {
  // 1. Transformasi data Flat JSON ke format Tree (Nested)
  const treeData = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return null;
    }

    const map = {};
    const roots = [];

    rawData.forEach((item) => {
      // Use cmdCode as the unique ID for mapping
      map[item.cmdCode] = { 
        name: item['Product Name'] || item.name, 
        attributes: {
          "Total Devisa": `$${item.fobValue?.toLocaleString('en-US')}`,
          "Harga/Ton": `$${item.unitValue?.toFixed(2)}`,
          "Volume": `${item['qty (ton)'] || 'N/A'} Ton`
        },
        children: [] 
      };
    });

    rawData.forEach((item) => {
      if (item.parentId !== "ROOT" && map[item.parentId]) {
        if (map[item.cmdCode]) { // Ensure child exists
            map[item.parentId].children.push(map[item.cmdCode]);
        }
      } else if (item.parentId === "ROOT") {
        if (map[item.cmdCode]) { // Ensure root exists
            roots.push(map[item.cmdCode]);
        }
      }
    });

    // To handle multiple root nodes, we can wrap them in a single virtual root.
    if (roots.length > 1) {
        return {
            name: "Pohon Industri Nasional",
            children: roots
        };
    }

    return roots[0]; // Mengambil root pertama sebagai kepala pohon
  }, [rawData]);

  // 2. Custom Style untuk Kotak (Node) agar seperti Dashboard
  const renderCustomNode = ({ nodeDatum, toggleNode }) => (
    <g>
      <rect 
        width="220" 
        height="100" 
        x="-110" 
        y="-55" 
        rx="10" 
        fill="white" 
        stroke={nodeDatum.children ? "#dc2626" : "#3b82f6"}
        strokeWidth="2" 
        onClick={toggleNode}
        cursor="pointer"
      />
      <text fill="black" x="-100" y="-30" style={{ fontWeight: 'bold', fontSize: '14px' }}>
        {nodeDatum.name && nodeDatum.name.length > 22 ? nodeDatum.name.substring(0, 22) + "..." : nodeDatum.name}
      </text>
      <text fill="#6b7280" x="-100" y="-5" fontSize="12">
        Devisa: {nodeDatum.attributes["Total Devisa"]}
      </text>
      <text fill="#059669" x="-100" y="15" fontSize="13" style={{ fontWeight: 'bold' }}>
        Value: {nodeDatum.attributes["Harga/Ton"]} /Ton
      </text>
       <text fill="#1e40af" x="-100" y="35" fontSize="12">
        Volume: {nodeDatum.attributes["Volume"]}
      </text>
    </g>
  );

  if (!treeData) {
    return (
        <div style={{ width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
            <p>Data is empty or not in the correct format.</p>
        </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '80vh', backgroundColor: '#f3f4f6', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
      <Tree 
        data={treeData} 
        orientation="vertical"
        translate={{ x: 600, y: 50 }}
        renderCustomNodeElement={renderCustomNode}
        pathFunc="step"
        nodeSize={{ x: 250, y: 200 }}
        separation={{ siblings: 1.2, nonSiblings: 1.2 }}
        zoomable={true}
      />
    </div>
  );
};

export default IndustrialTree;
