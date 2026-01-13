import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Minus } from 'lucide-react';

const IndustrialNode = ({ data }) => {
  const isFinal = data.category === 'FINAL PRODUCT';
  const headerColor = isFinal ? 'bg-orange-500' : 'bg-emerald-500';

  return (
    /* Efek Menyelimuti: Kita gunakan hover:ring dan hover:border agar border merah 
       terlihat menyatu dan membungkus seluruh kotak secara solid */
    <div className={`
      bg-white border-2 border-slate-100 shadow-xl rounded-2xl overflow-visible 
      min-w-[240px] relative transition-all duration-300 ease-in-out
      hover:border-red-500 hover:ring-4 hover:ring-red-500/10 hover:z-50 group
    `}>
      
      {/* Tombol Expand Kiri */}
      <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); data.onExpandParent(data.id); }}
            className="bg-white border border-slate-200 shadow-lg rounded-full p-2 hover:bg-red-50 text-red-600 transition-all hover:scale-110"
          >
            <Plus size={14} strokeWidth={4} />
          </button>
      </div>

      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-red-500 border-none opacity-0" />
      
      {/* Header Kotak */}
      <div className={`text-[9px] font-black px-4 py-2 uppercase tracking-widest text-white ${headerColor} rounded-t-xl`}>
        {data.category}
      </div>
      
      <div className="p-6 text-center cursor-pointer" onClick={() => data.onShowDetail(data)}>
        <h4 className="text-[12px] font-black text-slate-800 uppercase leading-tight mb-3 tracking-tighter">
          {data.label}
        </h4>
        <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl w-fit mx-auto font-mono border border-slate-100">
          HS {data.hsCode}
        </p>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-red-500 border-none opacity-0" />

      {/* Tombol Expand/Hide Kanan */}
      <div className="absolute right-[-22px] top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); data.onExpandChildren(data.id); }}
            className="bg-white border border-slate-200 shadow-lg rounded-full p-2 hover:bg-emerald-50 text-emerald-600 transition-all hover:scale-110"
          >
            <Plus size={14} strokeWidth={4} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); data.onHideChildren(data.id); }}
            className="bg-white border border-slate-200 shadow-lg rounded-full p-2 hover:bg-slate-50 text-slate-400 transition-all hover:scale-110"
          >
            <Minus size={14} strokeWidth={4} />
          </button>
      </div>
    </div>
  );
};

export default memo(IndustrialNode);