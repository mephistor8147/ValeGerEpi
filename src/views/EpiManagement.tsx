import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Edit2, Trash2, Camera, Upload, X, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface EpiManagementProps {
  onBack: () => void;
}

interface EpiItem {
  id: string;
  codigo: string;
  ca: string;
  obraId: string;
  nome: string;
  categoria: string;
  qualidade: string;
  quantidade?: string | number;
  dataValidade: string;
  fotoUrl?: string;
  createdAt: number;
}

export function EpiManagement({ onBack }: EpiManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [epis, setEpis] = useState<EpiItem[]>([]);
  const [obras, setObras] = useState<{id: string, nome: string}[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EpiItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubEpis = onSnapshot(collection(db, 'epis'), (snapshot) => {
      setEpis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EpiItem)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'epis'));

    const unsubObras = onSnapshot(collection(db, 'obras'), (snapshot) => {
      setObras(snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'obras'));

    return () => { unsubEpis(); unsubObras(); };
  }, []);

  const categorias = [
    'Proteção da Cabeça',
    'Proteção das Mãos',
    'Proteção Ocular',
    'Proteção contra Queda',
    'Proteção dos Pés',
    'Proteção do Corpo',
    'Proteção Respiratória',
    'Proteção Auditiva'
  ].sort();

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      codigo: '',
      nome: '',
    });
    setViewMode('form');
  };

  const handleEdit = (epi: EpiItem) => {
    setEditingId(epi.id);
    setFormData(epi);
    setViewMode('form');
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteDoc(doc(db, 'epis', itemToDelete));
        setItemToDelete(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'epis');
      }
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.categoria) {
      setSubmitError('Preencha os campos obrigatórios (Nome, Categoria).');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const epiData = {
        codigo: formData.codigo || '',
        ca: formData.ca || '',
        obraId: formData.obraId || '',
        nome: formData.nome,
        categoria: formData.categoria,
        qualidade: formData.qualidade || '',
        quantidade: Number(formData.quantidade) || 0,
        dataValidade: formData.dataValidade || '',
        fotoUrl: formData.fotoUrl || '',
      };

      if (editingId) {
        await updateDoc(doc(db, 'epis', editingId), epiData);
      } else {
        await addDoc(collection(db, 'epis'), {
          ...epiData,
          createdAt: Date.now()
        });
      }
      setViewMode('list');
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'epis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData({ ...formData, fotoUrl: dataUrl });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredEpis = epis.filter(epi => 
    epi.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    epi.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    epi.ca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={viewMode === 'form' ? () => setViewMode('list') : onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold">{viewMode === 'form' ? (editingId ? 'Editar EPI' : 'Cadastrar EPI') : 'Gerenciar EPIs'}</h1>
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
                  placeholder="Buscar EPI..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0B5C36] outline-none"
                />
              </div>
              <button onClick={handleCreateNew} className="bg-[#0B5C36] text-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-[#094d2d] transition-colors">
                <Plus size={20} className="md:mr-2" />
                <span className="hidden md:inline font-semibold">Novo EPI</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
              {filteredEpis.map(epi => (
                <div key={epi.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                    {epi.fotoUrl ? (
                      <img src={epi.fotoUrl} alt="EPI" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl">🧰</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{epi.nome}</h4>
                    <p className="text-xs text-gray-500">Cód: {epi.codigo} | CA: {epi.ca} | {obras.find(o => o.id === epi.obraId)?.nome || 'S/ Obra'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">{epi.categoria}</p>
                      <span className="text-[10px] text-[#0B5C36] bg-green-50 px-2 py-0.5 rounded-full font-bold">Qtd: {epi.quantidade || 0}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleEdit(epi)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(epi.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredEpis.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  Nenhum EPI encontrado.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 space-y-6">
              
              {/* Image Upload Area */}
              <div className="flex flex-col items-center justify-center gap-3">
                <label className="w-28 h-28 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer">
                  {formData.fotoUrl ? (
                    <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={24} className="text-white" />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <p className="text-sm font-medium text-[#0B5C36]">Adicionar foto (Câmera/Envio)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Código do EPI</label>
                  <input type="text" name="codigo" value={formData.codigo || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: EPI-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">C.A. (Certificado de Aprovação)</label>
                  <input type="text" name="ca" value={formData.ca || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: 12345" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nome do Equipamento</label>
                  <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Ex: Capacete de Segurança" />
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
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Categoria</label>
                  <select name="categoria" value={formData.categoria || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione a categoria</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Quantidade/Estoque</label>
                  <input type="number" name="quantidade" value={formData.quantidade || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" placeholder="Digite a quantidade" min="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Qualidade/Estado</label>
                  <select name="qualidade" value={formData.qualidade || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Selecione</option>
                    <option value="Novo">Novo</option>
                    <option value="Bom">Bom</option>
                    <option value="Regular">Regular</option>
                    <option value="Precisa de Reparo">Precisa de Reparo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Data de Validade</label>
                  <input type="date" name="dataValidade" value={formData.dataValidade || ''} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" />
                </div>
              </div>

              {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
                      {submitError}
                  </div>
              )}

              <button disabled={isSubmitting} onClick={handleSave} className="w-full bg-[#0B5C36] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-md hover:bg-[#094d2d] transition-colors mt-4 disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar EPI
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir EPI</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir este EPI? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
