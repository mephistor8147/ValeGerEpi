import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Edit2, Trash2, Camera, Upload, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface EmployeeManagementProps {
  onBack: () => void;
}

interface EmployeeItem {
  id: string;
  matricula: string;
  nome: string;
  obraId: string;
  cargoId: string;
  camisa?: string;
  calca?: string;
  bota?: string;
  fotoUrl?: string;
  createdAt: number;
}

export function EmployeeManagement({ onBack }: EmployeeManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [cargos, setCargos] = useState<{id: string, titulo: string}[]>([]);
  const [obras, setObras] = useState<{id: string, nome: string}[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeItem>>({});

  const tamanhosCamisa = ['P', 'M', 'G', 'GG', 'XG', 'XGG'];
  const tamanhosCalca = ['P', 'M', 'G', 'GG', 'XG', 'XGG'];
  const tamanhosBota = ['38', '39', '40', '41', '42', '43', '44', '45'];

  useEffect(() => {
    const unsubEmp = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeItem)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'funcionarios'));

    const unsubCargos = onSnapshot(collection(db, 'cargos'), (snapshot) => {
      setCargos(snapshot.docs.map(d => ({ id: d.id, titulo: d.data().titulo })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cargos'));

    const unsubObras = onSnapshot(collection(db, 'obras'), (snapshot) => {
      setObras(snapshot.docs.map(d => ({ id: d.id, nome: d.data().nome })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'obras'));

    return () => {
      unsubEmp(); unsubCargos(); unsubObras();
    };
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      matricula: '',
      nome: '',
      obraId: '',
      cargoId: '',
    });
    setViewMode('form');
  };

  const handleEdit = (employee: EmployeeItem) => {
    setEditingId(employee.id);
    setFormData(employee);
    setViewMode('form');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        await deleteDoc(doc(db, 'funcionarios', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'funcionarios');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.matricula || !formData.nome || !formData.obraId || !formData.cargoId) {
      alert('Preencha os campos obrigatórios (Matrícula, Nome, Obra, Cargo).');
      return;
    }

    if (!confirm('Tem certeza que deseja salvar este funcionário?')) {
      return;
    }

    try {
      const empData = {
        matricula: formData.matricula,
        nome: formData.nome,
        obraId: formData.obraId,
        cargoId: formData.cargoId,
        camisa: formData.camisa || '',
        calca: formData.calca || '',
        bota: formData.bota || '',
        fotoUrl: formData.fotoUrl || '',
      };

      if (editingId) {
        await updateDoc(doc(db, 'funcionarios', editingId), empData);
      } else {
        await addDoc(collection(db, 'funcionarios'), {
          ...empData,
          createdAt: Date.now()
        });
      }
      setViewMode('list');
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'funcionarios');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={viewMode === 'form' ? () => setViewMode('list') : onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold">{viewMode === 'form' ? (editingId ? 'Editar Funcionário' : 'Cadastrar Funcionário') : 'Gerenciar Funcionários'}</h1>
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
                  placeholder="Buscar funcionário..." 
                  className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0B5C36] outline-none"
                />
              </div>
              <button onClick={handleCreateNew} className="bg-[#0B5C36] text-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-[#094d2d] transition-colors whitespace-nowrap">
                <Plus size={20} className="md:mr-2" />
                <span className="hidden md:inline font-semibold">Novo Funcionário</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
              {employees.map(emp => (
                <div key={emp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                    {emp.fotoUrl ? (
                      <img src={emp.fotoUrl} alt="Funcionário" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{emp.nome}</h4>
                    <p className="text-xs text-gray-500">Matrícula: {emp.matricula} | {cargos.find(c => c.id === emp.cargoId)?.titulo || 'S/ Cargo'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-gray-400 font-semibold">{obras.find(o => o.id === emp.obraId)?.nome || 'S/ Obra'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleEdit(emp)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {employees.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  Nenhum funcionário cadastrado.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 space-y-6">
              
              {/* Image Upload Area */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-28 h-28 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 relative overflow-hidden group">
                  {formData.fotoUrl ? (
                    <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-[#0B5C36] cursor-pointer hover:underline">Adicionar foto (Câmera/Envio)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Matrícula</label>
                  <input type="text" name="matricula" value={formData.matricula || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: 0001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nome</label>
                  <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: Carlos Alberto" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Cargo</label>
                  <select name="cargoId" value={formData.cargoId || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione o cargo</option>
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>{c.titulo}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Obra</label>
                  <select name="obraId" value={formData.obraId || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione a obra</option>
                    {obras.map(o => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                </div>
                
                {/* Tamanhos de Uniforme / EPI de Corpo */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tamanho da Camisa</label>
                  <select name="camisa" value={formData.camisa || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione o tamanho</option>
                    {tamanhosCamisa.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tamanho da Calça</label>
                  <select name="calca" value={formData.calca || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione o tamanho</option>
                    {tamanhosCalca.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tamanho da Bota</label>
                  <select name="bota" value={formData.bota || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione o tamanho</option>
                    {tamanhosBota.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-[#0B5C36] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-md hover:bg-[#094d2d] transition-colors mt-4">
                <Save size={20} />
                Salvar Funcionário
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
