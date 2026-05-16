import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Edit2, Trash2, Save, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface RoleManagementProps {
  onBack: () => void;
}

interface RoleItem {
  id: string;
  codigo: string;
  titulo: string;
  episExigidos?: string[];
  createdAt: number;
}

export function RoleManagement({ onBack }: RoleManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RoleItem>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cargos'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoleItem));
      setRoles(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cargos');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      codigo: '',
      titulo: '',
    });
    setViewMode('form');
  };

  const handleEdit = (role: RoleItem) => {
    setEditingId(role.id);
    setFormData(role);
    setViewMode('form');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cargo?')) {
      try {
        await deleteDoc(doc(db, 'cargos', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'cargos');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.titulo) {
      alert('Preencha os campos obrigatórios (Código, Título).');
      return;
    }

    try {
      const roleData = {
        codigo: formData.codigo,
        titulo: formData.titulo,
        episExigidos: formData.episExigidos || [],
      };

      if (editingId) {
        await updateDoc(doc(db, 'cargos', editingId), roleData);
      } else {
        await addDoc(collection(db, 'cargos'), {
          ...roleData,
          createdAt: Date.now()
        });
      }
      setViewMode('list');
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'cargos');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={viewMode === 'form' ? () => setViewMode('list') : onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold">{viewMode === 'form' ? (editingId ? 'Editar Cargo' : 'Cadastrar Cargo') : 'Gerenciar Cargos'}</h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col w-full max-w-5xl mx-auto md:px-8">
        {viewMode === 'list' ? (
          <div className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="relative flex-1 mr-4">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar cargo..." 
                  className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0B5C36] outline-none"
                />
              </div>
              <button onClick={handleCreateNew} className="bg-[#0B5C36] text-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-[#094d2d] transition-colors whitespace-nowrap">
                <Plus size={20} className="md:mr-2" />
                <span className="hidden md:inline font-semibold">Novo Cargo</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
              {roles.map(role => (
                <div key={role.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100 overflow-hidden">
                    <Briefcase size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{role.titulo}</h4>
                    <p className="text-xs text-gray-500">Cód: {role.codigo}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{role.episExigidos?.length || 0} EPI(s) exigido(s)</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleEdit(role)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {roles.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  Nenhum cargo cadastrado.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 space-y-6">
              
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Código do Cargo</label>
                  <input type="text" name="codigo" value={formData.codigo || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: C-001" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Título / Nome</label>
                  <input type="text" name="titulo" value={formData.titulo || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: Pedreiro" />
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-[#0B5C36] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-md hover:bg-[#094d2d] transition-colors mt-4">
                <Save size={20} />
                Salvar Cargo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
