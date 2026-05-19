import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertTriangle, Clock, Bell, CheckCircle2, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface AlertsProps {
  onBack: () => void;
}

export function Alerts({ onBack }: AlertsProps) {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'alertas'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlertas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const markAsResolved = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'alertas', id), {
        resolvido: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'alertas');
    }
  };

  const deleteAlert = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este alerta?')) {
      try {
        await deleteDoc(doc(db, 'alertas', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'alertas');
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center md:justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}><ChevronLeft size={24} /></div>
        <h1 className="text-xl md:text-2xl font-bold flex-1 text-center md:flex-none md:ml-4">Central de Alertas</h1>
        <div className="w-8 md:hidden"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-safe">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {loading ? (
             <div className="flex justify-center items-center py-12">
                 <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : alertas.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
               <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
               <p className="text-lg">Tudo tranquilo por aqui!</p>
               <p className="text-sm mt-2">Nenhum alerta foi gerado no sistema.</p>
            </div>
          ) : (
            alertas.map(alerta => (
               <div key={alerta.id} className={cn(
                 "bg-white rounded-2xl p-5 border-l-4 shadow-sm flex items-start gap-4 transition-all hover:shadow-md",
                 alerta.resolvido ? "border-gray-300 opacity-60" : 
                 alerta.tipo === 'error' ? "border-red-500" : 
                 alerta.tipo === 'warning' ? "border-amber-500" : "border-blue-500"
               )}>
                  <div className="shrink-0 mt-1">
                    {alerta.resolvido ? <CheckCircle2 size={24} className="text-gray-400" /> :
                     alerta.tipo === 'error' ? <AlertTriangle size={24} className="text-red-500" /> :
                     alerta.tipo === 'warning' ? <Clock size={24} className="text-amber-500" /> :
                     <Bell size={24} className="text-blue-500" />
                    }
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={cn("font-bold text-lg", alerta.resolvido ? "text-gray-500 line-through" : "text-gray-800")}>
                          {alerta.mensagem}
                        </h3>
                        {alerta.createdAt && (
                          <span className="text-xs text-gray-400 font-medium ml-4 shrink-0">
                            {new Date(alerta.createdAt).toLocaleDateString()}
                          </span>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {alerta.tipo === 'error' ? 'Atenção imediata requerida. Recomendamos avaliar a situação com urgência.' :
                       alerta.tipo === 'warning' ? 'Recomendado acompanhar. Este item pode se tornar crítico em breve.' :
                       'Aviso de rotina para seu conhecimento.'}
                    </p>
                    
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => markAsResolved(alerta.id, alerta.resolvido)}
                         className={cn(
                           "text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                           alerta.resolvido ? "text-gray-600 bg-gray-100 hover:bg-gray-200" : "text-green-700 bg-green-50 hover:bg-green-100"
                         )}
                       >
                         {alerta.resolvido ? 'Reabrir alerta' : 'Marcar como resolvido'}
                       </button>
                       <button 
                         onClick={() => deleteAlert(alerta.id)}
                         className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
               </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
