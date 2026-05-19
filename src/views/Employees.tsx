import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface EmployeesProps {
  onBack: () => void;
  onSelectEmployee: (id: string) => void;
}

interface Employee {
  id: string;
  matricula: string;
  nome: string;
  cargoId: string;
  fotoUrl?: string;
  status?: string;
}

export function Employees({ onBack, onSelectEmployee }: EmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cargos, setCargos] = useState<{ id: string, titulo: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');

  useEffect(() => {
    const unsubEmp = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'funcionarios'));

    const unsubCargos = onSnapshot(collection(db, 'cargos'), (snapshot) => {
      const cargosMap: { [key: string]: string } = {};
      snapshot.docs.forEach(doc => {
        cargosMap[doc.id] = doc.data().titulo;
      });
      setCargos(cargosMap as any);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cargos'));

    return () => {
      unsubEmp();
      unsubCargos();
    };
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase();
    const cargoTitle = cargos[emp.cargoId as keyof typeof cargos] || '';
    const matchesSearch = emp.nome?.toLowerCase().includes(searchLower) ||
           emp.matricula?.toLowerCase().includes(searchLower) ||
           cargoTitle.toLowerCase().includes(searchLower);
           
    const empStatus = emp.status || 'Ativo';
    
    if (filterType === 'Ativos' && empStatus !== 'Ativo') return false;
    if (filterType === 'Inativos' && empStatus !== 'Inativo') return false;
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}><ChevronLeft size={24} className="hover:text-gray-200 transition-colors" /></div>
        <h1 className="text-xl md:text-2xl font-bold">Funcionários</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 md:p-8 flex flex-col flex-1 overflow-hidden max-w-5xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-6 shrink-0">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar funcionário..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-14 pr-4 text-base shadow-sm focus:ring-2 focus:ring-[#0B5C36] outline-none transition-shadow hover:shadow-md"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-6 shrink-0 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilterType('Todos')} 
            className={cn("px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-colors", filterType === 'Todos' ? "bg-[#0B5C36] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
          >Todos</button>
          <button 
            onClick={() => setFilterType('Ativos')} 
            className={cn("px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-colors", filterType === 'Ativos' ? "bg-[#0B5C36] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
          >Ativos</button>
          <button 
            onClick={() => setFilterType('Inativos')}
            className={cn("px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-colors", filterType === 'Inativos' ? "bg-[#0B5C36] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
          >Inativos</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pb-safe pb-8 pr-2">
          {filteredEmployees.map((emp) => (
            <button 
              key={emp.id} 
              onClick={() => onSelectEmployee(emp.id)}
              className="w-full bg-white p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-between border border-gray-100 transition-all hover:border-[#0B5C36]/30 group text-left"
            >
              <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gray-50 rounded-full border-2 border-gray-100 group-hover:border-green-200 transition-colors overflow-hidden shrink-0">
                  {emp.fotoUrl ? (
                    <img src={emp.fotoUrl} alt={emp.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-gray-800 md:text-lg truncate">{emp.nome}</h3>
                  <p className="text-sm text-gray-500 mb-0.5 truncate">{cargos[emp.cargoId as keyof typeof cargos] || 'S/ Cargo'}</p>
                  <p className="text-xs md:text-sm text-gray-400 font-medium">Matrícula: {emp.matricula}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <span className={cn(
                  "px-3 py-1 md:py-1.5 md:px-4 rounded-full text-xs md:text-sm font-semibold",
                  (emp.status || 'Ativo') === 'Ativo' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {emp.status || 'Ativo'}
                </span>
                <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0B5C36] transition-colors shrink-0 hidden sm:block" />
              </div>
            </button>
          ))}
          
          {filteredEmployees.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              Nenhum funcionário encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
