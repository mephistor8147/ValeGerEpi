import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Edit2, Trash2, Camera, Upload, Save, Shield, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth, handleFirestoreError, OperationType } from '../lib/firebase';

interface AdminManagementProps {
  onBack: () => void;
}

interface AdminItem {
  id: string;
  funcionarioId: string;
  nomeFuncionario: string;
  email: string;
  contato?: string;
  nivel: string;
  status: string;
  fotoUrl?: string;
  authUid?: string;
  createdAt: number;
}

export function AdminManagement({ onBack }: AdminManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [showPassword, setShowPassword] = useState(false);
  
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [funcionarios, setFuncionarios] = useState<{id: string, nome: string, matricula: string}[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AdminItem> & { senha?: string }>({});

  const niveisAcesso = [
    { value: 'master', label: 'Master' },
    { value: 'coordenador', label: 'Coordenador' },
    { value: 'despachante', label: 'Despachante' }
  ];

  useEffect(() => {
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminItem)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'admins'));

    const unsubFuncs = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      setFuncionarios(snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome, matricula: doc.data().matricula })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'funcionarios'));

    return () => { unsubAdmins(); unsubFuncs(); };
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      status: 'Ativo',
    });
    setShowPassword(false);
    setViewMode('form');
  };

  const handleEdit = (admin: AdminItem) => {
    setEditingId(admin.id);
    setFormData({ ...admin, senha: '' });
    setShowPassword(false);
    setViewMode('form');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover as permissões deste administrador?')) {
      try {
        await deleteDoc(doc(db, 'admins', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'admins');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.funcionarioId || !formData.nivel || !formData.status || !formData.email) {
      alert('Preencha os campos obrigatórios (Funcionário, E-mail, Nível, Status).');
      return;
    }

    if (!confirm('Tem certeza que deseja salvar este administrador?')) {
      return;
    }

    const funcionario = funcionarios.find(f => f.id === formData.funcionarioId);
    
    try {
      let authUid = formData.authUid;

      // Se for novo admin e tiver senha, cria no Firebase Auth
      if (!editingId && formData.senha) {
        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.senha);
          authUid = userCredential.user.uid;
        } catch (authErr: any) {
          alert('Erro ao criar usuário: ' + authErr.message);
          return;
        }
      }

      const adminData = {
        funcionarioId: formData.funcionarioId,
        nomeFuncionario: funcionario?.nome || 'Desconhecido',
        email: formData.email,
        nivel: formData.nivel,
        status: formData.status,
        contato: formData.contato || '',
        fotoUrl: formData.fotoUrl || '',
        authUid: authUid || null,
      };

      if (editingId) {
        await updateDoc(doc(db, 'admins', editingId), adminData);
      } else {
        await addDoc(collection(db, 'admins'), { 
          ...adminData, 
          createdAt: Date.now()
        });
      }
      setViewMode('list');
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'admins');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getNivelColor = (nivel: string) => {
    switch(nivel) {
      case 'master': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'coordenador': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'despachante': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={viewMode === 'form' ? () => setViewMode('list') : onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={viewMode === 'form' ? () => setViewMode('list') : onBack}><ChevronLeft size={24} className="hover:text-gray-200" /></div>
        <h1 className="text-xl md:text-2xl font-bold">{viewMode === 'form' ? (editingId ? 'Editar Administrador' : 'Cadastrar Administrador') : 'Gerenciar Administradores'}</h1>
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
                  placeholder="Buscar administrador..." 
                  className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0B5C36] outline-none"
                />
              </div>
              <button onClick={handleCreateNew} className="bg-[#0B5C36] text-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-[#094d2d] transition-colors whitespace-nowrap">
                <Plus size={20} className="md:mr-2" />
                <span className="hidden md:inline font-semibold">Novo Admin</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
              {admins.map(admin => (
                <div key={admin.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden text-indigo-600">
                    {admin.fotoUrl ? (
                      <img src={admin.fotoUrl} alt="Admin" className="w-full h-full object-cover" />
                    ) : (
                      <Shield size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{admin.nomeFuncionario}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{admin.contato}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border",
                        getNivelColor(admin.nivel)
                      )}>
                        {niveisAcesso.find(n => n.value === admin.nivel)?.label || admin.nivel}
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        admin.status === 'Ativo' ? "text-green-600" : "text-gray-500"
                      )}>
                        • {admin.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleEdit(admin)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  Nenhum administrador cadastrado.
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Selecionar Funcionário</label>
                  <select 
                    name="funcionarioId" 
                    value={formData.funcionarioId || ''} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer"
                    disabled={!!editingId} // Prevent changing the employee if editing
                  >
                    <option value="" disabled>Selecione um funcionário da base</option>
                    {funcionarios.map(f => (
                      <option key={f.id} value={f.id}>{f.nome} (Mat: {f.matricula})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Promover a (Nível de Acesso)</label>
                  <select 
                    name="nivel" 
                    value={formData.nivel || ''} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione o nível de acesso</option>
                    {niveisAcesso.map(n => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Email de Acesso</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" 
                    placeholder="Ex: admin@obra.com" 
                    disabled={!!editingId}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Contato (Telefone/WhatsApp)</label>
                  <input 
                    type="text" 
                    name="contato" 
                    value={formData.contato || ''} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none" 
                    placeholder="Ex: (11) 99999-9999" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Senha de Acesso</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="senha" 
                      value={formData.senha || ''} 
                      onChange={handleChange} 
                      className="w-full border border-gray-200 rounded-xl py-3 pl-3 pr-12 focus:ring-2 focus:ring-[#0B5C36] outline-none" 
                      placeholder={editingId ? "Deixe em branco para manter" : "Digite uma senha segura"} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select 
                    name="status" 
                    value={formData.status || ''} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none appearance-none cursor-pointer"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1">
                  <Shield size={16} /> Permissões
                </h4>
                <p className="text-xs text-amber-700">
                  {formData.nivel === 'master' && 'Acesso total ao sistema, incluindo configurações e exclusão de dados sensíveis.'}
                  {formData.nivel === 'coordenador' && 'Pode gerenciar obras, funcionários e EPIs, mas sem acesso à exclusão de dados.'}
                  {formData.nivel === 'despachante' && 'Pode apenas realizar entregas (criar fichários) e visualizar relatórios básicos.'}
                  {!formData.nivel && 'Selecione um nível acima para ver os detalhes da permissão.'}
                </p>
              </div>

              <button onClick={handleSave} className="w-full bg-[#0B5C36] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-md hover:bg-[#094d2d] transition-colors mt-6">
                <Save size={20} />
                Salvar Administrador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
