import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntregas: 0,
    entregasAnterior: 0,
    aVencer: 0,
    vencidos: 0,
  });

  const [deliveryData, setDeliveryData] = useState<any[]>([{ value: 0 }]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const entregasSnap = await getDocs(query(collection(db, 'entregas'), orderBy('createdAt', 'asc')));
        const episSnap = await getDocs(collection(db, 'epis'));
        const alertasSnap = await getDocs(collection(db, 'alertas'));
        
        const epis = episSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const entregas = entregasSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const alertas = alertasSnap.docs.map(d => ({ id: d.id, ...d.data() as any })).filter((a: any) => !a.resolvido);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let totalCurrent = 0;
        let totalPrev = 0;
        
        // Group by day for the line chart (last 7 days logic)
        const last7DaysMap = new Map();
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7DaysMap.set(d.toISOString().split('T')[0], 0);
        }

        const categoryCounts: Record<string, number> = {};

        entregas.forEach(entrega => {
            const date = new Date(entrega.dataEntrega || entrega.createdAt);
            const m = date.getMonth();
            const y = date.getFullYear();

            // Count for current vs previous month
            if (m === currentMonth && y === currentYear) totalCurrent++;
            if (m === prevMonth && y === prevYear) totalPrev++;

            // Chart data
            const dateStr = date.toISOString().split('T')[0];
            if (last7DaysMap.has(dateStr)) {
                last7DaysMap.set(dateStr, last7DaysMap.get(dateStr) + 1);
            }

            // Pie data
            const epi = epis.find(e => e.nome === entrega.codigoEpi);
            const cat = epi?.categoria || 'Outros';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Format chart delivery data
        const newDeliveryData = Array.from(last7DaysMap.values()).map(val => ({ value: val }));
        
        // Format pie data
        const colors = ['#3B82F6', '#F59E0B', '#10B981', '#0B5C36', '#8B5CF6', '#EF4444', '#64748B'];
        const totalCat = Object.values(categoryCounts).reduce((a,b)=>a+b, 0);
        const newPieData = Object.entries(categoryCounts).map(([name, count], index) => ({
            name,
            value: totalCat > 0 ? Math.round((count / totalCat) * 100) : 0,
            originalValue: count,
            color: colors[index % colors.length]
        })).sort((a, b) => b.value - a.value);

        setStats({
            totalEntregas: totalCurrent,
            entregasAnterior: totalPrev,
            vencidos: alertas.filter((a: any) => a.tipo === 'error').length,
            aVencer: alertas.filter((a: any) => a.tipo === 'warning').length,
        });
        
        setDeliveryData(newDeliveryData.length > 0 ? newDeliveryData : [{value: 0}]);
        setPieData(newPieData);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const expiringData = [
    { value: Math.max(0, stats.aVencer - 2) }, { value: Math.max(0, stats.aVencer - 1) }, { value: Math.max(0, stats.aVencer) }, { value: stats.aVencer }, { value: stats.aVencer }, { value: stats.aVencer }, { value: stats.aVencer }
  ];

  const expiredData = [
    { value: Math.max(0, stats.vencidos - 2) }, { value: Math.max(0, stats.vencidos - 1) }, { value: Math.max(0, stats.vencidos) }, { value: stats.vencidos }, { value: stats.vencidos }, { value: stats.vencidos }, { value: stats.vencidos }
  ];

  const deliveryDiff = stats.entregasAnterior === 0 
      ? (stats.totalEntregas > 0 ? '+100%' : '0%') 
      : `${stats.totalEntregas >= stats.entregasAnterior ? '+' : ''}${Math.round(((stats.totalEntregas - stats.entregasAnterior) / stats.entregasAnterior) * 100)}%`;

  const deliveryTrendClass = (stats.totalEntregas >= stats.entregasAnterior || stats.entregasAnterior === 0) ? 'text-green-500' : 'text-red-500';

  if (loading) {
     return (
        <div className="flex flex-col flex-1 bg-gray-50 h-full">
            <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
                <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
                <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}><ChevronLeft size={24} /></div>
                <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
                <span className="text-sm md:text-base border-b border-white border-opacity-50 pb-0.5">Este mês</span>
            </div>
            <div className="flex-1 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
     );
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}><ChevronLeft size={24} /></div>
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <span className="text-sm md:text-base border-b border-white border-opacity-50 pb-0.5">Este mês</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50 pb-safe pb-24">
        <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-6">
          {/* Main Stat */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-12 md:items-center">
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-medium text-gray-500 mb-2">Entregas Este Mês</h3>
              <p className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">{stats.totalEntregas}</p>
              <p className="text-sm text-gray-500"><span className={cn("font-medium", deliveryTrendClass)}>{deliveryDiff}</span> em relação ao mês anterior</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm md:text-base font-medium text-gray-500 mb-2">EPIs a vencer</h3>
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{stats.aVencer}</p>
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
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{stats.vencidos}</p>
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
                     <span className="text-3xl font-bold text-gray-800">
                        {pieData.reduce((acc, curr) => acc + curr.originalValue, 0)}
                     </span>
                     <span className="text-sm text-gray-500">Total</span>
                   </div>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData.length > 0 ? pieData : [{name: 'Vazio', value: 100, color: '#E2E8F0'}]}
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={2}
                         dataKey="value"
                         stroke="none"
                       >
                         {pieData.length > 0 ? pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         )) : <Cell fill="#E2E8F0" />}
                       </Pie>
                     </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-3">
                  {pieData.length > 0 ? pieData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{item.value}%</span>
                    </div>
                  )) : (
                     <p className="text-gray-500 text-sm text-center">Nenhuma entrega registrada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

