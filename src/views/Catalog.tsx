import React, { useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface CatalogProps {
  onBack: () => void;
}

export function Catalog({ onBack }: CatalogProps) {
  const [activeCategory, setActiveCategory] = useState('Todas as categorias');

  const categories = [
    'Todas as categorias',
    'Proteção da Cabeça',
    'Proteção Ocular',
    'Proteção Auditiva',
    'Proteção das Mãos',
    'Proteção dos Pés',
    'Proteção do Corpo',
    'Proteção Contra Quedas'
  ];

  const items = [
    { name: 'Capacete', ca: '12345', stock: 32 },
    { name: 'Óculos de Segurança', ca: '54321', stock: 18 },
    { name: 'Protetor Auricular', ca: '11223', stock: 27 },
    { name: 'Luva de Segurança', ca: '33445', stock: 45 },
    { name: 'Bota de Segurança', ca: '66778', stock: 15 },
  ];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center md:justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold flex-1 text-center md:flex-none">Catálogo de EPIs</h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden max-w-7xl mx-auto w-full border-x border-gray-100 bg-white">
        {/* Search */}
        <div className="p-4 md:p-6 shrink-0 bg-white border-b border-gray-100">
          <div className="relative max-w-lg mx-auto md:mx-0 w-full">
            <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar EPI..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 text-base focus:ring-2 focus:ring-[#0B5C36] outline-none transition-colors focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar Categories */}
          <div className="md:w-64 bg-gray-50 overflow-x-auto md:overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100 flex md:flex-col shrink-0 scrollbar-hide py-2 md:py-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-3 md:py-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap text-left border-b-2 md:border-b-0 md:border-l-4",
                  activeCategory === cat 
                    ? "text-[#0B5C36] border-[#0B5C36] bg-green-50/50" 
                    : "text-gray-500 border-transparent hover:bg-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List Items */}
          <div className="flex-1 bg-white overflow-y-auto p-4 md:p-8 pb-safe pb-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6 hidden md:block">{activeCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-row md:flex-col gap-4 items-center md:items-start border border-gray-100 md:border-gray-200 bg-white p-4 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 md:w-full md:h-48 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center p-2 shrink-0 border border-gray-100">
                    <span className="text-3xl md:text-6xl">🧰</span>
                  </div>
                  <div className="flex-1 w-full flex flex-col justify-center">
                    <h4 className="font-bold text-gray-800 text-base md:text-lg mb-1">{item.name}</h4>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 mt-1 md:mt-2">
                      <p className="text-sm text-gray-500 font-medium">CA: {item.ca}</p>
                      <p className={cn("text-xs md:text-sm font-bold px-2 py-1 rounded-md max-w-fit", item.stock > 20 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>Estoque: {item.stock}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
