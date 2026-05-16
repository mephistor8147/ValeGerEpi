import React from 'react';
import { ChevronLeft, PackagePlus, UserPlus, Building2, Briefcase, FolderPlus, ShieldCheck, Construction, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';

interface SettingsProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export function Settings({ onBack, onNavigate }: SettingsProps) {
  const settingsItems = [
    { id: 'epiManagement', title: 'Cadastrar EPI', desc: 'Adicionar novo equipamento ao catálogo', icon: PackagePlus, color: 'text-blue-500', bg: 'bg-blue-100', construction: false },
    { id: 'employeeManagement', title: 'Cadastrar Funcionário', desc: 'Registrar novo colaborador no sistema', icon: UserPlus, color: 'text-green-500', bg: 'bg-green-100', construction: false },
    { id: 'siteManagement', title: 'Cadastrar Obra', desc: 'Adicionar novo local de trabalho', icon: Building2, color: 'text-amber-500', bg: 'bg-amber-100', construction: false },
    { id: 'roleManagement', title: 'Cadastrar Cargo', desc: 'Gerenciar cargos e funções', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-100', construction: false },
    { id: 'binderCreation', title: 'Criar Fichário', desc: 'Organizar documentos e registros', icon: FolderPlus, color: 'text-rose-500', bg: 'bg-rose-100', construction: false },
    { id: 'adminManagement', title: 'Gerenciar Administradores', desc: 'Controle de acesso e permissões', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-100', construction: false },
  ];

  const handleLogout = () => {
    if(confirm('Deseja realmente sair do sistema?')) {
      auth.signOut();
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center md:justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 md:hidden hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold flex-1 text-center md:flex-none">Configurações</h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-gray-50 pb-safe pb-24">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {settingsItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  if (!item.construction) {
                    onNavigate(item.id);
                  }
                }}
                className={cn("w-full bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4 text-left transition-all relative overflow-hidden", item.construction ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:border-[#0B5C36]/20 group hover:opacity-100")}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform", !item.construction && "group-hover:scale-105", item.bg, item.color)}>
                    <item.icon size={28} />
                  </div>
                  {item.construction && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 shadow-sm">
                      <Construction size={14} className="text-amber-500" />
                      <span className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-wide">Em construção</span>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-gray-800 text-lg md:text-xl mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-snug">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 border-t border-gray-200 pt-8 flex justify-center">
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-6 py-3 rounded-xl font-semibold transition-colors"
             >
                <LogOut size={20} />
                Sair do Sistema
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
