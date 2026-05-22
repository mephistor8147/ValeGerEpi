import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Search, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

interface ReturnProps {
  onBack: () => void;
  adminUser?: any;
}

export function Return({ onBack, adminUser }: ReturnProps) {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Step 1 State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Step 2 State
  const [employeeEntregas, setEmployeeEntregas] = useState<any[]>([]);
  const [selectedEntregas, setSelectedEntregas] = useState<string[]>([]);
  const [loadingEpis, setLoadingEpis] = useState(false);
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const empSnap = await getDocs(collection(db, 'funcionarios'));
        setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleNext = async () => {
    if (step === 1 && selectedEmployeeId) {
        // Fetch active entregas for this employee
        setLoadingEpis(true);
        try {
            const entregasQ = query(collection(db, 'entregas'), where('funcionarioId', '==', selectedEmployeeId));
            const snap = await getDocs(entregasQ);
            // Filter locally those without dataDevolucao to show only pending
            const activeEntregas = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((d: any) => !d.dataDevolucao);
            setEmployeeEntregas(activeEntregas);
        } catch (err) {
            console.error("Error fetching entregas", err);
        } finally {
            setLoadingEpis(false);
        }
        setStep(2);
    } else if (step === 2 && selectedEntregas.length > 0) {
        setStep(3);
    }
  };
  
  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const toggleEntregaSelection = (entregaId: string) => {
    setSelectedEntregas(prev => 
      prev.includes(entregaId) 
        ? prev.filter(id => id !== entregaId)
        : [...prev, entregaId]
    );
  };
  
  const handleSubmit = async () => {
    if (selectedEntregas.length === 0) {
      setSubmitError('Selecione pelo menos um EPI para devolução.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // For each selected entrega, update with return info
      for (const entregaId of selectedEntregas) {
        const entregaRef = doc(db, 'entregas', entregaId);
        await updateDoc(entregaRef, {
            dataDevolucao: returnDate,
            motivoDevolucao: reason,
            observacoesDevolucao: notes,
            updatedAt: Date.now(),
            adminResponsavelIdDevolucao: adminUser?.id || null,
            adminResponsavelNomeDevolucao: adminUser?.nomeFuncionario || 'Desconhecido',
        });
        
        // Optionally, if the reason is not "Danificado", increment stock back?
        // Let's increment stock back unless it's damaged or natural wear?
        // Actually, for simplicity we might just not manage stock on returns unless specifically asked, 
        // but if we want to:
        // We don't have the Epi ID directly inside `entregas`, just the `codigoEpi` (nome). 
        // We'd have to find it by name. We'll skip stock increment to avoid bugs with name mismatches, 
        // as typically returned EPIs are discarded or sent to maintenance.
      }
      onBack(); // Go back after success
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError('Erro ao registrar devolução.');
      handleFirestoreError(err, OperationType.UPDATE, 'entregas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={step === 1 ? onBack : handlePrev} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer hover:bg-white/10 rounded-full transition-colors" onClick={step === 1 ? onBack : handlePrev}>
            <ChevronLeft size={24} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold">Devolução de EPI</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        {/* Stepper */}
        <div className="bg-white px-6 md:px-12 py-8 border-b border-gray-200 shrink-0 shadow-sm md:rounded-b-3xl">
          <div className="flex justify-between relative max-w-lg mx-auto w-full">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-200 -z-10"></div>
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold text-white shadow-md ring-4", step >= 1 ? "bg-[#0B5C36] ring-green-50" : "bg-gray-300 ring-transparent")}>
                1
              </div>
              <span className={cn("text-xs md:text-sm font-bold", step >= 1 ? "text-[#0B5C36]" : "text-gray-400")}>Funcionário</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-colors shadow-md ring-4", step >= 2 ? "bg-[#0B5C36] text-white ring-green-50" : "bg-white border-2 border-gray-200 text-gray-400 ring-transparent")}>
                2
              </div>
              <span className={cn("text-xs md:text-sm font-bold transition-colors", step >= 2 ? "text-[#0B5C36]" : "text-gray-400")}>EPIs Pendentes</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-colors shadow-md ring-4", step >= 3 ? "bg-[#0B5C36] text-white ring-green-50" : "bg-white border-2 border-gray-200 text-gray-400 ring-transparent")}>
                3
              </div>
              <span className={cn("text-xs md:text-sm font-bold transition-colors", step >= 3 ? "text-[#0B5C36]" : "text-gray-400")}>Resumo</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-safe items-center flex flex-col">
          {loading ? (
             <div className="flex-1 flex justify-center items-center">
                 <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="w-full max-w-4xl">
              
              {/* --- STEP 1 --- */}
              {step === 1 && (
                <div className="max-w-lg mx-auto">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 mt-4">Selecionar Funcionário para Devolução</h2>
                    
                    <div className="space-y-6">
                    <div className="space-y-2.5">
                        <label className="text-sm md:text-base font-semibold text-gray-700">Selecione o funcionário</label>
                        <select 
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base md:text-lg text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent cursor-pointer"
                        >
                        <option value="" disabled>Clique para selecionar</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nome} - Matrícula: {emp.matricula || 'N/A'}</option>
                        ))}
                        </select>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm md:text-base font-semibold text-gray-700">Data da devolução</label>
                        <div className="relative">
                        <input 
                            type="date" 
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base md:text-lg text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent appearance-none" 
                        />
                        <Calendar size={24} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm md:text-base font-semibold text-gray-700">Motivo da devolução</label>
                        <select 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base md:text-lg text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Selecione o motivo</option>
                            <option value="Desgaste natural">Desgaste natural</option>
                            <option value="Danificado">Danificado</option>
                            <option value="Desligamento">Desligamento</option>
                            <option value="Troca">Troca</option>
                        </select>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm md:text-base font-semibold text-gray-700">Observações (opcional)</label>
                        <textarea 
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Digite uma observação..." 
                        className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent resize-none"
                        ></textarea>
                    </div>
                    </div>

                    <button 
                    onClick={handleNext}
                    disabled={!selectedEmployeeId || !reason}
                    className="w-full bg-[#0B5C36] text-white font-bold text-lg rounded-2xl py-4 md:py-5 mt-10 shadow-lg hover:bg-[#094d2d] transition-all disabled:opacity-50"
                    >
                    Avançar para Seleção de EPIs
                    </button>
                </div>
              )}

              {/* --- STEP 2 --- */}
              {step === 2 && (
                <div className="w-full max-w-2xl mx-auto">
                   <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                       <h2 className="text-xl md:text-2xl font-bold text-gray-800">EPIs pendentes de devolução</h2>
                   </div>

                   <div className="space-y-4">
                       {loadingEpis ? (
                           <div className="flex justify-center items-center py-12">
                               <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
                           </div>
                       ) : employeeEntregas.length > 0 ? (
                           employeeEntregas.map(entrega => {
                               const isSelected = selectedEntregas.includes(entrega.id);
                               return (
                                  <div 
                                      key={entrega.id} 
                                      onClick={() => toggleEntregaSelection(entrega.id)}
                                      className={cn(
                                          "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all gap-4",
                                          isSelected ? "border-[#0B5C36] bg-green-50 shadow-sm" : "border-gray-100 bg-white hover:border-[#0B5C36]/30"
                                      )}
                                  >
                                      <div className={cn("w-6 h-6 rounded border flex items-center justify-center shrink-0", isSelected ? "border-[#0B5C36] bg-[#0B5C36] text-white" : "border-gray-300")}>
                                          {isSelected && <Check size={16} />}
                                      </div>
                                      <div className="flex-1">
                                          <p className="font-semibold text-gray-800 line-clamp-1">{entrega.codigoEpi}</p>
                                          <div className="flex justify-between items-center mt-1">
                                              <p className="text-xs text-gray-500">CA: {entrega.ca || 'N/A'}</p>
                                              <p className="text-xs text-gray-500">
                                                  Entregue em: {new Date(entrega.dataEntrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                               );
                           })
                       ) : (
                           <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
                               <p>Nenhum EPI pendente de devolução para este funcionário.</p>
                           </div>
                       )}
                   </div>

                   <div className="sticky bottom-4 mt-8 flex gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100">
                       <button onClick={handlePrev} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
                       <button 
                           onClick={handleNext} 
                           disabled={selectedEntregas.length === 0}
                           className="flex-1 bg-[#0B5C36] text-white font-bold py-4 rounded-xl hover:bg-[#094d2d] transition-colors disabled:opacity-50"
                       >
                           Revisar ({selectedEntregas.length})
                       </button>
                   </div>
                </div>
              )}

              {/* --- STEP 3 --- */}
              {step === 3 && (
                <div className="max-w-2xl mx-auto w-full">
                   <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-4">Resumo da Devolução</h2>

                   {submitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                            <AlertCircle size={20} />
                            <p>{submitError}</p>
                        </div>
                   )}

                   <div className="bg-white border text-left border-gray-200 rounded-2xl p-6 shadow-sm mb-6 space-y-6">
                       <div>
                           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dados da Devolução</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div>
                                   <p className="text-xs text-gray-500 mb-1">Funcionário</p>
                                   <p className="font-semibold text-gray-800">{selectedEmployee?.nome}</p>
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 mb-1">Matrícula</p>
                                   <p className="font-semibold text-gray-800">{selectedEmployee?.matricula || 'N/A'}</p>
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 mb-1">Data Devolução</p>
                                   <p className="font-semibold text-gray-800">
                                       {new Date(returnDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                   </p>
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 mb-1">Motivo</p>
                                   <p className="font-semibold text-gray-800">{reason}</p>
                               </div>
                           </div>
                           {notes && (
                               <div className="mt-4">
                                   <p className="text-xs text-gray-500 mb-1">Observações</p>
                                   <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{notes}</p>
                               </div>
                           )}
                       </div>

                       <div className="border-t border-gray-100 pt-6">
                           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">EPIs Devolvidos ({selectedEntregas.length})</h3>
                           <div className="space-y-3">
                               {selectedEntregas.map(entregaId => {
                                   const entrega = employeeEntregas.find(e => e.id === entregaId);
                                   return entrega ? (
                                       <div key={entrega.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                           <div>
                                               <p className="font-semibold text-gray-800">{entrega.codigoEpi}</p>
                                               <p className="text-xs text-gray-500">CA: {entrega.ca || 'N/A'} - Retirado em {new Date(entrega.dataEntrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                           </div>
                                           <div className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">Devolvido</div>
                                       </div>
                                   ) : null;
                               })}
                           </div>
                       </div>
                   </div>

                   <div className="flex gap-4">
                       <button 
                            onClick={handlePrev} 
                            disabled={isSubmitting}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                       >
                           Voltar
                       </button>
                       <button 
                           onClick={handleSubmit} 
                           disabled={isSubmitting}
                           className="flex-1 bg-[#0B5C36] text-white font-bold py-4 rounded-xl hover:bg-[#094d2d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                           {isSubmitting ? (
                               <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Salvando...
                               </>
                           ) : (
                               'Confirmar e Salvar'
                           )}
                       </button>
                   </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
