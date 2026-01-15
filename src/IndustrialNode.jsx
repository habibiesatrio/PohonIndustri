import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Minus, Zap, Layers, ArrowUp, ArrowDown } from 'lucide-react';

const IndustrialNode = ({ data }) => {
  const isFinal = data.Tier?.includes('Tier 5');
  const isRaw = data.Tier?.includes('Tier 1');
  const headerColor = isRaw ? 'bg-emerald-500' : (isFinal ? 'bg-orange-500' : 'bg-blue-500');

  return (
    <div className="relative group">
      {/* TOMBOL KIRI: EXPAND/HIDE PARENT (HULU) */}
      <div className="absolute left-[-25px] top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[100]">
          <button 
            onClick={(e) => { e.stopPropagation(); data.onExpandParent(data.Harmony_ID); }}
            className="bg-white border-2 border-red-500 shadow-xl rounded-full p-1.5 hover:bg-red-500 hover:text-white text-red-500 transition-all hover:scale-110 active:scale-90"
            title="Expand Parents"
          >
            <Plus size={14} strokeWidth={4} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); data.onHideParent(data.Harmony_ID); }}
            className="bg-white border-2 border-slate-300 shadow-xl rounded-full p-1.5 hover:bg-slate-500 hover:text-white text-slate-400 transition-all hover:scale-110 active:scale-90"
            title="Hide Parents"
          >
            <Minus size={14} strokeWidth={4} />
          </button>
      </div>

      {/* KOTAK UTAMA */}
      <div 
        onClick={(e) => { e.stopPropagation(); data.onToggleExpand(data.Harmony_ID); }}
        className={`
          bg-white border-2 border-slate-100 shadow-xl rounded-2xl overflow-hidden 
          transition-all duration-500 ease-in-out cursor-pointer
          ${data.isExpanded ? 'w-[320px]' : 'w-[240px]'}
          hover:border-red-500 hover:ring-4 hover:ring-red-500/20 hover:z-50
        `}
      >
        <Handle type="target" position={Position.Left} className="opacity-0" />
        
        <div className={`text-[8px] font-black px-4 py-1.5 uppercase tracking-widest text-white ${headerColor}`}>
          {isRaw ? "RAW MATERIAL" : isFinal ? "FINAL PRODUCT" : "INTERMEDIATE PRODUCT"}
        </div>
        
        <div className="p-5">
          <h4 className="text-[11px] font-black text-slate-800 uppercase leading-tight mb-2 tracking-tighter truncate">
            {data.Product_Name}
          </h4>
          
          <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg w-fit font-mono border border-slate-100">
                  HS {data.Harmony_ID?.split('_')[0]}
              </p>
              <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 w-fit">
                  <Zap size={10} className="text-indigo-600 fill-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-700">{Number(data.Origin_Score_Value).toFixed(2)}</span>
              </div>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ${data.isExpanded ? 'max-h-[300px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pt-4 border-t border-slate-100 space-y-3 font-sans">
                  <div className="flex items-center gap-2 text-slate-400">
                      <Layers size={12} />
                      <p className="text-[9px] font-bold uppercase tracking-wider">{data.Tier}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                          <p className="text-[7px] font-black text-emerald-600 uppercase">Ekspor</p>
                          <p className="text-[10px] font-black text-emerald-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">${Number(data.Downstream_Export).toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded-xl border border-red-100 text-center">
                          <p className="text-[7px] font-black text-red-600 uppercase">Impor</p>
                          <p className="text-[10px] font-black text-red-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">${Number(data.Downstream_Import).toLocaleString()}</p>
                      </div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl shadow-inner text-center">
                      <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Process Log</p>
                      <p className="text-[9px] font-medium text-white leading-tight italic truncate">"{data.Process_Name}"</p>
                  </div>
              </div>
          </div>
        </div>

        <Handle type="source" position={Position.Right} className="opacity-0" />
      </div>

      {/* TOMBOL KANAN: EXPAND/HIDE CHILDREN (HILIR) */}
      <div className="absolute right-[-25px] top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[100]">
          <button 
            onClick={(e) => { e.stopPropagation(); data.onExpandChildren(data.Harmony_ID); }}
            className="bg-white border-2 border-emerald-500 shadow-xl rounded-full p-1.5 hover:bg-emerald-500 hover:text-white text-emerald-500 transition-all hover:scale-125 active:scale-90"
            title="Expand Children"
          >
            <Plus size={14} strokeWidth={4} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); data.onHideChildren(data.Harmony_ID); }}
            className="bg-white border-2 border-slate-300 shadow-xl rounded-full p-1.5 hover:bg-slate-500 hover:text-white text-slate-400 transition-all hover:scale-125 active:scale-90"
            title="Hide Children"
          >
            <Minus size={14} strokeWidth={4} />
          </button>
      </div>
    </div>
  );
};

export default memo(IndustrialNode);