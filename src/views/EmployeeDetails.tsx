import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EmployeeDetailsProps {
  employeeId: string;
  onBack: () => void;
  onViewBinder?: () => void;
}

export function EmployeeDetails({ employeeId, onBack, onViewBinder }: EmployeeDetailsProps) {
  const [activeTab, setActiveTab] = useState('EPIs');
  const [employee, setEmployee] = useState<any>(null);
  const [cargo, setCargo] = useState<any>(null);
  const [assignedEpis, setAssignedEpis] = useState<any[]>([]);
  const [entregasHistory, setEntregasHistory] = useState<any[]>([]);
  const [obra, setObra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch employee
        const empRef = doc(db, 'funcionarios', employeeId);
        const empSnap = await getDoc(empRef);
        
        if (empSnap.exists()) {
          const empData = { id: empSnap.id, ...empSnap.data() } as any;
          setEmployee(empData);
          
          // Fetch cargo
          if (empData.cargoId) {
            const cargoRef = doc(db, 'cargos', empData.cargoId);
            const cargoSnap = await getDoc(cargoRef);
            if (cargoSnap.exists()) {
              setCargo({ id: cargoSnap.id, ...cargoSnap.data() });
            }
          }
          
          // Fetch obra
          if (empData.obraId) {
            const obraRef = doc(db, 'obras', empData.obraId);
            const obraSnap = await getDoc(obraRef);
            if (obraSnap.exists()) {
              setObra({ id: obraSnap.id, ...obraSnap.data() });
            }
          }

          // Fetch entregas for this employee
          const entregasQ = query(collection(db, 'entregas'), where('funcionarioId', '==', employeeId));
          const entregasSnap = await getDocs(entregasQ);
          const entregasData = entregasSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          
          setEntregasHistory(entregasData.sort((a, b) => b.createdAt - a.createdAt));

          const episList = entregasData
            .filter(entrega => !entrega.dataDevolucao)
            .map(entrega => ({
              id: entrega.id,
              name: entrega.codigoEpi || 'EPI',
              ca: entrega.ca || 'N/A',
              delivery: entrega.dataEntrega || 'Desconhecida',
              valid: 'Consultar validade',
              status: 'valid',
              adminResponsavelNome: entrega.adminResponsavelNome || 'N/A'
            }));
          
          setAssignedEpis(episList);
        }
      } catch (err) {
        console.error("Error fetching employee details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50 h-full">
        <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
          <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
          <h1 className="text-xl font-bold">Detalhes do Funcionário</h1>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
           <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50 h-full">
        <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
          <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
          <h1 className="text-xl font-bold">Detalhes do Funcionário</h1>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
           <p>Funcionário não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <h1 className="text-xl md:text-2xl font-bold">Detalhes do Funcionário</h1>
        <div className="w-8 -mr-2"></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full border-x border-gray-100 bg-white">
        {/* Profile Info */}
        <div className="bg-white p-6 md:p-8 shrink-0 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5 md:gap-6">
            {employee.fotoUrl ? (
                <img src={employee.fotoUrl} alt={employee.nome} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
            ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center text-3xl border-4 border-gray-50 shadow-sm">
                    👤
                </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{employee.nome}</h2>
              <div className="flex items-center gap-3">
                <p className="text-sm md:text-base text-gray-500 font-medium">Matrícula: {employee.matricula || 'N/A'}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <p className="text-sm md:text-base text-gray-500 font-medium">{cargo?.titulo || 'S/ Cargo'}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-3 self-start sm:self-center">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold border inline-block text-center",
              (employee.status || 'Ativo') === 'Ativo' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
            )}>
              Status: {employee.status || 'Ativo'}
            </span>
            {onViewBinder && (
              <button onClick={onViewBinder} className="text-[#0B5C36] bg-green-50 hover:bg-green-100 px-4 py-2 font-semibold text-sm rounded-xl border border-green-200 transition-colors whitespace-nowrap">
                Visualizar Fichário
              </button>
            )}
          </div>
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
                <span className="text-sm text-gray-500 font-medium">{assignedEpis.length} itens</span>
              </div>
              <div className="space-y-4">
                {assignedEpis.map((epi, idx) => (
                  <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-50 flex items-center justify-center p-2 shrink-0 border border-gray-100">
                         <span className="text-3xl md:text-4xl">🧰</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-base md:text-lg mb-1" style={{ wordBreak: 'break-word' }}>{epi.name}</h4>
                        <p className="text-sm text-gray-500 font-medium">CA: {epi.ca}</p>
                        <p className="text-xs text-gray-400 mt-1">Por: {epi.adminResponsavelNome}</p>
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

                {assignedEpis.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                        <span className="text-4xl">🤷‍♂️</span>
                        <p className="text-gray-500 mt-4">Nenhum EPI registrado para este funcionário.</p>
                    </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Dados' && (
            <div className="max-w-3xl mx-auto w-full bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>   
                    <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Informações Profissionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Nome Completo</p>
                            <p className="font-semibold text-gray-800">{employee.nome}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Matrícula</p>
                            <p className="font-semibold text-gray-800">{employee.matricula || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Cargo</p>
                            <p className="font-semibold text-gray-800">{cargo?.titulo || 'S/ Cargo'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Obra / Alocação</p>
                            <p className="font-semibold text-gray-800">{obra?.nome || 'Não alocado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <p className="font-semibold text-green-600 font-medium">{employee.status || 'Ativo'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Data de Cadastro</p>
                            <p className="font-semibold text-gray-800">
                                {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'Histórico' && (
              <div className="max-w-3xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl">Histórico de Movimentações</h3>
                    <span className="text-sm text-gray-500 font-medium">{entregasHistory.length} registros</span>
                  </div>
                  
                  <div className="space-y-4">
                      {entregasHistory.length > 0 ? (
                          entregasHistory.map(entrega => (
                            <div key={entrega.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{entrega.codigoEpi}</h4>
                                        <p className="text-sm text-gray-500">CA: {entrega.ca || 'N/A'} • Qtd: {entrega.quantidade || 1}</p>
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold",
                                        entrega.dataDevolucao ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
                                    )}>
                                        {entrega.dataDevolucao ? 'Devolvido' : 'Em uso'}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Entrega</p>
                                        <p className="text-sm text-gray-700 font-medium">
                                            {new Date(entrega.dataEntrega).toLocaleDateString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">Por: {entrega.adminResponsavelNome || 'N/A'}</p>
                                        {entrega.observacoes && (
                                            <p className="text-xs text-gray-500 mt-1 italic">Obs: {entrega.observacoes}</p>
                                        )}
                                    </div>
                                    {entrega.dataDevolucao && (
                                        <div>
                                            <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Devolução</p>
                                            <p className="text-sm text-gray-700 font-medium">
                                                {new Date(entrega.dataDevolucao).toLocaleDateString('pt-BR')}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">Por: {entrega.adminResponsavelNomeDevolucao || 'N/A'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Motivo: {entrega.motivoDevolucao}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                          ))
                      ) : (
                          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                              <span className="text-4xl text-gray-300">📋</span>
                              <p className="text-gray-500 mt-4">Nenhum histórico encontrado para este funcionário.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
