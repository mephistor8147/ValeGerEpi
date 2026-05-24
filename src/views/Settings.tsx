import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  PackagePlus,
  UserPlus,
  Building2,
  Briefcase,
  FolderPlus,
  ShieldCheck,
  Construction,
  LogOut,
  Sun,
  Moon,
  Settings as SettingsIcon,
  Database,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  Users,
  Package
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useRef } from "react";

interface SettingsProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export function Settings({ onBack, onNavigate }: SettingsProps) {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'dados'>('geral');

  useEffect(() => {
    setIsDark(!document.documentElement.classList.contains("light"));
  }, []);

  const toggleTheme = () => {
    const isNowLight = isDark;
    if (isNowLight) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isNowLight);
  };

  const settingsItems = [
    {
      id: "themeToggle",
      title: isDark ? "Modo Claro" : "Modo Escuro",
      desc: "Alternar tema do aplicativo",
      icon: isDark ? Sun : Moon,
      color: "text-amber-500",
      bg: "bg-amber-100",
      construction: false,
      action: toggleTheme,
    },
    {
      id: "appSettings",
      title: "Configurações do APP",
      desc: "Ajustes gerais do aplicativo",
      icon: SettingsIcon,
      color: "text-slate-500",
      bg: "bg-slate-100",
      construction: true,
    },
    {
      id: "epiManagement",
      title: "Cadastrar EPI",
      desc: "Adicionar novo equipamento ao catálogo",
      icon: PackagePlus,
      color: "text-blue-500",
      bg: "bg-blue-100",
      construction: false,
    },
    {
      id: "employeeManagement",
      title: "Cadastrar Funcionário",
      desc: "Registrar novo colaborador no sistema",
      icon: UserPlus,
      color: "text-[#FFA767]",
      bg: "bg-[#253B44]",
      construction: false,
    },
    {
      id: "siteManagement",
      title: "Cadastrar Obra",
      desc: "Adicionar novo local de trabalho",
      icon: Building2,
      color: "text-amber-500",
      bg: "bg-amber-100",
      construction: false,
    },
    {
      id: "roleManagement",
      title: "Cadastrar Cargo",
      desc: "Gerenciar cargos e funções",
      icon: Briefcase,
      color: "text-purple-500",
      bg: "bg-purple-100",
      construction: false,
    },
    {
      id: "binderCreation",
      title: "Criar Fichário",
      desc: "Organizar documentos e registros",
      icon: FolderPlus,
      color: "text-rose-500",
      bg: "bg-rose-100",
      construction: false,
    },
    {
      id: "adminManagement",
      title: "Gerenciar Administradores",
      desc: "Controle de acesso e permissões",
      icon: ShieldCheck,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
      construction: false,
    },
  ];

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      auth.signOut();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sanitizeDataForExcel = (data: any[]) => {
    return data.map(item => {
      const sanitizedItem: any = {};
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          let value = item[key];
          if (typeof value === 'string' && value.length > 30000) {
            value = value.substring(0, 30000) + '...[TRUNCATED]';
          } else if (value && typeof value === 'object') {
            if (typeof value.toDate === 'function') {
              value = value.toDate().toISOString();
            } else {
              const strVal = JSON.stringify(value);
              value = strVal.length > 30000 ? strVal.substring(0, 30000) + '...[TRUNCATED]' : strVal;
            }
          }
          sanitizedItem[key] = value;
        }
      }
      return sanitizedItem;
    });
  };

  const exportCollectionToExcel = async (collectionName: string, fileName: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data: any[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });

      const sanitizedData = sanitizeDataForExcel(data);
      const worksheet = XLSX.utils.json_to_sheet(sanitizedData.length ? sanitizedData : [{ info: 'Nenhum dado' }]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
      XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert(`Erro ao exportar ${fileName}.`);
    }
  };

  const exportFullBackup = async () => {
    try {
      const collections = ["funcionarios", "epis", "entregas", "cargos", "obras", "alertas", "admins"];
      const workbook = XLSX.utils.book_new();
      
      for (const col of collections) {
        const querySnapshot = await getDocs(collection(db, col));
        const data: any[] = [];
        querySnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() });
        });
        const sanitizedData = sanitizeDataForExcel(data);
        const worksheet = XLSX.utils.json_to_sheet(sanitizedData.length ? sanitizedData : [{ info: 'Nenhum dado' }]);
        XLSX.utils.book_append_sheet(workbook, worksheet, col);
      }
      
      XLSX.writeFile(workbook, `Backup_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar backup completo.");
    }
  };

  const clearCollection = async (collectionName: string, nomeAmigavel: string) => {
    if (!confirm(`TEM CERTEZA ABSOLUTA que deseja EXCLUIR TODOS OS DADOS de ${nomeAmigavel.toUpperCase()}? Esta ação NÃO PODE ser desfeita.`)) {
      return;
    }
    
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const docs = querySnapshot.docs;
      
      for (let i = 0; i < docs.length; i += 500) {
        const chunk = docs.slice(i, i + 500);
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          batch.delete(doc(db, collectionName, d.id));
        });
        await batch.commit();
      }
      
      alert(`Todos os ${docs.length} registros de ${nomeAmigavel} foram excluídos com sucesso.`);
    } catch (error) {
      console.error(error);
      alert(`Erro ao limpar ${nomeAmigavel}.`);
    }
  };

  const handleImportEmployees = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
          alert("O arquivo está vazio ou inválido.");
          return;
        }
        
        let count = 0;
        for (let i = 0; i < data.length; i += 500) {
          const chunk = data.slice(i, i + 500);
          const batch = writeBatch(db);
          chunk.forEach((row: any) => {
            const docRef = doc(collection(db, "funcionarios"));
            const { id, ...employeeData } = row; // exclude ID from import to gen new ones
            batch.set(docRef, employeeData);
            count++;
          });
          await batch.commit();
        }
        
        alert(`Importação concluída: ${count} funcionários adicionados.`);
      } catch (error) {
        console.error(error);
        alert("Erro ao importar funcionários. Verifique o formato do arquivo.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  const dataItems = [
    {
      id: "importExportEmployees",
      title: "Importar Funcionários",
      desc: "Importar dados via .xlsx",
      icon: FileSpreadsheet,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
      action: () => fileInputRef.current?.click(),
    },
    {
      id: "backupFull",
      title: "Backup Completo",
      desc: "Todos os dados do sistema",
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-100",
      action: () => exportFullBackup(),
    },
    {
      id: "backupEmployees",
      title: "Backup Funcionários",
      desc: "Apenas dados de funcionários",
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
      action: () => exportCollectionToExcel("funcionarios", "Backup_Funcionarios"),
    },
    {
      id: "backupEpis",
      title: "Backup EPIs",
      desc: "Apenas catálogo de EPIs",
      icon: Package,
      color: "text-purple-500",
      bg: "bg-purple-100",
      action: () => exportCollectionToExcel("epis", "Backup_EPIs"),
    },
    {
      id: "backupBinder",
      title: "Backup Fichário",
      desc: "Apenas dados de fichários",
      icon: FolderPlus,
      color: "text-amber-500",
      bg: "bg-amber-100",
      action: () => exportCollectionToExcel("entregas", "Backup_Ficharios"),
    },
    {
      id: "backupReports",
      title: "Backup Relatórios",
      desc: "Exportar estado de alertas",
      icon: Download,
      color: "text-teal-500",
      bg: "bg-teal-100",
      action: () => exportCollectionToExcel("alertas", "Backup_Alertas_Relatorios"),
    },
    {
      id: "clearEpis",
      title: "Limpar EPIs",
      desc: "Remover todos os EPIs",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-100",
      action: () => clearCollection("epis", "EPIs"),
    },
    {
      id: "clearEmployees",
      title: "Limpar Funcionários",
      desc: "Remover todos funcionários",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-100",
      action: () => clearCollection("funcionarios", "Funcionários"),
    },
    {
      id: "clearBinders",
      title: "Limpar Fichários",
      desc: "Remover todos os fichários",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-100",
      action: () => clearCollection("entregas", "Fichários (Entregas e Devoluções)"),
    },
    {
      id: "clearReports",
      title: "Limpar Relatórios",
      desc: "Remover todas notificações e relatórios",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-100",
      action: () => clearCollection("alertas", "Relatórios e Alertas"),
    },
  ];

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-6 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex flex-col shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <div className="flex items-center md:justify-between text-white w-full">
          <button
            onClick={onBack}
            className="p-2 -ml-2 md:hidden hover:bg-[#0D2027] hover:text-[#FFA767] rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="hidden md:block p-2">
            <ChevronLeft size={24} className="opacity-0" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm flex-1 text-center md:flex-none">
            Configurações
          </h1>
          <div className="w-8 md:hidden"></div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#0D2027]/50 backdrop-blur-sm self-center mt-6 rounded-xl p-1 border border-[#253B44]">
          <button
            onClick={() => setActiveTab('geral')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'geral' ? "bg-[#FFA767] text-[#152A32] shadow-sm" : "text-[#E2E8F0] hover:text-[#FFA767]"
            )}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('dados')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'dados' ? "bg-[#FFA767] text-[#152A32] shadow-sm" : "text-[#E2E8F0] hover:text-[#FFA767]"
            )}
          >
            Ger Dados
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#0D2027] pb-safe pb-24">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {(activeTab === 'geral' ? settingsItems : dataItems).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (!item.construction) {
                    onNavigate(item.id);
                  }
                }}
                className={cn(
                  "w-full bg-[#152A32] p-4 rounded-xl shadow-sm border border-[#253B44] flex flex-row items-center gap-4 text-left transition-all relative overflow-hidden",
                  item.construction
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:shadow-md hover:border-[#FFA767]/20 group hover:opacity-100",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform",
                    !item.construction && "group-hover:scale-105",
                    item.bg,
                    item.color,
                  )}
                >
                  <item.icon size={24} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-[#F1F5F9] text-lg leading-tight truncate">
                      {item.title}
                    </h3>
                    {item.construction && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-100 shrink-0">
                        <Construction size={10} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase hidden sm:inline">
                          Em constr.
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#64748B] leading-snug line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 border-t border-[#2C4550] pt-8 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <LogOut size={20} />
              Sair do Sistema
            </button>
          </div>
          
          {/* File Input Oculto para Importação */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx,.xls" 
            onChange={handleImportEmployees} 
          />
        </div>
      </div>
    </div>
  );
}
