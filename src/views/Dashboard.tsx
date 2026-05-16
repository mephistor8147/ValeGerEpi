import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '../lib/utils';

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const deliveryData = [
    { value: 40 }, { value: 45 }, { value: 58 }, { value: 48 }, { value: 55 }, { value: 65 }, { value: 58 }
  ];

  const expiringData = [
    { value: 10 }, { value: 12 }, { value: 15 }, { value: 18 }, { value: 20 }, { value: 22 }, { value: 24 }
  ];

  const expiredData = [
    { value: 15 }, { value: 12 }, { value: 10 }, { value: 8 }, { value: 12 }, { value: 10 }, { value: 6 }
  ];

  const pieData = [
    { name: 'Cabeça', value: 20, color: '#3B82F6' },
    { name: 'Ocular', value: 15, color: '#F59E0B' },
    { name: 'Auditiva', value: 15, color: '#10B981' },
    { name: 'Mãos', value: 25, color: '#0B5C36' },
    { name: 'Pés', value: 15, color: '#8B5CF6' },
    { name: 'Corpo', value: 10, color: '#EF4444' },
  ];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <span className="text-sm md:text-base border-b border-white border-opacity-50 pb-0.5">Este mês</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50 pb-safe pb-24">
        <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-6">
          {/* Main Stat */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-12 md:items-center">
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-medium text-gray-500 mb-2">Entregas Totais</h3>
              <p className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">58</p>
              <p className="text-sm text-gray-500"><span className="text-green-500 font-medium">+12%</span> em relação ao mês anterior</p>
            </div>
            <div className="w-full md:w-[400px] h-24 md:h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deliveryData}>
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Small Stats Grid Container */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm md:text-base font-medium text-gray-500 mb-2">EPIs a vencer</h3>
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">24</p>
                <p className="text-sm text-amber-500 font-medium mb-4">+8%</p>
                <div className="h-12 md:h-16 mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expiringData}>
                      <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm md:text-base font-medium text-gray-500 mb-2">EPIs vencidos</h3>
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">6</p>
                <p className="text-sm text-red-500 font-medium mb-4">-20%</p>
                <div className="h-12 md:h-16 mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expiredData}>
                      <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Categories Pie */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-6">Entregas por categoria</h3>
              <div className="flex flex-col sm:flex-row items-center flex-1 justify-center gap-6">
                <div className="w-[160px] h-[160px] flex items-center justify-center relative shrink-0">
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-bold text-gray-800">58</span>
                     <span className="text-sm text-gray-500">Total</span>
                   </div>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={2}
                         dataKey="value"
                         stroke="none"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                     </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-3">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
