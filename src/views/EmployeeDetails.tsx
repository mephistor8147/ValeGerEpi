import React, { useState } from 'react';
import { ChevronLeft, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmployeeDetailsProps {
  onBack: () => void;
}

export function EmployeeDetails({ onBack }: EmployeeDetailsProps) {
  const [activeTab, setActiveTab] = useState('EPIs');

  const epis = [
    { name: 'Capacete', ca: '12345', delivery: '10/05/2024', valid: '10/05/2025', image: 'https://images.unsplash.com/photo-1588665426177-3e6f9661b11b?w=150&q=80&fit=crop', status: 'valid' },
    { name: 'Óculos de Segurança', ca: '54321', delivery: '10/05/2024', valid: '10/05/2025', image: 'https://images.unsplash.com/photo-1580130281320-0ef0754f2bf7?w=150&q=80&fit=crop', status: 'valid' },
    { name: 'Protetor Auricular', ca: '11223', delivery: '10/05/2024', valid: '10/05/2025', image: 'https://images.unsplash.com/photo-1628003195861-12502c34ced0?w=150&q=80&fit=crop', status: 'valid' },
    { name: 'Luva de Raspa', ca: '33445', delivery: '10/05/2024', valid: '10/05/2025', image: 'https://images.unsplash.com/photo-1631024345244-a169b2d3bf30?w=150&q=80&fit=crop', status: 'valid' },
    { name: 'Bota de Segurança', ca: '66778', delivery: '10/05/2024', valid: '10/05/2025', image: 'https://images.unsplash.com/photo-1605300539167-9d628460afce?w=150&q=80&fit=crop', status: 'valid' },
  ];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <h1 className="text-xl md:text-2xl font-bold">Detalhes do Funcionário</h1>
        <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors"><Edit2 size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full border-x border-gray-100 bg-white">
        {/* Profile Info */}
        <div className="bg-white p-6 md:p-8 shrink-0 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5 md:gap-6">
            <img src="https://i.pravatar.cc/150?u=1" alt="Carlos Alberto" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Carlos Alberto</h2>
              <div className="flex items-center gap-3">
                <p className="text-sm md:text-base text-gray-500 font-medium">ID: 0001</p>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <p className="text-sm md:text-base text-gray-500 font-medium">Pedreiro</p>
              </div>
            </div>
          </div>
          <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold self-start sm:self-center border border-green-100">Status: Ativo</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-white shrink-0 border-b border-gray-100 px-4 md:px-8 overflow-x-auto scrollbar-hide">
          {['Dados', 'EPIs', 'Histórico'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-sm md:text-base font-semibold border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab 
                  ? "text-[#0B5C36] border-[#0B5C36]" 
                  : "text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50">
          {activeTab === 'EPIs' && (
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg md:text-xl">EPIs em uso</h3>
                <span className="text-sm text-gray-500 font-medium">{epis.length} itens</span>
              </div>
              <div className="space-y-4">
                {epis.map((epi, idx) => (
                  <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-50 flex items-center justify-center p-2 shrink-0 border border-gray-100">
                         {/* Placeholder for specific PPE icon/image, using emoji for now */}
                         <span className="text-3xl md:text-4xl">🧰</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-base md:text-lg truncate mb-1">{epi.name}</h4>
                        <p className="text-sm text-gray-500 font-medium">CA: {epi.ca}</p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-6 sm:gap-2 justify-between items-start sm:items-end mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-50">
                      <div className="sm:text-right">
                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Data de Entrega</p>
                        <p className="text-sm text-gray-700 font-medium">{epi.delivery}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Vencimento</p>
                        <p className="text-sm text-green-600 font-bold">{epi.valid}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
