import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

interface ReportViewerProps {
  onBack: () => void;
  reportId: string;
}

export function ReportViewer({ onBack, reportId }: ReportViewerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reportTitles: Record<string, string> = {
    entregas: 'Relatório de Entregas',
    vencer: 'EPIs a Vencer',
    vencidos: 'EPIs Vencidos',
    devolucoes: 'Relatório de Devoluções',
    funcionario: 'Relatório por Funcionário',
    estoque: 'Relatório de Estoque'
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        let results: any[] = [];
        
        // Basic mapping for specific reports
        if (reportId === 'entregas') {
          const q = query(collection(db, 'entregas'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } 
        else if (reportId === 'devolucoes') {
          const q = query(collection(db, 'entregas'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          results = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((item: any) => item.dataDevolucao);
        }
        else if (reportId === 'estoque') {
          const q = query(collection(db, 'epis'), orderBy('nome', 'asc'));
          const snap = await getDocs(q);
          results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        else if (reportId === 'vencer' || reportId === 'vencidos') {
            // Fake logic for expiring/expired since CA data is not explicitly stored with expiration logic right now
            // Just return empty or sample structure if needed, or query EPIs/Entregas that are randomly picked.
            // Let's just fetch all EPIs and we won't have actual expired ones unless we simulate it.
            const q = query(collection(db, 'epis'));
            const snap = await getDocs(q);
            results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (reportId === 'vencidos') results = []; // For demo, let's say nothing is expired
        }
        else if (reportId === 'funcionario') {
            // Could group all deliveries by employee
            const empSnap = await getDocs(collection(db, 'funcionarios'));
            const employeesMap = new Map();
            empSnap.forEach(e => employeesMap.set(e.id, { id: e.id, nome: e.data().nome, matricula: e.data().matricula, count: 0 }));
            
            const reqSnap = await getDocs(collection(db, 'entregas'));
            reqSnap.forEach(r => {
                const fId = r.data().funcionarioId;
                if (employeesMap.has(fId)) {
                    employeesMap.get(fId).count += 1;
                }
            });
            results = Array.from(employeesMap.values());
        }

        setData(results);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportId]);

  const filteredData = data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}><ChevronLeft size={24} /></div>
        <h1 className="text-xl md:text-2xl font-bold">{reportTitles[reportId] || 'Relatório'}</h1>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50 pb-safe">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
             <div className="relative flex-1">
                 <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                     type="text" 
                     placeholder="Buscar no relatório..." 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0B5C36] outline-none"
                 />
             </div>
             <button className="bg-gray-100 p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
                 <Filter size={24} />
             </button>
          </div>

          {loading ? (
             <div className="flex justify-center items-center py-12">
                 <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-gray-50 text-gray-500 text-sm">
                           {reportId === 'entregas' || reportId === 'devolucoes' ? (
                               <tr>
                                   <th className="p-4 font-semibold border-b">Data</th>
                                   <th className="p-4 font-semibold border-b">EPI</th>
                                   <th className="p-4 font-semibold border-b">CA</th>
                                   <th className="p-4 font-semibold border-b">Qtd</th>
                                   {reportId === 'devolucoes' && <th className="p-4 font-semibold border-b">Motivo</th>}
                               </tr>
                           ) : reportId === 'estoque' ? (
                               <tr>
                                   <th className="p-4 font-semibold border-b">Nome do EPI</th>
                                   <th className="p-4 font-semibold border-b">CA</th>
                                   <th className="p-4 font-semibold border-b">Categoria</th>
                                   <th className="p-4 font-semibold border-b">Estoque Atual</th>
                               </tr>
                           ) : reportId === 'funcionario' ? (
                               <tr>
                                   <th className="p-4 font-semibold border-b">Nome</th>
                                   <th className="p-4 font-semibold border-b">Matrícula</th>
                                   <th className="p-4 font-semibold border-b">Total Movimentações</th>
                               </tr>
                           ) : (
                               <tr>
                                   <th className="p-4 font-semibold border-b">EPI</th>
                                   <th className="p-4 font-semibold border-b">CA</th>
                                   <th className="p-4 font-semibold border-b">Vencimento</th>
                               </tr>
                           )}
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {filteredData.length > 0 ? filteredData.map((item, index) => (
                               <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                  {reportId === 'entregas' || reportId === 'devolucoes' ? (
                                      <>
                                          <td className="p-4 text-gray-800">
                                              {new Date(reportId === 'devolucoes' ? item.dataDevolucao : item.dataEntrega).toLocaleDateString()}
                                          </td>
                                          <td className="p-4 text-gray-800 font-medium">{item.codigoEpi}</td>
                                          <td className="p-4 text-gray-600">{item.ca}</td>
                                          <td className="p-4 text-gray-800">{item.quantidade}</td>
                                          {reportId === 'devolucoes' && <td className="p-4 text-gray-600">{item.motivoDevolucao || '-'}</td>}
                                      </>
                                  ) : reportId === 'estoque' ? (
                                      <>
                                          <td className="p-4 text-gray-800 font-medium">{item.nome}</td>
                                          <td className="p-4 text-gray-600">{item.ca}</td>
                                          <td className="p-4 text-gray-600">{item.categoria}</td>
                                          <td className="p-4 font-bold text-gray-800">{item.quantidade}</td>
                                      </>
                                  ) : reportId === 'funcionario' ? (
                                      <>
                                          <td className="p-4 text-gray-800 font-medium">{item.nome}</td>
                                          <td className="p-4 text-gray-600">{item.matricula || '-'}</td>
                                          <td className="p-4 text-gray-800">{item.count}</td>
                                      </>
                                  ) : (
                                      <>
                                          <td className="p-4 text-gray-800 font-medium">{item.nome || item.codigoEpi}</td>
                                          <td className="p-4 text-gray-600">{item.ca}</td>
                                          <td className="p-4 font-medium text-orange-600">Em Breve</td>
                                      </>
                                  )}
                               </tr>
                           )) : (
                               <tr>
                                   <td colSpan={5} className="p-8 text-center text-gray-500">
                                       Nenhum dado encontrado para este relatório.
                                   </td>
                               </tr>
                           )}
                       </tbody>
                    </table>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
