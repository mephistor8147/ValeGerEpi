import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Search, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

interface DeliveryProps {
  onBack: () => void;
  adminUser?: any;
}

export function Delivery({ onBack, adminUser }: DeliveryProps) {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<any[]>([]);
  const [epis, setEpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Step 1 State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  
  // Step 2 State
  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [searchEpi, setSearchEpi] = useState('');
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const empSnap = await getDocs(collection(db, 'funcionarios'));
        setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const epiSnap = await getDocs(collection(db, 'epis'));
        setEpis(epiSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleNext = () => {
    if (step === 1 && !selectedEmployeeId) return;
    if (step === 2 && selectedEpis.length === 0) return;
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const toggleEpiSelection = (epiId: string) => {
    setSelectedEpis(prev => 
      prev.includes(epiId) 
        ? prev.filter(id => id !== epiId)
        : [...prev, epiId]
    );
  };
  
  const handleSubmit = async () => {
    if (!selectedEmployeeId || selectedEpis.length === 0) {
      setSubmitError('Selecione um funcionário e pelo menos um EPI.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // For each selected EPI, create a delivery record and decrease stock
      for (const epiId of selectedEpis) {
        const epi = epis.find(e => e.id === epiId);
        if (epi) {
          await addDoc(collection(db, 'entregas'), {
            funcionarioId: selectedEmployeeId,
            codigoEpi: epi.nome,
            quantidade: 1, // Defaulting to 1
            ca: epi.ca || "N/A",
            dataEntrega: deliveryDate,
            observacoes: notes,
            createdAt: Date.now(),
            adminResponsavelId: adminUser?.id || null,
            adminResponsavelNome: adminUser?.nomeFuncionario || 'Desconhecido',
          });
          
          // Optionally, decrement amount
          const epiRef = doc(db, 'epis', epi.id);
          const currentEpi = await getDoc(epiRef);
          if (currentEpi.exists()) {
            const currentQuantity = currentEpi.data().quantidade || 0;
            if (currentQuantity > 0) {
                await updateDoc(epiRef, { quantidade: currentQuantity - 1 });
            }
          }
        }
      }
      onBack(); // Go back after success
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError('Erro ao salvar entrega.');
      handleFirestoreError(err, OperationType.CREATE, 'entregas');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group EPIs by Category
  const filteredEpis = epis.filter(epi => 
    epi.nome?.toLowerCase().includes(searchEpi.toLowerCase()) || 
    epi.ca?.toLowerCase().includes(searchEpi.toLowerCase())
  );
  
  const episByCategory = filteredEpis.reduce((acc, epi) => {
    const cat = epi.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(epi);
    return acc;
  }, {} as Record<string, (typeof epis)[0][]>);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={step === 1 ? onBack : handlePrev} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer hover:bg-white/10 rounded-full transition-colors" onClick={step === 1 ? onBack : handlePrev}>
            <ChevronLeft size={24} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold">Entrega de EPI</h1>
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
              <span className={cn("text-xs md:text-sm font-bold transition-colors", step >= 2 ? "text-[#0B5C36]" : "text-gray-400")}>EPIs</span>
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
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 mt-4">Selecionar Funcionário</h2>
                    
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
                        <label className="text-sm md:text-base font-semibold text-gray-700">Data da entrega</label>
                        <div className="relative">
                        <input 
                            type="date" 
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base md:text-lg text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent appearance-none" 
                        />
                        <Calendar size={24} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-sm md:text-base font-semibold text-gray-700">Observações (opcional)</label>
                        <textarea 
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Digite uma observação..." 
                        className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent resize-none"
                        ></textarea>
                    </div>
                    </div>

                    <button 
                    onClick={handleNext}
                    disabled={!selectedEmployeeId}
                    className="w-full bg-[#0B5C36] text-white font-bold text-lg rounded-2xl py-4 md:py-5 mt-10 shadow-lg hover:bg-[#094d2d] transition-all disabled:opacity-50"
                    >
                    Avançar para Seleção de EPIs
                    </button>
                </div>
              )}

              {/* --- STEP 2 --- */}
              {step === 2 && (
                <div className="w-full">
                   <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                       <h2 className="text-xl md:text-2xl font-bold text-gray-800">Selecione os EPIs</h2>
                       <div className="relative max-w-sm w-full">
                           <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                           <input 
                               type="text" 
                               value={searchEpi}
                               onChange={(e) => setSearchEpi(e.target.value)}
                               placeholder="Buscar EPI..."
                               className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-[#0B5C36] outline-none"
                           />
                       </div>
                   </div>

                   <div className="space-y-8">
                       {(Object.entries(episByCategory) as [string, any[]][]).sort().map(([category, items]) => (
                           <div key={category}>
                               <h3 className="text-lg font-bold text-[#0B5C36] border-b border-gray-200 pb-2 mb-4">{category}</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {items.map(epi => {
                                        const isSelected = selectedEpis.includes(epi.id);
                                        const outOfStock = epi.quantidade <= 0;
                                        return (
                                           <div 
                                               key={epi.id} 
                                               onClick={() => !outOfStock && toggleEpiSelection(epi.id)}
                                               className={cn(
                                                   "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all gap-4",
                                                   isSelected ? "border-[#0B5C36] bg-green-50 shadow-sm" : outOfStock ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed" : "border-gray-100 bg-white hover:border-[#0B5C36]/30"
                                               )}
                                           >
                                               <div className={cn("w-6 h-6 rounded border flex items-center justify-center shrink-0", isSelected ? "border-[#0B5C36] bg-[#0B5C36] text-white" : "border-gray-300")}>
                                                   {isSelected && <Check size={16} />}
                                               </div>
                                               <div className="flex-1">
                                                   <p className="font-semibold text-gray-800 line-clamp-1" title={epi.nome}>{epi.nome}</p>
                                                   <div className="flex justify-between items-center mt-1">
                                                       <p className="text-xs text-gray-500">CA: {epi.ca || 'N/A'}</p>
                                                       <p className={cn("text-xs font-bold", outOfStock ? "text-red-500" : "text-[#0B5C36]")}>
                                                           {outOfStock ? 'Sem estoque' : `Estoque: ${epi.quantidade}`}
                                                       </p>
                                                   </div>
                                               </div>
                                           </div>
                                        );
                                   })}
                               </div>
                           </div>
                       ))}
                       {Object.keys(episByCategory).length === 0 && (
                           <div className="text-center py-12 text-gray-500">
                               <p>Nenhum EPI encontrado.</p>
                           </div>
                       )}
                   </div>

                   <div className="sticky bottom-4 mt-8 flex gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100">
                       <button onClick={handlePrev} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
                       <button 
                           onClick={handleNext} 
                           disabled={selectedEpis.length === 0}
                           className="flex-1 bg-[#0B5C36] text-white font-bold py-4 rounded-xl hover:bg-[#094d2d] transition-colors disabled:opacity-50"
                       >
                           Revisar ({selectedEpis.length})
                       </button>
                   </div>
                </div>
              )}

              {/* --- STEP 3 --- */}
              {step === 3 && (
                <div className="max-w-2xl mx-auto w-full">
                   <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-4">Resumo da Entrega</h2>

                   {submitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                            <AlertCircle size={20} />
                            <p>{submitError}</p>
                        </div>
                   )}

                   <div className="bg-white border text-left border-gray-200 rounded-2xl p-6 shadow-sm mb-6 space-y-6">
                       <div>
                           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dados da Entrega</h3>
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
                                   <p className="text-xs text-gray-500 mb-1">Data</p>
                                   <p className="font-semibold text-gray-800">
                                       {new Date(deliveryDate).toLocaleDateString('pt-BR')}
                                   </p>
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
                           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">EPIs Selecionados ({selectedEpis.length})</h3>
                           <div className="space-y-3">
                               {selectedEpis.map(epiId => {
                                   const epi = epis.find(e => e.id === epiId);
                                   return epi ? (
                                       <div key={epi.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                           <div>
                                               <p className="font-semibold text-gray-800">{epi.nome}</p>
                                               <p className="text-xs text-gray-500">CA: {epi.ca || 'N/A'}</p>
                                           </div>
                                           <div className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">1 un.</div>
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

