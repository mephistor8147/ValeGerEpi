import React from 'react';
import { ChevronLeft, PackageCheck, Clock, AlertTriangle, PackageMinus, Users, FileBarChart, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportsProps {
  onBack: () => void;
  onNavigateDashboard: () => void;
}

export function Reports({ onBack, onNavigateDashboard }: ReportsProps) {
  const reports = [
    { id: '1', title: 'Relatório de Entregas', desc: 'Veja todas as entregas realizadas', icon: PackageCheck, color: 'text-green-600', bg: 'bg-green-100', route: 'dashboard' },
    { id: '2', title: 'EPIs a Vencer', desc: 'EPIs que vencem em breve', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: '3', title: 'EPIs Vencidos', desc: 'EPIs com validade expirada', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
    { id: '4', title: 'Relatório de Devoluções', desc: 'Veja todas as devoluções', icon: PackageMinus, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: '5', title: 'Relatório por Funcionário', desc: 'Histórico de EPIs por funcionário', icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: '6', title: 'Relatório de Estoque', desc: 'Estoque atual de EPIs', icon: FileBarChart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center md:justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold flex-1 text-center md:flex-none">Relatórios</h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50 pb-safe pb-24">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {reports.map((report) => (
              <button 
                key={report.id}
                onClick={report.route ? onNavigateDashboard : undefined}
                className="w-full bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md border border-gray-100 flex flex-col items-start gap-4 text-left transition-all hover:border-[#0B5C36]/20 group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", report.bg, report.color)}>
                    <report.icon size={28} />
                  </div>
                  <ChevronRight size={24} className="text-gray-300 group-hover:text-[#0B5C36] transition-colors" />
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-gray-800 text-lg md:text-xl mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-500 leading-snug">{report.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
